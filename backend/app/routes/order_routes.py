import hmac
import hashlib

try:
    import razorpay
except ImportError:  # Allows the API to start with a clear checkout error until dependencies are installed.
    razorpay = None
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt
from sqlalchemy import func

from app.extensions import db
from app.middleware.auth_middleware import jwt_required, role_required
from app.models.cart import Cart
from app.models.order import Order, OrderItem

order_bp = Blueprint("orders", __name__, url_prefix="/api/orders")


def _client():
    key_id, secret = current_app.config["RAZORPAY_KEY_ID"], current_app.config["RAZORPAY_KEY_SECRET"]
    return razorpay.Client(auth=(key_id, secret)) if razorpay and key_id and secret else None


@order_bp.route("/checkout", methods=["POST"])
@jwt_required
def create_checkout():
    cart = Cart.query.filter_by(user_id=get_jwt()["id"]).first()
    if not cart or not cart.items:
        return jsonify({"success": False, "message": "Your cart is empty."}), 400
    client = _client()
    if not client:
        return jsonify({"success": False, "message": "Razorpay is not configured."}), 503
    amount = int(round(cart.to_dict()["total"] * 100))
    try:
        payment_order = client.order.create({"amount": amount, "currency": "INR", "receipt": f"cart_{cart.id}"})
    except Exception:
        current_app.logger.exception("Unable to create Razorpay order")
        return jsonify({"success": False, "message": "Could not start checkout. Please try again."}), 502
    return jsonify({"success": True, "data": {"order_id": payment_order["id"], "amount": amount, "currency": "INR", "key": current_app.config["RAZORPAY_KEY_ID"]}})


@order_bp.route("/verify", methods=["POST"])
@jwt_required
def verify_checkout():
    data = request.get_json(silent=True) or {}
    razorpay_order_id, payment_id, signature = (data.get(key) for key in ("razorpay_order_id", "razorpay_payment_id", "razorpay_signature"))
    if not all((razorpay_order_id, payment_id, signature)):
        return jsonify({"success": False, "message": "Incomplete payment response."}), 400
    secret = current_app.config["RAZORPAY_KEY_SECRET"]
    expected = hmac.new(secret.encode(), f"{razorpay_order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest() if secret else ""
    if not hmac.compare_digest(expected, signature):
        return jsonify({"success": False, "message": "Payment verification failed."}), 400
    existing = Order.query.filter_by(razorpay_payment_id=payment_id).first()
    if existing:
        return jsonify({"success": True, "data": {"order": existing.to_dict()}})
    cart = Cart.query.filter_by(user_id=get_jwt()["id"]).first()
    if not cart or not cart.items:
        return jsonify({"success": False, "message": "Cart is empty; order could not be created."}), 400
    cart_data = cart.to_dict()
    order = Order(user_id=get_jwt()["id"], razorpay_order_id=razorpay_order_id, razorpay_payment_id=payment_id, total=cart_data["total"])
    db.session.add(order)
    for item in cart.items:
        product = item.product
        if product.stock is not None and item.quantity > product.stock:
            db.session.rollback()
            return jsonify({"success": False, "message": f"Insufficient stock for {product.name}."}), 400
        if product.stock is not None:
            product.stock -= item.quantity
        order.items.append(OrderItem(product_id=product.id, seller_id=product.seller_id, name=product.name, image_url=product.image_url, unit_price=float(product.price), quantity=item.quantity))
    for item in list(cart.items):
        db.session.delete(item)
    db.session.commit()
    return jsonify({"success": True, "message": "Payment verified and order created.", "data": {"order": order.to_dict()}}), 201


@order_bp.route("", methods=["GET"])
@jwt_required
def get_orders():
    claims = get_jwt()
    query = Order.query.order_by(Order.created_at.desc())
    if claims["role"] == "user":
        orders = query.filter_by(user_id=claims["id"]).all()
        return jsonify({"success": True, "data": {"orders": [order.to_dict() for order in orders]}})
    if claims["role"] == "seller":
        orders = query.join(OrderItem).filter(OrderItem.seller_id == claims["id"]).distinct().all()
        return jsonify({"success": True, "data": {"orders": [order.to_dict(seller_id=claims["id"]) for order in orders]}})
    return jsonify({"success": True, "data": {"orders": [order.to_dict() for order in query.all()]}})


@order_bp.route("/stats", methods=["GET"])
@role_required("admin", "seller")
def get_stats():
    claims = get_jwt()
    if claims["role"] == "admin":
        total_orders, total_sales = db.session.query(func.count(Order.id), func.coalesce(func.sum(Order.total), 0)).one()
        return jsonify({"success": True, "data": {"total_orders": total_orders, "total_sales": float(total_sales)}})
    total_orders = db.session.query(func.count(func.distinct(OrderItem.order_id))).filter(OrderItem.seller_id == claims["id"]).scalar()
    total_sales = db.session.query(func.coalesce(func.sum(OrderItem.unit_price * OrderItem.quantity), 0)).filter(OrderItem.seller_id == claims["id"]).scalar()
    return jsonify({"success": True, "data": {"total_orders": total_orders, "total_sales": float(total_sales)}})

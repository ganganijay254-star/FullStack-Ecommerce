import hmac
import hashlib

try:
    import razorpay
except ImportError:  # Allows the API to start with a clear checkout error until dependencies are installed.
    razorpay = None
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt
from sqlalchemy import func, or_

from app.extensions import db
from app.middleware.auth_middleware import jwt_required, role_required
from app.models.cart import Cart
from app.models.order import Order, OrderItem
from app.models.user import User

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
    order = Order(user_id=get_jwt()["id"], razorpay_order_id=razorpay_order_id, razorpay_payment_id=payment_id, total=cart_data["total"], status="confirmed")
    db.session.add(order)
    for item in cart.items:
        product = item.product
        if product.stock is not None and item.quantity > product.stock:
            db.session.rollback()
            return jsonify({"success": False, "message": f"Insufficient stock for {product.name}."}), 400
        if product.stock is not None:
            product.stock -= item.quantity
        item_unit_price = float(product.final_price) if hasattr(product, "final_price") else float(product.price)
        order.items.append(OrderItem(product_id=product.id, seller_id=product.seller_id, name=product.name, image_url=product.image_url, unit_price=item_unit_price, quantity=item.quantity))
    for item in list(cart.items):
        db.session.delete(item)
    db.session.commit()
    return jsonify({"success": True, "message": "Payment verified and order auto-confirmed.", "data": {"order": order.to_dict()}}), 201


@order_bp.route("", methods=["GET"])
@jwt_required
def get_orders():
    claims = get_jwt()
    query = Order.query.order_by(Order.created_at.desc())
    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip().lower()
    page = max(request.args.get("page", 1, type=int), 1)
    per_page = min(max(request.args.get("per_page", 10, type=int), 1), 100)
    if claims["role"] == "user":
        query = query.filter_by(user_id=claims["id"])
    elif claims["role"] == "seller":
        query = query.join(OrderItem).filter(OrderItem.seller_id == claims["id"]).distinct()
    if status:
        query = query.filter(Order.status == status)
    if search:
        wildcard = f"%{search}%"
        query = query.filter(or_(Order.id.cast(db.String).ilike(wildcard), Order.user.has(or_(User.full_name.ilike(wildcard), User.email.ilike(wildcard)))))
    total = query.count()
    pages = max((total + per_page - 1) // per_page, 1)
    page = min(page, pages)
    orders = query.offset((page - 1) * per_page).limit(per_page).all()
    seller_id = claims["id"] if claims["role"] == "seller" else None
    return jsonify({"success": True, "data": {"orders": [order.to_dict(seller_id=seller_id) for order in orders], "pagination": {"page": page, "per_page": per_page, "total": total, "total_pages": pages, "has_next": page < pages, "has_prev": page > 1}}})


@order_bp.route("/<int:order_id>", methods=["GET"])
@jwt_required
def get_order_details(order_id):
    """Get single order details for Amazon-style Order Details page."""
    claims = get_jwt()
    order = db.session.get(Order, order_id)

    if not order:
        return jsonify({"success": False, "message": "Order not found."}), 404

    # Access control: Customer who placed order, seller who owns an item, or admin
    is_owner = order.user_id == claims["id"]
    is_admin = claims.get("role") == "admin"
    is_seller = claims.get("role") == "seller" and any(item.seller_id == claims["id"] for item in order.items)

    if not (is_owner or is_admin or is_seller):
        return jsonify({"success": False, "message": "You do not have access to this order."}), 403

    seller_id = claims["id"] if claims.get("role") == "seller" else None
    return jsonify({"success": True, "data": {"order": order.to_dict(seller_id=seller_id)}}), 200


@order_bp.route("/<int:order_id>/return", methods=["POST"])
@jwt_required
def return_or_cancel_order(order_id):
    """Customer endpoint to cancel or return their order."""
    claims = get_jwt()
    order = db.session.get(Order, order_id)

    if not order:
        return jsonify({"success": False, "message": "Order not found."}), 404

    if order.user_id != claims["id"] and claims.get("role") != "admin":
        return jsonify({"success": False, "message": "You can only return or cancel your own orders."}), 403

    if order.status in {"cancelled", "returned"}:
        return jsonify({"success": False, "message": "Order has already been cancelled or returned."}), 400

    new_status = "returned" if order.status == "delivered" else "cancelled"
    order.status = new_status
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Order status updated to {new_status}.",
        "data": {"order": order.to_dict()}
    }), 200


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


@order_bp.route("/<int:order_id>/status", methods=["PATCH"])
@role_required("seller", "admin")
def update_order_status(order_id):
    data = request.get_json(silent=True) or {}
    allowed = {"pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"}
    status = str(data.get("status", "")).lower()
    if status not in allowed:
        return jsonify({"success": False, "message": "Choose a valid order status."}), 400
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({"success": False, "message": "Order not found."}), 404
    claims = get_jwt()
    if claims["role"] == "seller" and not any(item.seller_id == claims["id"] for item in order.items):
        return jsonify({"success": False, "message": "You cannot update this order."}), 403
    order.status = status
    db.session.commit()
    return jsonify({"success": True, "message": "Order status updated.", "data": {"order": order.to_dict(seller_id=claims["id"] if claims["role"] == "seller" else None)}})


@order_bp.route("/seller/dashboard", methods=["GET"])
@role_required("seller")
def seller_dashboard():
    seller_id = get_jwt()["id"]
    base = Order.query.join(OrderItem).filter(OrderItem.seller_id == seller_id).distinct()
    orders = base.all()
    items = OrderItem.query.filter_by(seller_id=seller_id)
    revenue = db.session.query(func.coalesce(func.sum(OrderItem.unit_price * OrderItem.quantity), 0)).filter(OrderItem.seller_id == seller_id).scalar()
    from app.models.product import Product
    product_count = Product.query.filter_by(seller_id=seller_id).count()
    low_stock = Product.query.filter(Product.seller_id == seller_id, Product.stock > 0, Product.stock <= 5).count()
    out_of_stock = Product.query.filter(Product.seller_id == seller_id, Product.stock <= 0).count()
    status_counts = {name: sum(1 for order in orders if order.status == name) for name in ("pending", "confirmed", "delivered", "cancelled", "returned")}
    top = db.session.query(OrderItem.name, func.sum(OrderItem.quantity).label("sales"), func.sum(OrderItem.unit_price * OrderItem.quantity).label("revenue")).filter(OrderItem.seller_id == seller_id).group_by(OrderItem.name).order_by(func.sum(OrderItem.quantity).desc()).limit(5).all()
    return jsonify({"success": True, "data": {"total_revenue": float(revenue), "total_orders": len(orders), "pending_orders": status_counts["pending"] + status_counts["confirmed"], "confirmed_orders": status_counts["confirmed"], "completed_orders": status_counts["delivered"], "cancelled_orders": status_counts["cancelled"], "returned_orders": status_counts["returned"], "total_products": product_count, "low_stock_products": low_stock, "out_of_stock_products": out_of_stock, "recent_orders": [order.to_dict(seller_id=seller_id) for order in orders[:5]], "top_products": [{"name": name, "sales": int(sales), "revenue": float(product_revenue)} for name, sales, product_revenue in top]}})

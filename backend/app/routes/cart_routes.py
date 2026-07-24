from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt

from app.middleware.auth_middleware import jwt_required
from app.services.cart_service import CartService


cart_bp = Blueprint("cart", __name__, url_prefix="/api/cart")


def _user_id():
    return get_jwt().get("id")


def _quantity(data):
    quantity = data.get("quantity", 1) if data else None
    if isinstance(quantity, bool) or not isinstance(quantity, int) or quantity < 1:
        return None
    return quantity


@cart_bp.route("", methods=["GET"])
@jwt_required
def get_cart():
    cart = CartService.get_or_create_cart(_user_id())
    return jsonify({"success": True, "data": {"cart": cart.to_dict()}}), 200


@cart_bp.route("/items", methods=["POST"])
@jwt_required
def add_to_cart():
    data = request.get_json(silent=True) or {}
    product_id = data.get("product_id")
    quantity = _quantity(data)
    if isinstance(product_id, bool) or not isinstance(product_id, int) or not quantity:
        return jsonify({"success": False, "message": "A valid product_id and quantity are required."}), 400

    cart, error = CartService.add_item(_user_id(), product_id, quantity)
    if error:
        return jsonify({"success": False, "message": error}), 400 if error != "Product not found." else 404
    return jsonify({"success": True, "message": "Product added to cart.", "data": {"cart": cart.to_dict()}}), 201


@cart_bp.route("/items/<int:item_id>", methods=["PUT"])
@jwt_required
def update_cart_item(item_id):
    quantity = _quantity(request.get_json(silent=True) or {})
    if not quantity:
        return jsonify({"success": False, "message": "Quantity must be a positive integer."}), 400
    cart, error = CartService.update_item(_user_id(), item_id, quantity)
    if error:
        return jsonify({"success": False, "message": error}), 404 if error == "Cart item not found." else 400
    return jsonify({"success": True, "data": {"cart": cart.to_dict()}}), 200


@cart_bp.route("/items/<int:item_id>", methods=["DELETE"])
@jwt_required
def remove_cart_item(item_id):
    cart, error = CartService.remove_item(_user_id(), item_id)
    if error:
        return jsonify({"success": False, "message": error}), 404
    return jsonify({"success": True, "data": {"cart": cart.to_dict()}}), 200


@cart_bp.route("", methods=["DELETE"])
@jwt_required
def clear_cart():
    cart = CartService.clear_cart(_user_id())
    return jsonify({"success": True, "data": {"cart": cart.to_dict()}}), 200

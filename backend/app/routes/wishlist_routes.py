from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt

from app.extensions import db
from app.middleware.auth_middleware import jwt_required
from app.models.product import Product
from app.models.wishlist import WishlistItem

wishlist_bp = Blueprint("wishlist", __name__, url_prefix="/api/wishlist")


@wishlist_bp.route("", methods=["GET"])
@jwt_required
def get_wishlist():
    items = WishlistItem.query.filter_by(user_id=get_jwt()["id"]).order_by(WishlistItem.created_at.desc()).all()
    return jsonify({"success": True, "data": {"items": [item.to_dict() for item in items]}})


@wishlist_bp.route("/<int:product_id>", methods=["POST"])
@jwt_required
def add_wishlist_item(product_id):
    if not Product.query.get(product_id):
        return jsonify({"success": False, "message": "Product not found."}), 404
    item = WishlistItem.query.filter_by(user_id=get_jwt()["id"], product_id=product_id).first()
    if not item:
        item = WishlistItem(user_id=get_jwt()["id"], product_id=product_id)
        db.session.add(item)
        db.session.commit()
    return jsonify({"success": True, "data": {"item": item.to_dict()}}), 201


@wishlist_bp.route("/<int:product_id>", methods=["DELETE"])
@jwt_required
def remove_wishlist_item(product_id):
    item = WishlistItem.query.filter_by(user_id=get_jwt()["id"], product_id=product_id).first()
    if not item:
        return jsonify({"success": False, "message": "Wishlist item not found."}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({"success": True, "message": "Removed from wishlist."})

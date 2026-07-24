from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt
from app.schemas.product_schema import (
    validate_create_product_data,
    validate_update_product_data,
)
from app.services.product_service import ProductService
from app.middleware.auth_middleware import jwt_required, role_required

product_bp = Blueprint("products", __name__, url_prefix="/api/products")


# ─── Public routes (any authenticated user) ───


@product_bp.route("", methods=["GET"])
@jwt_required
def get_products():
    """Get all products with search, filter, pagination, sorting."""
    search = request.args.get("search", "").strip()
    category = request.args.get("category", "").strip() or None
    sort_by = request.args.get("sort_by", "latest").strip()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 12, type=int)

    result = ProductService.get_all_products(
        search=search,
        category=category,
        sort_by=sort_by,
        page=page,
        per_page=per_page,
    )
    return jsonify({"success": True, "message": "Products fetched.", "data": result}), 200


@product_bp.route("/categories", methods=["GET"])
@jwt_required
def get_categories():
    """Get all product categories."""
    categories = ProductService.get_all_categories()
    return jsonify({"success": True, "message": "Categories fetched.", "data": {"categories": categories}}), 200


@product_bp.route("/<int:product_id>", methods=["GET"])
@jwt_required
def get_product(product_id):
    """Get a single product by ID."""
    product = ProductService.get_product_by_id(product_id)
    if not product:
        return jsonify({"success": False, "message": "Product not found."}), 404
    return jsonify({"success": True, "message": "Product fetched.", "data": {"product": product.to_dict()}}), 200


# ─── Admin / Seller routes (create, update, delete) ───


@product_bp.route("", methods=["POST"])
@jwt_required
@role_required("admin", "seller")
def create_product():
    """Create a new product (admin or seller)."""
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Request body is required."}), 400

    # Validate
    errors = validate_create_product_data(data)
    if errors:
        return jsonify({"success": False, "message": "Validation failed.", "errors": errors}), 400

    product = ProductService.create_product(data)

    return jsonify({"success": True, "message": "Product created successfully.", "data": {"product": product.to_dict()}}), 201


@product_bp.route("/<int:product_id>", methods=["PUT"])
@jwt_required
@role_required("admin", "seller")
def update_product(product_id):
    """Update a product."""
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Request body is required."}), 400

    # Validate
    errors = validate_update_product_data(data)
    if errors:
        return jsonify({"success": False, "message": "Validation failed.", "errors": errors}), 400

    product, error = ProductService.update_product(product_id, data)

    if error:
        return jsonify({"success": False, "message": error}), 404

    return jsonify({"success": True, "message": "Product updated successfully.", "data": {"product": product.to_dict()}}), 200


@product_bp.route("/<int:product_id>", methods=["DELETE"])
@jwt_required
@role_required("admin", "seller")
def delete_product(product_id):
    """Delete a product."""
    success, message = ProductService.delete_product(product_id)

    if not success:
        return jsonify({"success": False, "message": message}), 404

    return jsonify({"success": True, "message": message}), 200

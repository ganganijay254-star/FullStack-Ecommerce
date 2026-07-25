try:
    import cloudinary
    import cloudinary.uploader
except ImportError:
    cloudinary = None
import traceback
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt

from app.middleware.auth_middleware import jwt_required, role_required
from app.schemas.product_schema import validate_create_product_data, validate_update_product_data
from app.services.product_service import ProductService

product_bp = Blueprint("products", __name__, url_prefix="/api/products")
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE = 5 * 1024 * 1024


def _product_filters():
    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)
    if (min_price is not None and min_price < 0) or (max_price is not None and max_price < 0):
        return None, jsonify({"success": False, "message": "Price filters must be non-negative."}), 400
    if min_price is not None and max_price is not None and min_price > max_price:
        return None, jsonify({"success": False, "message": "min_price cannot exceed max_price."}), 400
    return {
        "search": request.args.get("search", "").strip(),
        "category": request.args.get("category", "").strip() or None,
        "sort_by": request.args.get("sort_by", "latest").strip(),
        "page": request.args.get("page", 1, type=int),
        "per_page": request.args.get("per_page", 12, type=int),
        "min_price": min_price,
        "max_price": max_price,
    }, None, None


@product_bp.route("", methods=["GET"])
@jwt_required
def get_products():
    """List products with keyword, category, price range, sorting, and pagination."""
    filters, error, status = _product_filters()
    if error:
        return error, status
    return jsonify({"success": True, "message": "Products fetched.", "data": ProductService.get_all_products(**filters)}), 200


@product_bp.route("/categories", methods=["GET"])
@jwt_required
def get_categories():
    categories = ProductService.get_all_categories()
    return jsonify({"success": True, "message": "Categories fetched.", "data": {"categories": categories}}), 200


@product_bp.route("/images", methods=["POST"])
@role_required("admin", "seller")
def upload_product_image():
    """Stream an image to Cloudinary; no raw image is stored on this server."""
    image = request.files.get("image")
    current_app.logger.info(
        "Product image upload: content_type=%s, image_received=%s",
        request.content_type,
        bool(image and image.filename),
    )
    if not image or not image.filename:
        return jsonify({"success": False, "message": "An image file is required."}), 400
    if image.mimetype not in ALLOWED_IMAGE_TYPES:
        return jsonify({"success": False, "message": "Use a JPG, PNG, WEBP, or GIF image."}), 400

    image.seek(0, 2)
    image_size = image.tell()
    image.seek(0)
    if image_size > MAX_IMAGE_SIZE:
        return jsonify({"success": False, "message": "Image must be 5 MB or smaller."}), 400

    if not cloudinary:
        return jsonify({"success": False, "message": "Image uploads are temporarily unavailable. Cloudinary is not installed on the server."}), 503
    if not all((current_app.config["CLOUDINARY_CLOUD_NAME"], current_app.config["CLOUDINARY_API_KEY"], current_app.config["CLOUDINARY_API_SECRET"])):
        return jsonify({"success": False, "message": "Cloudinary is not configured."}), 400

    cloudinary.config(
        cloud_name=current_app.config["CLOUDINARY_CLOUD_NAME"],
        api_key=current_app.config["CLOUDINARY_API_KEY"],
        api_secret=current_app.config["CLOUDINARY_API_SECRET"],
        secure=True,
    )

    try:
        result = cloudinary.uploader.upload(
            image,
            folder="shopease/products",
            resource_type="image"
        )

        return jsonify({
            "success": True,
            "image_url": result["secure_url"]
            }), 201

    except Exception as e:
        traceback.print_exc()

        current_app.logger.error(
            "Cloudinary Upload Error: %s",
            str(e)
        )

        return jsonify({
            "success": False,
            "message": str(e)
        }), 502
    return jsonify({"success": True, "image_url": result["secure_url"]}), 201


@product_bp.route("/seller/me", methods=["GET"])
@role_required("seller")
def get_seller_products():
    """Return only the authenticated seller's products."""
    filters, error, status = _product_filters()
    if error:
        return error, status
    filters["seller_id"] = get_jwt()["id"]
    return jsonify({"success": True, "data": ProductService.get_all_products(**filters)}), 200


@product_bp.route("/<int:product_id>/active", methods=["PATCH"])
@role_required("seller")
def toggle_product_active(product_id):
    data = request.get_json(silent=True) or {}
    if not isinstance(data.get("is_active"), bool):
        return jsonify({"success": False, "message": "is_active must be a boolean."}), 400
    product, error = ProductService.update_product(product_id, {"is_active": data["is_active"]}, seller_id=get_jwt()["id"])
    if error:
        return jsonify({"success": False, "message": error}), 403 if "own" in error else 404
    return jsonify({"success": True, "message": "Product visibility updated.", "data": {"product": product.to_dict()}})


@product_bp.route("/<int:product_id>", methods=["GET"])
@jwt_required
def get_product(product_id):
    product = ProductService.get_product_by_id(product_id)
    if not product:
        return jsonify({"success": False, "message": "Product not found."}), 404
    return jsonify({"success": True, "message": "Product fetched.", "data": {"product": product.to_dict()}}), 200


@product_bp.route("", methods=["POST"])
@role_required("admin", "seller")
def create_product():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "message": "Request body is required."}), 400
    errors = validate_create_product_data(data)
    if errors:
        return jsonify({"success": False, "message": "Validation failed.", "errors": errors}), 400

    claims = get_jwt()
    product = ProductService.create_product(data, seller_id=claims["id"] if claims.get("role") == "seller" else None)
    return jsonify({"success": True, "message": "Product created successfully.", "data": {"product": product.to_dict()}}), 201


@product_bp.route("/<int:product_id>", methods=["PUT"])
@role_required("admin", "seller")
def update_product(product_id):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "message": "Request body is required."}), 400
    errors = validate_update_product_data(data)
    if errors:
        return jsonify({"success": False, "message": "Validation failed.", "errors": errors}), 400

    claims = get_jwt()
    product, error = ProductService.update_product(product_id, data, seller_id=claims["id"] if claims.get("role") == "seller" else None)
    if error:
        return jsonify({"success": False, "message": error}), 403 if error == "You can only manage your own products." else 404
    return jsonify({"success": True, "message": "Product updated successfully.", "data": {"product": product.to_dict()}}), 200


@product_bp.route("/<int:product_id>", methods=["DELETE"])
@role_required("admin", "seller")
def delete_product(product_id):
    claims = get_jwt()
    success, message = ProductService.delete_product(product_id, seller_id=claims["id"] if claims.get("role") == "seller" else None)
    if not success:
        return jsonify({"success": False, "message": message}), 403 if message == "You can only manage your own products." else 404
    return jsonify({"success": True, "message": message}), 200

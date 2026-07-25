from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt
from app.middleware.auth_middleware import jwt_required
from app.services.review_service import ReviewService

review_bp = Blueprint("reviews", __name__, url_prefix="/api")


@review_bp.route("/products/<int:product_id>/reviews", methods=["GET"])
def get_product_reviews(product_id):
    """Fetch reviews for a product with pagination and sorting."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 5, type=int)
    sort_by = request.args.get("sort_by", "recent").strip().lower()

    data = ReviewService.get_product_reviews(
        product_id=product_id, page=page, per_page=per_page, sort_by=sort_by
    )
    return jsonify({"success": True, "data": data}), 200


@review_bp.route("/products/<int:product_id>/reviews", methods=["POST"])
@jwt_required
def create_review(product_id):
    """Create a review (Verified purchasers only)."""
    user_id = get_jwt()["id"]
    data = request.get_json(silent=True) or {}

    rating = data.get("rating")
    comment = data.get("comment", "")

    if not rating:
        return jsonify({"success": False, "message": "Rating is required."}), 400

    review, error = ReviewService.create_review(
        user_id=user_id, product_id=product_id, rating=rating, comment=comment
    )
    if error:
        return jsonify({"success": False, "message": error}), 400

    return jsonify({
        "success": True,
        "message": "Review submitted successfully.",
        "data": {"review": review.to_dict()}
    }), 201


@review_bp.route("/reviews/<int:review_id>", methods=["PUT"])
@jwt_required
def update_review(review_id):
    """Update user's own review."""
    user_id = get_jwt()["id"]
    data = request.get_json(silent=True) or {}

    rating = data.get("rating")
    comment = data.get("comment")

    review, error = ReviewService.update_review(
        user_id=user_id, review_id=review_id, rating=rating, comment=comment
    )
    if error:
        return jsonify({"success": False, "message": error}), 400

    return jsonify({
        "success": True,
        "message": "Review updated successfully.",
        "data": {"review": review.to_dict()}
    }), 200


@review_bp.route("/reviews/<int:review_id>", methods=["DELETE"])
@jwt_required
def delete_review(review_id):
    """Delete review (Author, Admin, or Product Seller)."""
    claims = get_jwt()
    user_id = claims["id"]
    user_role = claims.get("role", "user")

    success, message = ReviewService.delete_review(
        user_id=user_id, user_role=user_role, review_id=review_id
    )
    if not success:
        return jsonify({"success": False, "message": message}), 403

    return jsonify({"success": True, "message": message}), 200


@review_bp.route("/reviews/<int:review_id>/helpful", methods=["POST"])
@jwt_required
def mark_review_helpful(review_id):
    """Mark a review as helpful."""
    review, error = ReviewService.mark_helpful(review_id)
    if error:
        return jsonify({"success": False, "message": error}), 404

    return jsonify({
        "success": True,
        "message": "Marked as helpful.",
        "data": {"review": review.to_dict()}
    }), 200

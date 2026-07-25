from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, get_jwt
from app.schemas.auth_schema import validate_register_data, validate_login_data
from app.services.auth_service import AuthService
from app.middleware.auth_middleware import jwt_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _generate_jwt_token(user):
    """Generate JWT token with user info embedded in additional claims."""
    token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "id": user.id,
            "email": user.email,
            "role": user.role,
        }
    )
    return token


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user account."""
    data = request.get_json()

    if not data:
        return jsonify({"success": False, "message": "Request body is required."}), 400

    # Validate input
    errors = validate_register_data(data)
    if errors:
        return jsonify({"success": False, "message": "Validation failed.", "errors": errors}), 400

    # Register user
    result, user = AuthService.register_user(data)
    if not result["success"]:
        return jsonify(result), 409

    # Generate JWT token
    token = _generate_jwt_token(user)

    return jsonify({
        "success": True,
        "message": "User registered successfully.",
        "token": token,
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
        }
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user and return JWT token."""
    try:
        data = request.get_json()

        if not data:
            return jsonify({"success": False, "message": "Request body is required."}), 400

        # Validate input
        errors = validate_login_data(data)
        if errors:
            return jsonify({"success": False, "message": "Validation failed.", "errors": errors}), 400

        # Authenticate user
        result, user = AuthService.login_user(data)
        if not result["success"]:
            return jsonify(result), 401

        # Generate JWT token
        token = _generate_jwt_token(user)

        return jsonify({
            "success": True,
            "message": "Login successful.",
            "token": token,
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Login failed: {str(e)}"}), 500


@auth_bp.route("/me", methods=["GET"])
@jwt_required
def get_current_user():
    """Get current authenticated user's information."""
    claims = get_jwt()
    user_id = claims.get("id")

    if not user_id:
        return jsonify({"success": False, "message": "Invalid token payload."}), 401

    from app.models.user import User
    user = User.query.get(user_id)

    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404

    return jsonify({
        "success": True,
        "user": user.to_dict()
    }), 200


@auth_bp.route("/profile", methods=["PUT"])
@jwt_required
def update_profile():
    """Update user/seller profile details (full_name, phone, avatar_url)."""
    user_id = get_jwt().get("id")
    from app.models.user import User
    from app.extensions import db

    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404

    data = request.get_json(silent=True) or {}

    if "full_name" in data and data["full_name"]:
        user.full_name = data["full_name"].strip()
    if "phone" in data:
        user.phone = data["phone"].strip() if data["phone"] else None

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Profile updated successfully.",
        "user": user.to_dict()
    }), 200


@auth_bp.route("/avatar", methods=["POST"])
@jwt_required
def upload_avatar():
    """Stream user profile photo to Cloudinary."""
    from flask import current_app
    try:
        import cloudinary
        import cloudinary.uploader
    except ImportError:
        cloudinary = None

    image = request.files.get("image")
    if not image or not image.filename:
        return jsonify({"success": False, "message": "An image file is required."}), 400

    if not cloudinary or not all((current_app.config.get("CLOUDINARY_CLOUD_NAME"), current_app.config.get("CLOUDINARY_API_KEY"), current_app.config.get("CLOUDINARY_API_SECRET"))):
        return jsonify({"success": False, "message": "Cloudinary is not configured."}), 503

    cloudinary.config(
        cloud_name=current_app.config["CLOUDINARY_CLOUD_NAME"],
        api_key=current_app.config["CLOUDINARY_API_KEY"],
        api_secret=current_app.config["CLOUDINARY_API_SECRET"],
        secure=True,
    )

    try:
        result = cloudinary.uploader.upload(
            image,
            folder="shopease/avatars",
            resource_type="image"
        )
        avatar_url = result["secure_url"]

        user_id = get_jwt().get("id")
        from app.models.user import User
        from app.extensions import db
        user = db.session.get(User, user_id)

        return jsonify({"success": True, "avatar_url": avatar_url, "user": user.to_dict() if user else None}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 502


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
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "is_active": user.is_active,
        }
    }), 200


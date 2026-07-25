from functools import wraps
from flask import jsonify
from app.extensions import db
from flask_jwt_extended import get_jwt, verify_jwt_in_request


def jwt_required(fn):
    """Decorator to require valid JWT token.

    Validates the JWT and verifies the user exists and is active.
    JWT validation errors (missing/invalid token) are propagated to
    Flask-JWT-Extended's registered error handlers so they return
    consistent error responses.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        # Let verify_jwt_in_request raise its own exceptions (NoAuthorizationError,
        # InvalidHeaderError, etc.) which are caught by the @jwt.unauthorized_loader
        # and @jwt.invalid_token_loader handlers registered in __init__.py.
        verify_jwt_in_request()

        from app.models.user import User
        user_id = get_jwt().get("id")
        if user_id is not None:
            user = db.session.get(User, user_id)
            if user is None:
                return jsonify({"success": False, "message": "User account not found."}), 401
            if not user.is_active:
                return jsonify({"success": False, "message": "This account is inactive."}), 403

        return fn(*args, **kwargs)
    return wrapper


def role_required(*allowed_roles):
    """Decorator to restrict access based on user role.

    Cross-verifies the user's role from the database (not just from JWT claims)
    to prevent stale/tampered role claims from granting unauthorized access.

    Usage:
        @role_required("admin")
        @role_required("admin", "seller")
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Let JWT validation errors propagate to the registered handlers.
            verify_jwt_in_request()

            from app.models.user import User
            user_id = get_jwt().get("id")
            user_role = get_jwt().get("role", "")

            if user_id is not None:
                user = db.session.get(User, user_id)
                if user is None:
                    return jsonify({"success": False, "message": "User account not found."}), 401
                if not user.is_active:
                    return jsonify({"success": False, "message": "This account is inactive."}), 403
                # Cross-verify role from the actual database record
                user_role = user.role

            if user_role not in allowed_roles:
                return jsonify({
                    "success": False,
                    "message": f"Access denied. Required role(s): {', '.join(allowed_roles)}."
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def admin_required(fn):
    """Shorthand decorator for admin-only routes."""
    return role_required("admin")(fn)


def seller_required(fn):
    """Shorthand decorator for seller-only routes."""
    return role_required("seller")(fn)


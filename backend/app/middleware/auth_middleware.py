from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt, verify_jwt_in_request


def jwt_required(fn):
    """Decorator to require valid JWT token."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({"success": False, "message": "Authentication required. Invalid or missing token."}), 401
    return wrapper


def role_required(*allowed_roles):
    """Decorator to restrict access based on user role.

    Usage:
        @role_required("admin")
        @role_required("admin", "seller")
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
                claims = get_jwt()

                user_role = claims.get("role", "")

                if user_role not in allowed_roles:
                    return jsonify({
                        "success": False,
                        "message": f"Access denied. Required role(s): {', '.join(allowed_roles)}."
                    }), 403

                return fn(*args, **kwargs)
            except Exception as e:
                return jsonify({"success": False, "message": "Authentication required. Invalid or missing token."}), 401
        return wrapper
    return decorator


def admin_required(fn):
    """Shorthand decorator for admin-only routes."""
    return role_required("admin")(fn)


def seller_required(fn):
    """Shorthand decorator for seller-only routes."""
    return role_required("seller")(fn)


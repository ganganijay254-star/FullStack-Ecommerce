from datetime import datetime

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt
from sqlalchemy import func, or_

from app.extensions import db
from app.middleware.auth_middleware import role_required
from app.models.order import Order, OrderItem
from app.models.user import User

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def _pagination(query):
    page = max(request.args.get("page", 1, type=int), 1)
    per_page = min(max(request.args.get("per_page", 10, type=int), 1), 100)
    total = query.count()
    pages = max((total + per_page - 1) // per_page, 1)
    page = min(page, pages)
    return query.offset((page - 1) * per_page).limit(per_page).all(), {
        "page": page, "per_page": per_page, "total": total, "total_pages": pages,
        "has_next": page < pages, "has_prev": page > 1,
    }


@admin_bp.route("/users", methods=["GET"])
@role_required("admin")
def list_users():
    query = User.query
    search = request.args.get("search", "").strip()
    role = request.args.get("role", "").strip()
    status = request.args.get("status", "").strip().lower()
    if search:
        query = query.filter(or_(User.full_name.ilike(f"%{search}%"), User.email.ilike(f"%{search}%")))
    if role:
        query = query.filter(User.role == role)
    if status in {"active", "inactive"}:
        query = query.filter(User.is_active.is_(status == "active"))
    users, pagination = _pagination(query.order_by(User.created_at.desc()))
    result = []
    for user in users:
        orders, spending = db.session.query(func.count(Order.id), func.coalesce(func.sum(Order.total), 0)).filter(Order.user_id == user.id).one()
        result.append({**user.to_dict(), "total_orders": orders, "total_spending": float(spending)})
    return jsonify({"success": True, "data": {"users": result, "pagination": pagination}})


@admin_bp.route("/users/stats", methods=["GET"])
@role_required("admin")
def user_stats():
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    total = User.query.count()
    active = User.query.filter(User.is_active.is_(True)).count()
    sellers = User.query.filter_by(role="seller").count()
    customers = User.query.filter_by(role="user").count()
    new = User.query.filter(User.created_at >= month_start).count()
    roles = db.session.query(User.role, func.count(User.id)).group_by(User.role).all()
    return jsonify({"success": True, "data": {"total_users": total, "active_users": active, "sellers": sellers, "customers": customers, "new_users_this_month": new, "users_by_role": [{"role": role, "count": count} for role, count in roles]}})


@admin_bp.route("/users/<int:user_id>", methods=["GET"])
@role_required("admin")
def get_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404
    orders, spending = db.session.query(func.count(Order.id), func.coalesce(func.sum(Order.total), 0)).filter(Order.user_id == user.id).one()
    return jsonify({"success": True, "data": {"user": {**user.to_dict(), "total_orders": orders, "total_spending": float(spending)}}})


@admin_bp.route("/users/<int:user_id>/status", methods=["PATCH"])
@role_required("admin")
def update_user_status(user_id):
    user = db.session.get(User, user_id)
    body = request.get_json(silent=True) or {}
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404
    if user.id == get_jwt()["id"]:
        return jsonify({"success": False, "message": "You cannot deactivate your own account."}), 400
    if not isinstance(body.get("is_active"), bool):
        return jsonify({"success": False, "message": "is_active must be a boolean."}), 400
    user.is_active = body["is_active"]
    db.session.commit()
    return jsonify({"success": True, "message": "User status updated.", "data": {"user": user.to_dict()}})


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@role_required("admin")
def delete_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404
    if user.id == get_jwt()["id"]:
        return jsonify({"success": False, "message": "You cannot delete your own account."}), 400
    if user.orders or user.products:
        return jsonify({"success": False, "message": "Users with orders or products cannot be deleted; deactivate them instead."}), 409
    db.session.delete(user)
    db.session.commit()
    return jsonify({"success": True, "message": "User deleted."})


@admin_bp.route("/export/users", methods=["GET"])
@role_required("admin")
def export_users():
    """Return user data formatted for CSV export."""
    users = User.query.order_by(User.created_at.desc()).all()
    rows = []
    for u in users:
        rows.append({
            "ID": u.id,
            "Name": u.full_name,
            "Email": u.email,
            "Role": u.role,
            "Status": "Active" if u.is_active else "Inactive",
            "Joined": u.created_at.strftime("%Y-%m-%d") if u.created_at else "",
        })
    return jsonify({"success": True, "data": rows}), 200


@admin_bp.route("/export/orders", methods=["GET"])
@role_required("admin")
def export_orders():
    """Return order data formatted for CSV export."""
    orders = Order.query.order_by(Order.created_at.desc()).all()
    rows = []
    for o in orders:
        rows.append({
            "Order ID": f"ORD-{o.id:06d}",
            "Customer": o.user.full_name if o.user else "Unknown",
            "Total": f"INR {o.total:.2f}",
            "Status": o.status.title(),
            "Payment ID": o.razorpay_payment_id,
            "Date": o.created_at.strftime("%Y-%m-%d %H:%M") if o.created_at else "",
        })
    return jsonify({"success": True, "data": rows}), 200


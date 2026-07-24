"""add wishlist and order tables

Revision ID: bb7d2b6502ee
Revises: 8a104d53c2e9
"""
from alembic import op
import sqlalchemy as sa

revision = "bb7d2b6502ee"
down_revision = "8a104d53c2e9"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("wishlist_items", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False), sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False), sa.UniqueConstraint("user_id", "product_id", name="uq_wishlist_user_product"))
    op.create_index("ix_wishlist_items_user_id", "wishlist_items", ["user_id"])
    op.create_table("orders", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False), sa.Column("razorpay_order_id", sa.String(100), nullable=False, unique=True), sa.Column("razorpay_payment_id", sa.String(100), nullable=False, unique=True), sa.Column("total", sa.Float(), nullable=False), sa.Column("status", sa.String(30), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_orders_user_id", "orders", ["user_id"])
    op.create_index("ix_orders_created_at", "orders", ["created_at"])
    op.create_table("order_items", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("order_id", sa.Integer(), sa.ForeignKey("orders.id"), nullable=False), sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False), sa.Column("seller_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True), sa.Column("name", sa.String(200), nullable=False), sa.Column("image_url", sa.String(500)), sa.Column("unit_price", sa.Float(), nullable=False), sa.Column("quantity", sa.Integer(), nullable=False))
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])
    op.create_index("ix_order_items_seller_id", "order_items", ["seller_id"])


def downgrade():
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("wishlist_items")

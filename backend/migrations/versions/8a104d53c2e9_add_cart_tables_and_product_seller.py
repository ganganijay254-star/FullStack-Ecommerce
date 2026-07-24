"""Add carts and product seller ownership.

Revision ID: 8a104d53c2e9
Revises: 2d50da2c516e
"""
from alembic import op
import sqlalchemy as sa


revision = "8a104d53c2e9"
down_revision = "2d50da2c516e"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("products", sa.Column("seller_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_products_seller_id", "products", "users", ["seller_id"], ["id"])
    op.create_table(
        "carts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "cart_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("cart_id", sa.Integer(), sa.ForeignKey("carts.id"), nullable=False),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("cart_id", "product_id", name="uq_cart_item_product"),
    )


def downgrade():
    op.drop_table("cart_items")
    op.drop_table("carts")
    op.drop_constraint("fk_products_seller_id", "products", type_="foreignkey")
    op.drop_column("products", "seller_id")

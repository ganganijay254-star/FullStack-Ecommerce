"""add product active flag

Revision ID: c2a19bdfd6e2
Revises: bb7d2b6502ee
"""
from alembic import op
import sqlalchemy as sa

revision = "c2a19bdfd6e2"
down_revision = "bb7d2b6502ee"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("products", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()))

def downgrade():
    op.drop_column("products", "is_active")

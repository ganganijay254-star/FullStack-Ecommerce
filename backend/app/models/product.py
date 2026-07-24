from datetime import datetime
from app.extensions import db


class Product(db.Model):

    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)

    seller_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id")
    )

    name = db.Column(db.String(150), nullable=False)

    description = db.Column(db.Text)

    category = db.Column(db.String(100))

    price = db.Column(db.Numeric(10,2))

    stock = db.Column(db.Integer)

    image_url = db.Column(db.String(300))

    is_active = db.Column(
        db.Boolean,
        default=True
    )

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )
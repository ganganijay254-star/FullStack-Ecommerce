from datetime import datetime, timedelta

from app.extensions import db


class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    razorpay_order_id = db.Column(db.String(100), unique=True, nullable=False)
    razorpay_payment_id = db.Column(db.String(100), unique=True, nullable=False)
    total = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(30), nullable=False, default="confirmed")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = db.relationship("User", backref=db.backref("orders", lazy="selectin"))
    items = db.relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="selectin")

    def get_estimated_delivery(self):
        created = self.created_at or datetime.utcnow()
        est_min = created + timedelta(days=3)
        est_max = created + timedelta(days=4)
        return {
            "estimated_days": "3 - 4 Days",
            "min_date": est_min.strftime("%b %d, %Y"),
            "max_date": est_max.strftime("%b %d, %Y"),
            "formatted": f"{est_min.strftime('%b %d')} - {est_max.strftime('%b %d, %Y')}"
        }

    def to_dict(self, seller_id=None):
        items = [item.to_dict() for item in self.items if seller_id is None or item.seller_id == seller_id]
        return {
            "id": self.id,
            "customer": self.user.full_name,
            "customer_email": self.user.email,
            "total": round(sum(item["subtotal"] for item in items), 2) if seller_id else self.total,
            "status": self.status,
            "auto_confirmed": True,
            "created_at": self.created_at.isoformat(),
            "estimated_delivery": self.get_estimated_delivery(),
            "items": items,
        }


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    seller_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    name = db.Column(db.String(200), nullable=False)
    image_url = db.Column(db.String(500))
    unit_price = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)

    order = db.relationship("Order", back_populates="items")

    def to_dict(self):
        return {"id": self.id, "product_id": self.product_id, "name": self.name, "image_url": self.image_url,
                "unit_price": self.unit_price, "quantity": self.quantity,
                "subtotal": round(self.unit_price * self.quantity, 2)}

from datetime import datetime

from app.extensions import db


class Cart(db.Model):
    __tablename__ = "carts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    user = db.relationship("User", backref=db.backref("cart", uselist=False))
    items = db.relationship(
        "CartItem", back_populates="cart", cascade="all, delete-orphan", lazy="selectin"
    )

    def to_dict(self):
        items = [item.to_dict() for item in self.items]
        return {
            "id": self.id,
            "items": items,
            "item_count": sum(item["quantity"] for item in items),
            "total": round(sum(item["subtotal"] for item in items), 2),
        }


class CartItem(db.Model):
    __tablename__ = "cart_items"
    __table_args__ = (db.UniqueConstraint("cart_id", "product_id", name="uq_cart_item_product"),)

    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey("carts.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    cart = db.relationship("Cart", back_populates="items")
    product = db.relationship("Product")

    def to_dict(self):
        product = self.product
        unit_price = float(product.final_price) if hasattr(product, "final_price") else float(product.price)
        orig_price = float(product.price)
        discount_percent = float(getattr(product, "discount_percent", 0.0) or 0.0)
        return {
            "id": self.id,
            "product_id": product.id,
            "name": product.name,
            "category": product.category,
            "image_url": product.image_url,
            "stock": product.stock or 0,
            "unit_price": unit_price,
            "original_price": orig_price,
            "discount_percent": discount_percent,
            "quantity": self.quantity,
            "subtotal": round(unit_price * self.quantity, 2),
        }

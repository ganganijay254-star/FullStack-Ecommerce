from datetime import datetime

from app.extensions import db


class WishlistItem(db.Model):
    __tablename__ = "wishlist_items"
    __table_args__ = (db.UniqueConstraint("user_id", "product_id", name="uq_wishlist_user_product"),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship("User", backref=db.backref("wishlist_items", lazy="selectin"))
    product = db.relationship("Product")

    def to_dict(self):
        return {"id": self.id, "product": self.product.to_dict(), "created_at": self.created_at.isoformat()}

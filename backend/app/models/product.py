from datetime import datetime
from app.extensions import db


class Product(db.Model):

    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)

    seller_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    name = db.Column(db.String(200), nullable=False)

    description = db.Column(db.Text)

    category = db.Column(db.String(100))

    price = db.Column(db.Float, nullable=False)

    stock = db.Column(db.Integer)

    brand = db.Column(db.String(100))

    image = db.Column(db.String(500))

    is_active = db.Column(db.Boolean, nullable=False, default=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)


    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    seller = db.relationship("User", backref=db.backref("products", lazy=True))
    reviews = db.relationship("Review", back_populates="product", cascade="all, delete-orphan", lazy="select")

    # Computed / alias properties for backward compatibility with frontend
    @property
    def image_url(self):
        return self.image

    @image_url.setter
    def image_url(self, value):
        self.image = value

    @property
    def avg_rating(self):
        if not self.reviews:
            return 0.0
        return round(sum(r.rating for r in self.reviews) / len(self.reviews), 1)

    @property
    def review_count(self):
        return len(self.reviews) if self.reviews else 0

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "brand": self.brand,
            "price": float(self.price) if self.price else None,
            "stock": self.stock,
            "image_url": self.image,
            "seller_id": self.seller_id,
            "seller_name": self.seller.full_name if self.seller else None,
            "is_active": self.is_active,
            "avg_rating": self.avg_rating,
            "review_count": self.review_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

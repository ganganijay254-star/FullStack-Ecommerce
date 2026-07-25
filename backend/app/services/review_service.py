from app.extensions import db
from app.models.review import Review
from app.models.product import Product
from app.models.order import Order, OrderItem


class ReviewService:

    @staticmethod
    def is_verified_purchase(user_id, product_id):
        """Check if user has purchased the given product in a paid order."""
        purchased_item = (
            db.session.query(OrderItem)
            .join(Order, OrderItem.order_id == Order.id)
            .filter(
                Order.user_id == user_id,
                OrderItem.product_id == product_id,
                Order.status != "cancelled"
            )
            .first()
        )
        return purchased_item is not None

    @staticmethod
    def get_product_reviews(product_id, page=1, per_page=5, sort_by="recent"):
        """Get paginated reviews and rating distribution for a product."""
        query = Review.query.filter_by(product_id=product_id)

        if sort_by == "highest":
            query = query.order_by(Review.rating.desc(), Review.created_at.desc())
        elif sort_by == "lowest":
            query = query.order_by(Review.rating.asc(), Review.created_at.desc())
        elif sort_by == "helpful":
            query = query.order_by(Review.helpful_count.desc(), Review.created_at.desc())
        else:  # recent
            query = query.order_by(Review.created_at.desc())

        total = query.count()
        total_pages = max(1, (total + per_page - 1) // per_page)
        page = max(1, min(page, total_pages))

        reviews = query.offset((page - 1) * per_page).limit(per_page).all()

        # Rating distribution calculation
        all_reviews = Review.query.filter_by(product_id=product_id).all()
        total_count = len(all_reviews)
        distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        avg_rating = 0.0

        if total_count > 0:
            rating_sum = 0
            for r in all_reviews:
                distribution[r.rating] = distribution.get(r.rating, 0) + 1
                rating_sum += r.rating
            avg_rating = round(rating_sum / total_count, 1)

        return {
            "reviews": [r.to_dict() for r in reviews],
            "avg_rating": avg_rating,
            "total_reviews": total_count,
            "distribution": distribution,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1,
            },
        }

    @staticmethod
    def create_review(user_id, product_id, rating, comment=None):
        """Create a new product review for verified purchaser."""
        product = db.session.get(Product, product_id)
        if not product:
            return None, "Product not found."

        if not ReviewService.is_verified_purchase(user_id, product_id):
            return None, "Only verified purchasers who ordered this item can leave a review."

        existing = Review.query.filter_by(user_id=user_id, product_id=product_id).first()
        if existing:
            return None, "You have already reviewed this product. You can edit your existing review."

        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return None, "Rating must be an integer between 1 and 5."

        review = Review(
            user_id=user_id,
            product_id=product_id,
            rating=rating,
            comment=comment.strip() if comment else None,
        )

        db.session.add(review)
        db.session.commit()
        return review, None

    @staticmethod
    def update_review(user_id, review_id, rating=None, comment=None):
        """Update existing review by author."""
        review = db.session.get(Review, review_id)
        if not review:
            return None, "Review not found."

        if review.user_id != user_id:
            return None, "You can only update your own review."

        if rating is not None:
            if not isinstance(rating, int) or rating < 1 or rating > 5:
                return None, "Rating must be an integer between 1 and 5."
            review.rating = rating

        if comment is not None:
            review.comment = comment.strip() if comment else None

        db.session.commit()
        return review, None

    @staticmethod
    def delete_review(user_id, user_role, review_id):
        """Delete review by author, admin, or seller of the product."""
        review = db.session.get(Review, review_id)
        if not review:
            return False, "Review not found."

        # Authorization: Author, Admin, or Product Seller can delete/moderate
        is_author = review.user_id == user_id
        is_admin = user_role == "admin"
        is_seller = user_role == "seller" and review.product and review.product.seller_id == user_id

        if not (is_author or is_admin or is_seller):
            return False, "You do not have permission to delete this review."

        db.session.delete(review)
        db.session.commit()
        return True, "Review deleted successfully."

    @staticmethod
    def mark_helpful(review_id):
        """Increment helpful votes for a review."""
        review = db.session.get(Review, review_id)
        if not review:
            return None, "Review not found."

        review.helpful_count += 1
        db.session.commit()
        return review, None

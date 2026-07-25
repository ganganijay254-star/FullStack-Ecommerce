from app.extensions import db
from app.models.product import Product


class ProductService:

    @staticmethod
    def get_all_products(search=None, category=None, sort_by="latest", page=1, per_page=12, seller_id=None, min_price=None, max_price=None):
        """Get all products with optional filtering, search, and pagination."""
        query = Product.query

        if seller_id is not None:
            query = query.filter(Product.seller_id == seller_id)
        elif seller_id is None:
            query = query.filter(Product.is_active.is_(True))

        # Search by name
        if search:
            query = query.filter(Product.name.ilike(f"%{search}%"))

        # Filter by category
        if category:
            query = query.filter(Product.category == category)

        if min_price is not None:
            query = query.filter(Product.price >= min_price)
        if max_price is not None:
            query = query.filter(Product.price <= max_price)

        # Sorting
        if sort_by == "latest":
            query = query.order_by(Product.created_at.desc())
        elif sort_by == "price_asc":
            query = query.order_by(Product.price.asc())
        elif sort_by == "price_desc":
            query = query.order_by(Product.price.desc())
        elif sort_by == "name":
            query = query.order_by(Product.name.asc())
        else:
            query = query.order_by(Product.created_at.desc())

        # Pagination
        total = query.count()
        total_pages = max(1, (total + per_page - 1) // per_page)
        page = max(1, min(page, total_pages))

        products = query.offset((page - 1) * per_page).limit(per_page).all()

        return {
            "products": [p.to_dict() for p in products],
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
    def get_product_by_id(product_id):
        """Get a single product by ID."""
        product = Product.query.get(product_id)
        if not product:
            return None
        return product

    @staticmethod
    def create_product(data, seller_id=None):
        """Create a new product."""
        product = Product(
            seller_id=seller_id,
            name=data.get("name", "").strip(),
            description=data.get("description", "").strip() or None,
            category=data.get("category", "").strip() or None,
            brand=data.get("brand", "").strip() or None,
            price=float(data["price"]),
            stock=int(data["stock"]) if data.get("stock") else 0,
            image=data.get("image_url", "").strip() or None,
        )

        db.session.add(product)
        db.session.commit()

        return product

    @staticmethod
    def update_product(product_id, data, seller_id=None):
        """Update a product."""
        product = Product.query.get(product_id)
        if not product:
            return None, "Product not found."
        if seller_id is not None and product.seller_id != seller_id:
            return None, "You can only manage your own products."

        # Update fields if provided
        if "name" in data and data["name"] is not None:
            product.name = data["name"].strip()
        if "description" in data:
            product.description = data["description"].strip() if data["description"] else None
        if "category" in data:
            product.category = data["category"].strip() if data["category"] else None
        if "brand" in data:
            product.brand = data["brand"].strip() if data["brand"] else None
        if "price" in data and data["price"] is not None:
            product.price = float(data["price"])
        if "stock" in data and data["stock"] is not None:
            product.stock = int(data["stock"])
        if "image_url" in data:
            product.image = data["image_url"].strip() if data["image_url"] else None
        if "is_active" in data and data["is_active"] is not None:
            product.is_active = bool(data["is_active"])

        db.session.commit()

        return product, None

    @staticmethod
    def delete_product(product_id, seller_id=None):
        """Delete a product from the database."""
        product = Product.query.get(product_id)
        if not product:
            return False, "Product not found."
        if seller_id is not None and product.seller_id != seller_id:
            return False, "You can only manage your own products."

        db.session.delete(product)
        db.session.commit()

        return True, "Product deleted successfully."

    @staticmethod
    def get_all_categories():
        """Get all distinct product categories."""
        categories = (
            db.session.query(Product.category)
            .filter(Product.category.isnot(None))
            .distinct()
            .order_by(Product.category.asc())
            .all()
        )
        return [c[0] for c in categories]

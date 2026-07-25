from flask import Flask
from app.models.user import User
from app.config.config import Config
from app.extensions import db, migrate, bcrypt, jwt, cors
from flask_bcrypt import Bcrypt
    
    def create_app():
        app = Flask(__name__)
    
        app.config.from_object(Config)
    
        cloud_name = app.config.get("CLOUDINARY_CLOUD_NAME") or "<missing>"
        api_key = app.config.get("CLOUDINARY_API_KEY") or ""
        masked_api_key = f"{api_key[:4]}{'*' * max(0, len(api_key) - 6)}{api_key[-2:]}" if api_key else "<missing>"
        app.logger.warning(
            "Cloudinary configuration: Cloud Name=%s, API Key=%s, API Secret Loaded=%s",
            cloud_name,
            masked_api_key,
            bool(app.config.get("CLOUDINARY_API_SECRET")),
        )
    
        db.init_app(app)
        migrate.init_app(app, db)
        bcrypt.init_app(app)
        jwt.init_app(app)
        cors.init_app(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
    
        # Import models
        from app.models.user import User
        from app.models.product import Product
        from app.models.cart import Cart, CartItem
        from app.models.wishlist import WishlistItem
        from app.models.order import Order, OrderItem
        from app.models.review import Review
    
        # Register blueprints
        from app.routes.auth_routes import auth_bp
        app.register_blueprint(auth_bp)
    
        from app.routes.product_routes import product_bp
        app.register_blueprint(product_bp)
    
        from app.routes.cart_routes import cart_bp
        app.register_blueprint(cart_bp)
    
        from app.routes.wishlist_routes import wishlist_bp
        app.register_blueprint(wishlist_bp)
    
        from app.routes.order_routes import order_bp
        app.register_blueprint(order_bp)
    
        from app.routes.admin_routes import admin_bp
        app.register_blueprint(admin_bp)
    
        from app.routes.review_routes import review_bp
        app.register_blueprint(review_bp)
    
            with app.app_context():
        db.create_all()

        try:
            from sqlalchemy import text

            db.session.execute(
                text(
                    "ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent FLOAT DEFAULT 0.0;"
                )
            )
            db.session.commit()

        except Exception as e:
            db.session.rollback()
            app.logger.warning("Auto migration check: %s", e)

        # Create Default Admin
        admin = User.query.filter_by(email="admin@gmail.com").first()

        if not admin:
            admin = User(
                full_name="System Admin",
                email="admin@gmail.com",
                password=bcrypt.generate_password_hash("Admin@123").decode("utf-8"),
                phone="9999999999",
                role="admin",
                is_active=True,
            )

            db.session.add(admin)
            db.session.commit()
            app.logger.info("✅ Default Admin Created")
        else:
            app.logger.info("✅ Admin Already Exists")
   
    
        @jwt.unauthorized_loader
        def missing_token(message):
            return {"success": False, "message": "Please sign in to continue."}, 401
    
        @jwt.invalid_token_loader
        def invalid_token(message):
            return {"success": False, "message": "Your session is invalid. Please sign in again."}, 401
    
        return app

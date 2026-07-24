from flask import Flask

from app.config.config import Config
from app.extensions import db, migrate, bcrypt, jwt, cors


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
    cors.init_app(app)

    # Import models
    from app.models.user import User
    from app.models.product import Product
    from app.models.cart import Cart, CartItem

# Register blueprints
    from app.routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp)

    from app.routes.product_routes import product_bp
    app.register_blueprint(product_bp)

    from app.routes.cart_routes import cart_bp
    app.register_blueprint(cart_bp)

    return app

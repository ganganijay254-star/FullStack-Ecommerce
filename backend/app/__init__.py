from flask import Flask

from app.config.config import Config
from app.extensions import db, migrate, bcrypt, jwt, cors


def create_app():
    app = Flask(__name__)

    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)
    cors.init_app(app)

    # Import models
    from app.models.user import User
    from app.models.product import Product

# Register blueprints
    from app.routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp)

    from app.routes.product_routes import product_bp
    app.register_blueprint(product_bp)

    return app

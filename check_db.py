"""Check database schema vs model."""
from app import create_app
from app.extensions import db
from sqlalchemy import inspect

app = create_app()
with app.app_context():
    inspector = inspect(db.engine)
    
    print("=== PRODUCTS TABLE (Actual DB) ===")
    columns = inspector.get_columns('products')
    for c in columns:
        nullable_str = "NULL" if c['nullable'] else "NOT NULL"
        default_str = f"default={c['default']}" if c['default'] else ""
        print(f"  {c['name']:20} {str(c['type']):30} {nullable_str} {default_str}")
    
    print("\n=== PRODUCT MODEL (SQLAlchemy) ===")
    from app.models.product import Product
    mapper = db.Model.metadata.tables['products']
    for col_name, col in mapper.columns.items():
        nullable_str = "NULL" if col.nullable else "NOT NULL"
        print(f"  {col.name:20} {str(col.type):30} {nullable_str}")
    
    print("\n=== SAMPLE PRODUCT ===")
    from app.models.product import Product
    product = Product.query.first()
    if product:
        print(f"Product ID: {product.id}")
        print(f"  name: {product.name}")
        print(f"  image_url attr exists:", hasattr(product, 'image_url'))
        print(f"  brand attr exists:", hasattr(product, 'brand'))
        try:
            print(f"  image_url value: {product.image_url}")
        except Exception as e:
            print(f"  image_url ERROR: {e}")
        try:
            print(f"  brand value: {product.brand}")
        except Exception as e:
            print(f"  brand ERROR: {e}")
    else:
        print("No products found")

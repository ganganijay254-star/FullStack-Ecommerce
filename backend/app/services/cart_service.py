from app.extensions import db
from app.models.cart import Cart, CartItem
from app.models.product import Product


class CartService:
    @staticmethod
    def get_or_create_cart(user_id):
        cart = Cart.query.filter_by(user_id=user_id).first()
        if not cart:
            cart = Cart(user_id=user_id)
            db.session.add(cart)
            db.session.commit()
        return cart

    @staticmethod
    def add_item(user_id, product_id, quantity):
        product = db.session.get(Product, product_id)
        if not product:
            return None, "Product not found."
        if product.stock is None or product.stock <= 0:
            return None, "This product is out of stock."

        cart = CartService.get_or_create_cart(user_id)
        item = CartItem.query.filter_by(cart_id=cart.id, product_id=product_id).first()
        new_quantity = quantity + (item.quantity if item else 0)
        if new_quantity > product.stock:
            return None, f"Only {product.stock} item(s) are available."

        if item:
            item.quantity = new_quantity
        else:
            db.session.add(CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity))
        db.session.commit()
        return Cart.query.filter_by(user_id=user_id).first(), None

    @staticmethod
    def update_item(user_id, item_id, quantity):
        cart = CartService.get_or_create_cart(user_id)
        item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
        if not item:
            return None, "Cart item not found."
        if quantity > (item.product.stock or 0):
            return None, f"Only {item.product.stock or 0} item(s) are available."

        item.quantity = quantity
        db.session.commit()
        return Cart.query.filter_by(user_id=user_id).first(), None

    @staticmethod
    def remove_item(user_id, item_id):
        cart = CartService.get_or_create_cart(user_id)
        item = CartItem.query.filter_by(id=item_id, cart_id=cart.id).first()
        if not item:
            return None, "Cart item not found."
        db.session.delete(item)
        db.session.commit()
        return Cart.query.filter_by(user_id=user_id).first(), None

    @staticmethod
    def clear_cart(user_id):
        cart = CartService.get_or_create_cart(user_id)
        CartItem.query.filter_by(cart_id=cart.id).delete()
        db.session.commit()
        return Cart.query.filter_by(user_id=user_id).first()

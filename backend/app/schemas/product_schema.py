def validate_create_product_data(data):
    """Validate product creation input."""
    errors = {}

    # name (required)
    name = data.get("name", "").strip()
    if not name:
        errors["name"] = "Product name is required."
    elif len(name) < 2 or len(name) > 150:
        errors["name"] = "Product name must be between 2 and 150 characters."

    # description (optional)
    description = data.get("description", "").strip()
    if description and len(description) > 5000:
        errors["description"] = "Description must be at most 5000 characters."

    # price (required)
    price = data.get("price")
    if price is None:
        errors["price"] = "Price is required."
    else:
        try:
            price_val = float(price)
            if price_val < 0:
                errors["price"] = "Price must be a positive number."
        except (ValueError, TypeError):
            errors["price"] = "Price must be a valid number."

    # stock (required)
    stock = data.get("stock")
    if stock is None:
        errors["stock"] = "Stock is required."
    else:
        try:
            stock_val = int(stock)
            if stock_val < 0:
                errors["stock"] = "Stock must be a non-negative integer."
        except (ValueError, TypeError):
            errors["stock"] = "Stock must be a valid integer."

    # category (optional)
    category = data.get("category", "").strip()
    if category and len(category) > 100:
        errors["category"] = "Category must be at most 100 characters."

    # image_url (optional)
    image_url = data.get("image_url", "").strip()
    if image_url and len(image_url) > 500:
        errors["image_url"] = "Image URL must be at most 500 characters."

    return errors


def validate_update_product_data(data):
    """Validate product update input (partial)."""
    errors = {}

    # name (optional)
    name = data.get("name")
    if name is not None:
        name = name.strip()
        if len(name) < 2 or len(name) > 150:
            errors["name"] = "Product name must be between 2 and 150 characters."

    # description (optional)
    description = data.get("description")
    if description is not None and len(description) > 5000:
        errors["description"] = "Description must be at most 5000 characters."

    # price (optional)
    price = data.get("price")
    if price is not None:
        try:
            price_val = float(price)
            if price_val < 0:
                errors["price"] = "Price must be a positive number."
        except (ValueError, TypeError):
            errors["price"] = "Price must be a valid number."

    # stock (optional)
    stock = data.get("stock")
    if stock is not None:
        try:
            stock_val = int(stock)
            if stock_val < 0:
                errors["stock"] = "Stock must be a non-negative integer."
        except (ValueError, TypeError):
            errors["stock"] = "Stock must be a valid integer."

    # category (optional)
    category = data.get("category")
    if category is not None and len(category) > 100:
        errors["category"] = "Category must be at most 100 characters."

    # image_url (optional)
    image_url = data.get("image_url")
    if image_url is not None and len(image_url) > 500:
        errors["image_url"] = "Image URL must be at most 500 characters."

    return errors

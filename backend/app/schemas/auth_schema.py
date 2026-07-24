import re


def validate_register_data(data):
    """Validate registration input data."""
    errors = {}

    # full_name
    full_name = data.get("full_name", "").strip()
    if not full_name:
        errors["full_name"] = "Full name is required."
    elif len(full_name) < 2 or len(full_name) > 100:
        errors["full_name"] = "Full name must be between 2 and 100 characters."

    # email
    email = data.get("email", "").strip()
    if not email:
        errors["email"] = "Email is required."
    else:
        pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(pattern, email):
            errors["email"] = "Invalid email format."

    # password
    password = data.get("password", "")
    if not password:
        errors["password"] = "Password is required."
    elif len(password) < 6:
        errors["password"] = "Password must be at least 6 characters."

    # phone (optional)
    phone = data.get("phone", "")
    if phone and len(phone) > 20:
        errors["phone"] = "Phone number must be at most 20 characters."

    return errors


def validate_login_data(data):
    """Validate login input data."""
    errors = {}

    email = data.get("email", "").strip()
    if not email:
        errors["email"] = "Email is required."

    password = data.get("password", "")
    if not password:
        errors["password"] = "Password is required."

    return errors


from app.extensions import db, bcrypt
from app.models.user import User


class AuthService:

    @staticmethod
    def register_user(data):
        """Register a new user."""
        full_name = data.get("full_name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        phone = data.get("phone", "").strip()

        # Check for duplicate email
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return {"success": False, "message": "An account with this email already exists."}, None

        # Hash password
        hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

        # Create user
        user = User(
            full_name=full_name,
            email=email,
            password=hashed_password,
            phone=phone if phone else None,
            role="user",
        )

        db.session.add(user)
        db.session.commit()

        return {"success": True, "message": "User registered successfully.", "user": user.to_dict()}, user

    @staticmethod
    def login_user(data):
        """Authenticate user and return JWT payload."""
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        # Find user by email
        user = User.query.filter_by(email=email).first()
        if not user:
            return {"success": False, "message": "Invalid email or password."}, None

        # Verify password safely
        try:
            is_valid = bcrypt.check_password_hash(user.password, password)
        except Exception:
            is_valid = False

        if not is_valid:
            return {"success": False, "message": "Invalid email or password."}, None

        # Check if user is active
        if not user.is_active:
            return {"success": False, "message": "Account is deactivated. Contact support."}, None

        return {"success": True, "message": "Login successful.", "user": user.to_dict()}, user


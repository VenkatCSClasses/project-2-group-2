import jwt
import os
from app.database import cache
from fastapi.security import OAuth2PasswordBearer
from argon2 import PasswordHasher
from fastapi import Depends, HTTPException, status
from io import BytesIO
from PIL import Image
from uuid import uuid4
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
ph = PasswordHasher()


def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Get user info from the JWT token, also invalidate the token if the user is banned in the Valkey cache.

    token: The JWT token provided by the client in the Authorization header.

    returns: A dictionary containing user_id, role and token if the token is valid and the user is not banned, otherwise raises an HTTPException.
    """
    try:
        payload = jwt.decode(
            token, 
            os.getenv("JWT_SECRET", "very_secret_key_that_has_no_flaws"), 
            algorithms=["HS256"]
        )
        
        user_id = payload.get("user_id")
        role = payload.get("role")

        if user_id is None or role is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            is_banned = cache.sismember("banned_users", str(user_id))
        except Exception:
            is_banned = False

        if is_banned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been suspended"
            )

        return {
            "user_id": user_id,
            "role": role,
            "token": token
        }
        
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_moderator(current_user: dict = Depends(get_current_user)):
    """
    Dependency to ensure the current user is a moderator.

    current_user: The current user information obtained from the JWT token.

    returns: The current user information if the user is a moderator, otherwise raises an HTTPException.
    """
    if current_user["role"] != "moderator" and current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    return current_user


def get_current_admin(current_user: dict = Depends(get_current_user)):
    """
    Dependency to ensure the current user is an admin.

    current_user: The current user information obtained from the JWT token.

    returns: The current user information if the user is an admin, otherwise raises an HTTPException.
    """
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action"
        )
    return current_user


def process_and_save_image(file_content: bytes, username: str = None) -> str:
    """
    Process and save an image file.

    file_content: The content of the image file.
    username: The username of the user uploading the image.

    returns: The path to the saved image file.
    """
    img = Image.open(BytesIO(file_content))
    
    # Standarize color mode
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
    
    # Resize images to save storage for large uploads
    max_size = (1920, 1920) # Max width and height
    img.thumbnail(max_size, Image.Resampling.LANCZOS)

    exif_data = img.getexif()
    exif_data.clear()
    if username:
        exif_data[315] = username  # Set the Artist tag to the username for attribution
    
    os.makedirs(upload_dir, exist_ok=True)

    file_name = f"{uuid4()}.webp"
    file_path = f"{upload_dir}/{file_name}"
    img.save(file_path, "WEBP", quality=80, optimize=True, exif=exif_data)

    return file_path


def ensure_admin_user_in_db(db):
    """
    Ensure that an admin user exists in the database. If not, create a default admin user.

    db: The database session to use for querying and creating the admin user.
    """
    

    admin_user = db.query(User).filter(User.role == "admin").first()
    if not admin_user:
        default_admin = User(
            username=os.getenv("DEFAULT_ADMIN_USERNAME", "root"),
            password_hash=ph.hash(os.getenv("DEFAULT_ADMIN_PASSWORD", "root")),
            email=os.getenv("DEFAULT_ADMIN_EMAIL", ""),
            role="admin"
        )
        db.add(default_admin)
        db.commit()
        db.refresh(default_admin)
    print("Admin user ensured in database")
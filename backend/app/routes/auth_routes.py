import os
from datetime import datetime, timedelta
from fastapi import APIRouter
from fastapi import Depends, HTTPException, UploadFile
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from typing import Annotated
from app.database import get_db
from app.models import User
from argon2 import PasswordHasher
from app.utils import get_current_user, process_and_save_image
import jwt
from app.schemas import RegisterForm, UserRole, ChangePasswordForm
from sqlmodel import Session, select


# This will be mounted at "/auth" in main.py, so all routes here will be prefixed with /auth
router = APIRouter()

ph = PasswordHasher()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def generate_token(user_id: str, role: UserRole, token_type: str = "access"):
    payload = {"user_id": str(user_id), "role": role.value, "token_type": token_type}
    payload["exp"] = int((datetime.utcnow() + timedelta(hours=24)).timestamp())
    print(f"Generating token for user: {user_id}, role: {role.value}")
    token = jwt.encode(payload, os.getenv("JWT_SECRET", "very_secret_key_that_has_no_flaws"), algorithm="HS256")
    return token


def verify_password(user: User, password_str: str):
    try:
        ph.verify(user.password_hash, password_str)
        return True
    except Exception:
        return False


def login_user(db, username: str, password_str: str):
    # Find the user
    user = db.exec(select(User).where(User.username == username)).first()
    if user is None:
        raise ValueError("Invalid username or password")
    
    verified = verify_password(user, password_str)
    if not verified:
        raise ValueError("Invalid username or password")

    token = generate_token(user.id, user.role)
    return token



def register_user(db, username: str, password_str: str, email: str, image: UploadFile = None):
    # Check if the username is already taken
    existing_user = db.exec(select(User).where(User.username == username)).first()
    if existing_user:
        raise ValueError("Username already taken")
    existing_email = db.exec(select(User).where(User.email == email)).first()
    if existing_email:
        raise ValueError("Email already registered")
    
    # Process the image if provided
    image_path = None
    if image:
        try:
            image_path = process_and_save_image(image.file.read(), max_size=(512, 512))
        except Exception as e:
            raise ValueError("Error processing profile image") from e

    # Hash the password
    password_hash = ph.hash(password_str)
    
    # Create the user
    new_user = User(username=username, password_hash=password_hash, email=email, profile_image_url=image_path)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = generate_token(new_user.id, new_user.role)
    return token


@router.post("/")
async def auth_root():
    """
    Authentication root endpoint.
    """
    return {"message": "Authentication endpoint"}


@router.post("/login")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)):
    """
    Log in a user.

    This endpoint allows a user to log in by providing their username and password.

    - **form_data**: The login form data containing the username and password.
    - **db**: The database session.

    """

    try:
        token = login_user(db, form_data.username, form_data.password)
        return {
            "message": "Logged in successfully", 
            "access_token": token, 
            "token_type": "bearer"
        }
    except ValueError as e:
        return {"message": str(e)}, 401


@router.post("/register")
async def register(form_data: Annotated[RegisterForm, Depends()], db: Session = Depends(get_db)):
    """
    Register a new user.

    This endpoint allows a new user to register by providing a username, password, and email.

    - **form_data**: The registration form data containing the username, password, and email.
    - **db**: The database session.
    """
    try:
        token = register_user(db, form_data.username, form_data.password, form_data.email, form_data.profile_picture)
        return {
            "message": "User registered successfully", 
            "access_token": token, 
            "token_type": "bearer"
        }
    except ValueError as e:
        return {"message": str(e)}, 400


@router.post("/change-password")
async def change_password(form_data: Annotated[ChangePasswordForm, Depends()], db: Session = Depends(get_db)):
    """
    Change the password for the current user.

    This endpoint allows a user to change their password by providing the current password and the new password.

    - **form_data**: The form data containing the current password and the new password.
    - **db**: The database session.
    """
    # Implementation for changing password
        
    user = db.exec(select(User).where(User.username == form_data.username)).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(user, form_data.current_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    # If password is correct, update it
    user.password_hash = ph.hash(form_data.new_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "Password changed successfully"}


@router.post("/change-username")
async def change_username(new_username: str, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Change the username for the current user.

    - **new_username**: The new username to set for the user.
    """

    user = db.exec(select(User).where(User.id == current_user["user_id"])).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    # Check if the new username is already taken
    existing_user = db.exec(select(User).where(User.username == new_username)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")

    user.username = new_username
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": "Username changed successfully", "username": new_username}
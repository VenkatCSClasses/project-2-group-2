import os
from fastapi import APIRouter
from fastapi import Depends
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from typing import Annotated
from app.database import get_db
from app.models import User
from argon2 import PasswordHasher
import jwt
from app.schemas import RegisterForm, UserRole
from sqlalchemy.orm import Session

# This will be mounted at "/auth" in main.py, so all routes here will be prefixed with /auth
router = APIRouter()

ph = PasswordHasher()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def generate_token(user_id: int, role: UserRole):
    payload = {"user_id": user_id, "role": role.value}
    payload["exp"] = int((jwt.datetime.datetime.utcnow() + jwt.timedelta(hours=24)).timestamp())
    print(f"Generating token for user: {user_id}, role: {role.value}")
    token = jwt.encode(payload, os.getenv("JWT_SECRET", "very_secret_key_that_has_no_flaws"), algorithm="HS256")
    return token


def login_user(db, username: str, password_str: str):
    # Find the user
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise ValueError("Invalid username or password")
    
    try:
        ph.verify(user.password_hash, password_str)
        print(f"User logged in: {user.username}")
        token = generate_token(user.id, user.role)
        refresh_token = generate_token(user.id, user.role, token_type="refresh")
        return token, refresh_token
    except Exception as e:
        print(f"Error occurred while logging in user: {user.username}")
        raise ValueError("Invalid username or password")


def register_user(db, username: str, password_str: str, email: str):
    # Check if the username is already taken
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise ValueError("Username already taken")
    
    # Hash the password
    password_hash = ph.hash(password_str)
    
    # Create the user
    new_user = User(username=username, password_hash=password_hash, email=email)
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
        token, refresh_token = login_user(db, form_data.username, form_data.password)
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
        token = register_user(db, form_data.username, form_data.password, form_data.email)
        return {
            "message": "User registered successfully", 
            "access_token": token, 
            "token_type": "bearer"
        }
    except ValueError as e:
        return {"message": str(e)}, 400
from fastapi import APIRouter
from fastapi import Depends
from fastapi.security import OAuth2PasswordRequestForm
from typing import Annotated

# This will be mounted at "/auth" in main.py, so all routes here will be prefixed with /auth
router = APIRouter()

@router.post("/")
async def auth_root():
    """
    Authentication root endpoint.
    """
    return {"message": "Authentication endpoint"}


@router.post("/login")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    """
    Log in a user.

    This endpoint allows a user to log in by providing their username and password.

    - **form_data**: The login form data containing the username and password.
    """
    return {"message": "Under construction", "access_token": "<token will go here>", "token_type": "bearer"}


@router.post("/register")
async def register(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    """
    Register a new user.

    This endpoint allows a new user to register by providing a username and password.

    - **form_data**: The registration form data containing the username and password.
    """
    return {"message": "Under construction", "access_token": "<token will go here>", "token_type": "bearer"}


@router.get("/logout")
async def logout():
    """
    Log out a user.

    This endpoint allows a logged-in user to log out of their session.

    """
    return {"message": "Under construction"}
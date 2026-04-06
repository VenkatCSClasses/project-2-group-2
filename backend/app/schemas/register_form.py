from pydantic import BaseModel, EmailStr
from typing import Annotated
from fastapi import Form, Depends


class RegisterForm:
    """
    A Pydantic model representing the registration form data.
    """
    def __init__(
        self,
        username: str = Form(...),
        password: str = Form(...),
        email: EmailStr = Form(...)
    ):
        self.username = username
        self.password = password
        self.email = email



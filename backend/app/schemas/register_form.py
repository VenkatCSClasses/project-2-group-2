from pydantic import EmailStr
from fastapi import Form


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



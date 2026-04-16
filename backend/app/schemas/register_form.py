from pydantic import EmailStr
from fastapi import Form
from typing import Optional
from fastapi import UploadFile, File

class RegisterForm:
    """
    A Pydantic model representing the registration form data.
    """
    def __init__(
        self,
        username: str = Form(...),
        password: str = Form(...),
        email: EmailStr = Form(...),
        profile_picture: Optional[UploadFile] = File(None)

    ):
        self.username = username
        self.password = password
        self.email = email
        self.profile_picture = profile_picture



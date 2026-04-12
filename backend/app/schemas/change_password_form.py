from fastapi import Form


class ChangePasswordForm:
    """
    A Pydantic model representing the change password form data.
    """
    def __init__(
        self,
        username: str = Form(...),
        current_password: str = Form(...),
        new_password: str = Form(...)
    ):
        self.username = username
        self.current_password = current_password
        self.new_password = new_password



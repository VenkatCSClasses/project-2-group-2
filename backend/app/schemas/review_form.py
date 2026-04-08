from fastapi import Form, UploadFile, File
from typing import Optional

class ReviewForm:
    def __init__(
        self,
        rating: int = Form(..., ge=1, le=10), # Constraints: 1 to 10 each int represents a half star, so 10 = 5 stars, 9 = 4.5 stars, etc
        description: str = Form(""),
        image: Optional[UploadFile] = File(None)
    ):
        self.rating = rating
        self.description = description
        self.image = image
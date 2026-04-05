from fastapi import Form, UploadFile, File
from typing import Optional

class FoodReviewForm:
    def __init__(
        self,
        item_name: str = Form(...),
        dining_hall: str = Form(...),
        rating: int = Form(..., ge=1, le=5), # Constraints: 1 to 5 stars
        description: str = Form(""),
        image: Optional[UploadFile] = File(None)
    ):
        self.item_name = item_name
        self.dining_hall = dining_hall
        self.rating = rating
        self.description = description
        self.image = image
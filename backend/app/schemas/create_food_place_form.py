from fastapi import Form


class FoodPlaceCreateForm:
    """
    A Pydantic model representing creating a food place.
    """
    def __init__(
        self,
        name: str = Form(...),
        description: str = Form(...)
    ):
        self.name = name
        self.description = description



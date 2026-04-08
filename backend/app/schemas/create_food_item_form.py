from fastapi import Form


class FoodItemCreateForm:
    """
    A Pydantic model representing creating a food item.
    """
    def __init__(
        self,
        name: str = Form(...),
        description: str = Form(...)
    ):
        self.name = name
        self.description = description



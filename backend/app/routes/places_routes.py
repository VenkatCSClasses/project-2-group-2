from fastapi import APIRouter, Depends
from app.schemas import ReviewForm

# This will be mounted at "/places" in main.py, so all routes here will be prefixed with /places
router = APIRouter()

@router.get("/")
async def get_places(start: int = 0, limit: int = 10):
    """
    Get a list of places (like dining halls).

    This endpoint retrieves a list of food places with pagination. 

    - **start**: The starting index for pagination (default is 0).
    - **limit**: The maximum number of places to return (default is 10).
    """
    return {"message": "Under construction", "start": start, "limit": limit, "places": []}
    

@router.get("/{place_name}")
async def get_place(place_name: str):
    """
    Get information about a place (like a dining hall).

    This endpoint retrieves information about a specific food place, including its menu.

    - **place_name**: The name of the place to retrieve.
    """
    return {"message": "Under construction", "place_name": place_name, "menu": []}


@router.post("/{place_name}/review")
async def review_place(place_name: str, form: ReviewForm = Depends()):
    """
    Submit a review for a place (like a dining hall).

    - **place_name**: The name of the place to review.
    - **form**: The review form data.

    """
    return {"message": "Under construction"}



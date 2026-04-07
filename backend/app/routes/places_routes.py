from fastapi import APIRouter, Depends
from app.schemas import ReviewForm
from fastapi.security import OAuth2PasswordBearer

# This will be mounted at "/places" in main.py, so all routes here will be prefixed with /places
router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@router.get("/")
async def get_places(start: int = 0, limit: int = 10):
    """
    Get a list of places (like dining halls).

    This endpoint retrieves a list of food places with pagination. 

    - **start**: The starting index for pagination (default is 0).
    - **limit**: The maximum number of places to return (default is 10).
    """
    return {"message": "Under construction", "start": start, "limit": limit, "places": []}
    

@router.get("/search")
async def search_places(query: str, category: str = None):
    """
    Search for places (like dining halls).

    This endpoint allows users to search for food places based on a query string and optional category filter.

    - **query**: The search query for finding food places.
    - **category**: The category to filter by (optional).
    """
    return {"message": "Under construction", "query": query, "category": category, "results": []}


@router.get("/{place_name}")
async def get_place(place_name: str):
    """
    Get information about a place (like a dining hall).

    This endpoint retrieves information about a specific food place, including its menu.

    - **place_name**: The name of the place to retrieve.
    """
    return {"message": "Under construction", "place_name": place_name, "menu": []}


@router.post("/{place_name}/review")
async def review_place(place_name: str, form: ReviewForm = Depends(), token: str = Depends(oauth2_scheme)):
    """
    Submit a review for a place (like a dining hall).

    - **place_name**: The name of the place to review.
    - **form**: The review form data.

    """
    return {"message": "Under construction"}
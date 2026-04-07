from fastapi import APIRouter, Depends
from app.schemas import ReviewForm
from fastapi.security import OAuth2PasswordBearer

# This will be mounted at "/items" in main.py, so all routes here will be prefixed with /items
router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.get("/")
async def get_items(start: int = 0, limit: int = 10):
    """
    Get a list of food items.

    This endpoint retrieves a list of food items with pagination. 

    - **start**: The starting index for pagination (default is 0).
    - **limit**: The maximum number of items to return (default is 10).
    """
    return {"message": "Under construction", "start": start, "limit": limit, "items": []}


@router.get("/search")
async def search_items(query: str, category: str = None):
    """
    Search for food items.

    This endpoint allows users to search for food items based on a query string and optional category filter.

    - **query**: The search query for finding food items.
    - **category**: The category to filter by (optional).
    """
    return {"message": "Under construction", "query": query, "category": category, "results": []}


@router.get("/{item_id}")
async def get_item(item_id: str):
    """
    Get information about a food item.

    This endpoint retrieves information about a specific food item.

    - **item_id**: The ID of the item to retrieve.
    """
    return {"message": "Under construction", "item_id": item_id}


@router.post("/{item_id}/review")
async def review_item(item_id: str, form: ReviewForm = Depends(), token: str = Depends(oauth2_scheme)):
    """
    Submit a review for a food item.

    - **item_id**: The ID of the item to review.
    - **form**: The review form data.

    """
    return {"message": "Under construction"}


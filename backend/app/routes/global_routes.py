from fastapi import APIRouter
from fastapi.responses import RedirectResponse

# This will be mounted at "/" in main.py, so all routes here will be prefixed with "/"
router = APIRouter()

@router.get("/")
async def index():
    """
    Redirect to API documentation.
    """
    return RedirectResponse(url="/docs")


@router.get("/search")
async def search(query: str, category: str = None):
    """
    Global seach endpoint.

    This endpoint allows users to search for posts, items, users, dining halls, etc based on a query string.

    - **query**: The search query.
    - **category**: The category to filter by.
    """
    return {"message": "Under construction", "query": query, "category": category}
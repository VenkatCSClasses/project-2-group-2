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
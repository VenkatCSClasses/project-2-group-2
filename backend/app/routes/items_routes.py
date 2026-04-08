from fastapi import APIRouter, Depends, HTTPException
from app.schemas import ReviewForm, FoodItemCreateForm
from app.utils import get_current_user, get_current_admin
from app.database import get_db
from sqlmodel import Session
from app.models import FoodItem, Review, User
from uuid import UUID
from sqlalchemy import or_

# This will be mounted at "/items" in main.py, so all routes here will be prefixed with /items
router = APIRouter()

@router.get("/")
async def get_items(start: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Get a list of food items.

    This endpoint retrieves a list of food items with pagination. 

    - **start**: The starting index for pagination (default is 0).
    - **limit**: The maximum number of items to return (default is 10).
    """
    if limit > 100:
        limit = 100  # Cap the limit to prevent abuse
    if limit < 1:
        limit = 10  # Default to 10 if an invalid limit is provided
    if start < 0:
        start = 0  # Default to 0 if an invalid start is provided

    items_query = db.query(FoodItem).offset(start).limit(limit)
    results = items_query.all()
    return {"start": start, "limit": limit, "items": results}


@router.get("/search")
async def search_items(query: str, db: Session = Depends(get_db)):
    """
    Search for food items.

    This endpoint allows users to search for food items based on a query string and optional category filter.

    - **query**: The search query for finding food items.
    """

    q = db.query(FoodItem).filter(or_(FoodItem.name.ilike(f"%{query}%"), FoodItem.description.ilike(f"%{query}%")))
    results = q.all()
    return {"query": query, "results": results, "count": len(results)}


@router.post("/create")
async def create_item(item: FoodItemCreateForm = Depends(), db: Session = Depends(get_db), current_admin: dict = Depends(get_current_admin)):
    """
    Create a new food item.

    - **item**: The food item data to create.
    """
    if db.query(FoodItem).filter(FoodItem.name == item.name).first():
        raise HTTPException(status_code=400, detail="Item with this name already exists")

    new_item = FoodItem(name=item.name, description=item.description)
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return {"message": "Item created successfully", "item": new_item}


@router.get("/{item_id}")
async def get_item(item_id: str, db: Session = Depends(get_db)):
    """
    Get information about a food item.

    This endpoint retrieves information about a specific food item.

    - **item_id**: The ID of the item to retrieve.
    """

    try:
        item_id = UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    item = db.query(FoodItem).get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"item_id": item_id.value, "item_info": item}


@router.post("/{item_id}/review")
async def review_item(item_id: str, form: ReviewForm = Depends(), current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Submit a review for a food item.

    - **item_id**: The ID of the item to review.
    - **form**: The review form data.

    """

    item = db.query(FoodItem).get(item_id)  # Check if item exists
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    user = db.query(User).get(current_user["user_id"])  # Check if user exists
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    review = Review(
        food_item=item,
        user=user,
        star_rating=form.rating,
        content=form.description,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return {"message": "Review submitted successfully", "review": review}


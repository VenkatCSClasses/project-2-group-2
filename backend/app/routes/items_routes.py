from datetime import date, datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from app.schemas import ReviewForm, FoodItemCreateForm
from app.utils import get_current_user, get_current_admin, process_and_save_image
from app.routes.helpers import get_or_404, parse_uuid
from app.database import get_db
from sqlmodel import Session
from app.models import FoodItem, Review, User
from uuid import UUID
from sqlalchemy import or_

# This will be mounted at "/items" in main.py, so all routes here will be prefixed with /items
router = APIRouter()
EASTERN_TIMEZONE = ZoneInfo("America/New_York")


def get_requested_menu_date(requested_date: date | None) -> date:
    if requested_date is not None:
        return requested_date
    return datetime.now(EASTERN_TIMEZONE).date()

def calculate_average_rating(reviews: list[Review]) -> float:
    if not reviews:
        return None
    total = sum(review.star_rating for review in reviews)
    raw_average = total / len(reviews)
    return round(raw_average) # Round to nearest integer to fit our 1-10 scale

@router.get("/")
async def get_items(start: int = 0, limit: int = 10, requested_date: date | None = Query(default=None, alias="date"), db: Session = Depends(get_db)):
    """
    Get a list of food items.

    This endpoint retrieves a list of food items with pagination.

    - **start**: The starting index for pagination (default is 0).
    - **limit**: The maximum number of items to return (default is 10).
    - **date**: The menu date to filter by in YYYY-MM-DD format. Defaults to today in America/New_York.
    """
    if limit > 100:
        limit = 100  # Cap the limit to prevent abuse
    if limit < 1:
        limit = 10  # Default to 10 if an invalid limit is provided
    if start < 0:
        start = 0  # Default to 0 if an invalid start is provided

    menu_date = get_requested_menu_date(requested_date)
    items_query = (
        db.query(FoodItem)
        .filter(FoodItem.menu_date == menu_date)
        .offset(start)
        .limit(limit)
    )
    results = items_query.all()
    return {"start": start, "limit": limit, "date": menu_date, "items": results}


@router.get("/search")
async def search_items(query: str, requested_date: date | None = Query(default=None, alias="date"), db: Session = Depends(get_db)):
    """
    Search for food items.

    This endpoint allows users to search for food items based on a query string and optional category filter.

    - **query**: The search query for finding food items.
    - **date**: The menu date to filter by in YYYY-MM-DD format. Defaults to today in America/New_York.
    """

    menu_date = get_requested_menu_date(requested_date)
    q = db.query(FoodItem).filter(
        FoodItem.menu_date == menu_date,
        or_(FoodItem.name.ilike(f"%{query}%"), FoodItem.description.ilike(f"%{query}%")),
    )
    results = q.all()
    return {"query": query, "date": menu_date, "results": results, "count": len(results)}


@router.post("/create")
async def create_item(item: FoodItemCreateForm = Depends(), db: Session = Depends(get_db), current_admin: dict = Depends(get_current_admin)):
    """
    Create a new food item.

    - **item**: The food item data to create.
    """
    menu_date = datetime.now(EASTERN_TIMEZONE).date()
    existing_item = db.query(FoodItem).filter(
        FoodItem.name == item.name,
        FoodItem.menu_date == menu_date,
        FoodItem.food_place_id.is_(None),
    ).first()
    if existing_item:
        raise HTTPException(status_code=400, detail="Item with this name already exists")

    try:
        new_item = FoodItem(
            name=item.name,
            description=item.description,
            menu_date=menu_date,
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error creating item") from e
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

    item = get_or_404(db, FoodItem, item_id)

    return {"item_id": str(item_id), "item_info": item}


@router.post("/{item_id}/review")
async def review_item(request: Request, item_id: str, form: ReviewForm = Depends(), current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Submit a review for a food item.

    - **item_id**: The ID of the item to review.
    - **form**: The review form data.

    """

    try:
        item_id = UUID(item_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    item = get_or_404(db, FoodItem, item_id)
    user = get_or_404(db, User, current_user["user_id"])

    image = form.image

    image_path = None
    if image:
        image_path = process_and_save_image(image.file.read(), username=user.username)


    try:
        review = Review(
            food_item=item,
            user=user,
            star_rating=form.rating,
            content=form.description,
            image_url=image_path
        )
        db.add(review)
        db.commit()
        db.refresh(review)

        db.refresh(item)  # Refresh the item to get the latest reviews
        item.average_rating = calculate_average_rating(item.reviews)
        db.add(item)
        db.commit()
        db.refresh(item)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error submitting review") from e

    return {"message": "Review submitted successfully", "review": review, "image_path": image_path if image else None}


@router.get("/{item_id}/reviews")
async def get_item_reviews(item_id: str, start: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Get reviews for a food item.

    This endpoint retrieves all reviews for a specific food item.

    - **item_id**: The ID of the item to retrieve reviews for.
    """

    if limit > 100:
        limit = 100  # Cap the limit to prevent abuse
    if limit < 1:
        limit = 10  # Default to 10 if an invalid limit is provided
    if start < 0:
        start = 0  # Default to 0 if an invalid start is provided


    item_id = parse_uuid(item_id)

    item = get_or_404(db, FoodItem, item_id)

    reviews = db.query(Review).filter(Review.food_item_id == item.id).offset(start).limit(limit).all()
    return {"item_id": item_id, "reviews": reviews, "count": len(reviews)}

from fastapi import APIRouter, Depends, HTTPException
from app.schemas import ReviewForm
from app.database import get_db
from sqlmodel import Session
from app.models import FoodPlace, Review, User
from uuid import UUID
from app.utils import get_current_user
from sqlalchemy import or_


# This will be mounted at "/places" in main.py, so all routes here will be prefixed with /places
router = APIRouter()


def get_place_by_name_or_id(db: Session, place_name: str):
    try:
        place_id = UUID(place_name)
        place = db.query(FoodPlace).get(place_id)
    except ValueError:
        place = db.query(FoodPlace).filter(FoodPlace.name == place_name).first()
    return place

@router.get("/")
async def get_places(start: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Get a list of places (like dining halls).

    This endpoint retrieves a list of food places with pagination. 

    - **start**: The starting index for pagination (default is 0).
    - **limit**: The maximum number of places to return (default is 10).
    """
    if limit > 100:
        limit = 100  # Cap the limit to prevent abuse
    if limit < 1:
        limit = 10  # Default to 10 if an invalid limit is provided
    if start < 0:
        start = 0  # Default to 0 if an invalid start is provided

    place_query = db.query(FoodPlace).offset(start).limit(limit)
    results = place_query.all()


    return {"start": start, "limit": limit, "places": results}
    

@router.get("/search")
async def search_places(query: str, category: str = None, db: Session = Depends(get_db)):
    """
    Search for places (like dining halls).

    This endpoint allows users to search for food places based on a query string and optional category filter.

    - **query**: The search query for finding food places.
    - **category**: The category to filter by (optional).
    """

    q = db.query(FoodPlace).filter(or_(FoodPlace.name.ilike(f"%{query}%"), FoodPlace.description.ilike(f"%{query}%")))
    results = q.all()

    return {"query": query, "category": category, "results": results, "count": len(results)}


@router.post("/create")
async def create_place(place: FoodPlaceCreateForm = Depends(), db: Session = Depends(get_db), current_admin: dict = Depends(get_current_admin)):
    """
    Create a new food place.
    - **place**: The food place data to create.
    """
    if db.query(FoodPlace).filter(FoodPlace.name == place.name).first():
        raise HTTPException(status_code=400, detail="Place with this name already exists")

    new_place = FoodPlace(name=place.name, description=place.description)
    db.add(new_place)
    db.commit()
    db.refresh(new_place)
    return {"message": "Place created successfully", "place": new_place}


@router.get("/{place_name}")
async def get_place(place_name: str, db: Session = Depends(get_db)):
    """
    Get information about a place (like a dining hall).

    This endpoint retrieves information about a specific food place, including its menu.

    - **place_name**: The name of the place to retrieve.
    """

    place = get_place_by_name_or_id(db, place_name)

    if not place:
        raise HTTPException(status_code=404, detail="Place not found")

    return {"place_id": place.id, "place_info": place}


@router.post("/{place_name}/review")
async def review_place(place_name: str, form: ReviewForm = Depends(), db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Submit a review for a place (like a dining hall).

    - **place_name**: The name of the place to review.
    - **form**: The review form data.
    """


    place = get_place_by_name_or_id(db, place_name)

    if not place:
        raise HTTPException(status_code=404, detail="Place not found")

    user = db.query(User).get(current_user["user_id"])  # Check if user exists
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        review = Review(
            food_place=place,
            user=user,
            star_rating=form.rating,
            content=form.description,
        )
        db.add(review)
        db.commit()
        db.refresh(review)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error submitting review") from e

    return {"message": "Review submitted successfully", "review": review}


@router.get("/{place_name}/reviews")
async def get_place_reviews(place_name: str, start: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Get reviews for a food place.

    This endpoint retrieves all reviews for a specific food place.

    - **place_name**: The name of the place to retrieve reviews for.
    """

    if limit > 100:
        limit = 100  # Cap the limit to prevent abuse
    if limit < 1:
        limit = 10  # Default to 10 if an invalid limit is provided
    if start < 0:
        start = 0  # Default to 0 if an invalid start is provided


    try:
        place = get_place_by_name_or_id(db, place_name)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid place name")

    if not place:
        raise HTTPException(status_code=404, detail="Place not found")

    reviews = db.query(Review).filter(Review.food_place_id == place.id).offset(start).limit(limit).all()
    return {"place_name": place_name, "reviews": reviews, "count": len(reviews)}
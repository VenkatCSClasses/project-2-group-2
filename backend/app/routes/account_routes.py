from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import cache, get_db
from app.models import User, Review
from app.schemas import UserRole
from app.utils import get_current_user, get_current_admin, get_current_moderator
from app.serde import serialize_reviews
from app.routes.helpers import parse_uuid

# This will be mounted at "/accounts" in main.py, so all routes here will be prefixed with /accounts
router = APIRouter()

@router.get("/")
async def get_accounts(start: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """
    Get a list of user accounts.

    This endpoint retrieves a list of user accounts with pagination. 

    - **start**: The starting index for pagination (default is 0).
    - **limit**: The maximum number of accounts to return (default is 10).
    """
    users = db.exec(select(User).offset(start).limit(limit)).all()
    return {
        "message": "Accounts retrieved successfully",
        "start": start,
        "limit": limit,
        "accounts": [
            {"username": user.username, 
            "email": user.email, 
            "role": user.role.value, 
            "profile_picture": user.profile_image_url
            }
            for user in users
        ],
    }

@router.get("/me")
async def get_current_account(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get the current user's account information.

    This endpoint retrieves information about the currently authenticated user's account.
    """
    user = db.exec(select(User).where(User.id == current_user["user_id"])).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    return {
        "message": "Current account retrieved successfully",
        "username": user.username,
        "account_info": {
            "email": user.email,
            "role": user.role.value,
            "profile_picture": user.profile_image_url
        }
    }

@router.get("/me/posts")
async def get_current_user_posts(start: int = 0, limit: int = 10, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get the current user's posts.
    """
    user_id = parse_uuid(current_user["user_id"])
    user = db.exec(select(User).where(User.id == user_id)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    posts = db.exec(select(Review).where(Review.author_id == user.id).order_by(Review.created_at.desc()).offset(start).limit(limit)).all()
    results = serialize_reviews(db, posts, viewer_user_id=user_id)
    return {"start": start, "limit": limit, "posts": results}


@router.get("/search")
async def search_accounts(query: str, db: Session = Depends(get_db)):
    """
    Search for user accounts.

    This endpoint allows users to search for accounts based on a query string.

    - **query**: The search query for finding user accounts.
    """
    users = db.exec(select(User).where(User.username.contains(query))).all()
    return {
        "message": "Search completed successfully",
        "query": query,
        "accounts": [
            {"username": user.username, "email": user.email, "role": user.role.value}
            for user in users
        ],
    }
    

@router.get("/reported")
async def get_reported_accounts(current_user: dict = Depends(get_current_moderator), db: Session = Depends(get_db)):
    """
    Get a list of reported user accounts.

    This endpoint allows moderators to retrieve a list of user accounts that have been reported by users for review.

    """
    reported_usernames = [
        username.decode() if isinstance(username, bytes) else username
        for username in cache.smembers("reported_users")
    ]
    reported_accounts = []

    for username in reported_usernames:
        user = db.exec(select(User).where(User.username == username)).first()
        if user is not None:
            reported_accounts.append(
                {"username": user.username, "email": user.email, "role": user.role.value}
            )

    return {
        "message": "Reported accounts retrieved successfully",
        "reported_accounts": reported_accounts,
    }


@router.get("/{username}")
async def get_account(username: str, db: Session = Depends(get_db)):
    """
    Get account information for a user.

    This endpoint retrieves information about a specific user's account.

    - **username**: The username of the account to retrieve.
    """
    user = db.exec(select(User).where(User.username == username)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    return {
        "message": "Account retrieved successfully",
        "username": username,
        "account_info": {"email": user.email, "role": user.role.value, "profile_picture": user.profile_image_url},
    }


@router.post("/{username}/report")
async def report_account(username: str, current_user: dict = Depends(get_current_user)):
    """
    Report a user account.
    
    This endpoint allows users to report inappropriate behavior from other users.

    - **username**: The username of the account being reported.
    """
    cache.sadd("reported_users", username)
    return {"message": f"Account '{username}' reported successfully"}


@router.post("/{username}/ban")
async def ban_account(username: str, current_moderator: dict = Depends(get_current_moderator), db: Session = Depends(get_db)):
    """
    Ban a user account.

    This endpoint allows moderators to ban user accounts that violate community guidelines.

    - **username**: The username of the account to be banned.
    """
    user = db.exec(select(User).where(User.username == username)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    cache.sadd("banned_users", str(user.id))
    return {"message": f"Account '{username}' banned successfully"}


@router.post("/{username}/set-role")
async def change_account_role(username: str, role: UserRole = UserRole.USER, current_admin: dict = Depends(get_current_admin), db: Session = Depends(get_db)):
    """
    Change the role of a user account.

    This endpoint allows the owner to change the role of a user account.

    - **username**: The username of the account to have their role changed.
    - **role**: The new role to assign to the user account.
    """
    user = db.exec(select(User).where(User.username == username)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    user.role = role
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "message": f"Role updated successfully for '{username}'",
        "username": username,
        "role": user.role.value,
    }

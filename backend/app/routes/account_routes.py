from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.database import get_db
from app.models import User
from app.schemas import UserRole
from app.utils import get_current_user, get_current_admin, get_current_moderator

# This will be mounted at "/account" in main.py, so all routes here will be prefixed with /account
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
            {"username": user.username, "email": user.email, "role": user.role.value}
            for user in users
        ],
    }


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
async def get_reported_accounts(current_user: dict = Depends(get_current_user)):
    """
    Get a list of reported user accounts.

    This endpoint allows moderators to retrieve a list of user accounts that have been reported by users for review.

    """
    return {"message": "Under construction", "reported_accounts": []}


@router.get("/{username}")
async def get_account(username: str):
    """
    Get account information for a user.

    This endpoint retrieves information about a specific user's account.

    - **username**: The username of the account to retrieve.
    """
    return {"message": "Under construction", "username": username, "account_info": {}}


@router.post("/{username}/report")
async def report_account(username: str, current_user: dict = Depends(get_current_user)):
    """
    Report a user account.
    
    This endpoint allows users to report inappropriate behavior from other users.

    - **username**: The username of the account being reported.
    """
    return {"message": "Under construction"}


@router.post("/{username}/ban")
async def ban_account(username: str, current_moderator: dict = Depends(get_current_moderator)):
    """
    Ban a user account.

    This endpoint allows moderators to ban user accounts that violate community guidelines.

    - **username**: The username of the account to be banned.
    """
    return {"message": "Under construction"}


@router.post("/{username}/set-role")
async def change_account_role(username: str, role: UserRole = UserRole.USER, current_admin: dict = Depends(get_current_admin)):
    """
    Change the role of a user account.

    This endpoint allows the owner to change the role of a user account.

    - **username**: The username of the account to have their role changed.
    - **role**: The new role to assign to the user account.
    """
    return {"message": "Under construction"}

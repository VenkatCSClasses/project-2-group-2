from fastapi import APIRouter
from app.schemas import UserRole

# This will be mounted at "/account" in main.py, so all routes here will be prefixed with /account
router = APIRouter()

@router.get("/{username}")
async def get_account(username: str):
    """
    Get account information for a user.

    This endpoint retrieves information about a specific user's account.

    - **username**: The username of the account to retrieve.
    """
    return {"message": "Under construction", "username": username, "account_info": {}}


@router.post("/{username}/report")
async def report_account(username: str):
    """
    Report a user account.
    
    This endpoint allows users to report inappropriate behavior from other users.

    - **username**: The username of the account being reported.
    """
    return {"message": "Under construction"}


@router.post("/{username}/ban")
async def ban_account(username: str):
    """
    Ban a user account.

    This endpoint allows moderators to ban user accounts that violate community guidelines.

    - **username**: The username of the account to be banned.
    """
    return {"message": "Under construction"}


@router.get("/reported")
async def get_reported_accounts():
    """
    Get a list of reported user accounts.

    This endpoint allows moderators to retrieve a list of user accounts that have been reported by users for review.

    """
    return {"message": "Under construction", "reported_accounts": []}


@router.get("/search")
async def search_accounts(query: str):
    """
    Search for user accounts.

    This endpoint allows users to search for accounts based on a query string.

    - **query**: The search query for finding user accounts.
    """
    return {"message": "Under construction", "query": query, "accounts": []}


@router.post("/{username}/set-role")
async def change_account_role(username: str, role: UserRole = UserRole.USER):
    """
    Change the role of a user account.

    This endpoint allows the owner to change the role of a user account.

    - **username**: The username of the account to have their role changed.
    - **role**: The new role to assign to the user account.
    """
    return {"message": "Under construction"}
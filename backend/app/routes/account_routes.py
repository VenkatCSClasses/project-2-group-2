from fastapi import APIRouter

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
from typing import Annotated
from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from food_review_form import FoodReviewForm

app = FastAPI()

@app.get("/")
async def index():
    """
    Redirect to API documentation.
    """
    return RedirectResponse(url="/docs")


@app.post("/login")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    """
    Log in a user.

    This endpoint allows a user to log in by providing their username and password.

    - **form_data**: The login form data containing the username and password.
    """
    return {"message": "Under construction", "access_token": "<token will go here>", "token_type": "bearer"}


@app.post("/register")
async def register(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    """
    Register a new user.

    This endpoint allows a new user to register by providing a username and password.

    - **form_data**: The registration form data containing the username and password.
    """
    return {"message": "Under construction", "access_token": "<token will go here>", "token_type": "bearer"}


@app.get("/logout")
async def logout():
    """
    Log out a user.

    This endpoint allows a logged-in user to log out of their session.

    """
    return {"message": "Under construction"}


@app.get("/posts")
async def get_posts(start: int = 0, limit: int = 10):
    """
    Get a list of posts.

    This endpoint retrieves a list of posts with pagination. 

    - **start**: The starting index for pagination (default is 0).
    - **limit**: The maximum number of posts to return (default is 10).
    """
    return {"message": "Under construction", "start": start, "limit": limit, "posts": []}


@app.get("/account/{username}")
async def get_account(username: str):
    """
    Get account information for a user.

    This endpoint retrieves information about a specific user's account.

    - **username**: The username of the account to retrieve.
    """
    return {"message": "Under construction", "username": username, "account_info": {}}


@app.get("/dining-hall/{hall_name}")
async def get_dining_hall(hall_name: str):
    """
    Get information about a dining hall.

    This endpoint retrieves information about a specific dining hall, including its menu.

    - **hall_name**: The name of the dining hall to retrieve.
    """
    return {"message": "Under construction", "hall_name": hall_name, "menu": []}


@app.get("/item/{item_id}")
async def get_item(item_id: str):
    """
    Get information about a food item.

    This endpoint retrieves information about a specific food item.

    - **item_id**: The ID of the item to retrieve.
    """
    return {"message": "Under construction", "item_id": item_id}


@app.get("/search")
async def search(query: str):
    """
    Search for posts.

    This endpoint allows users to search for posts based on a query string.

    - **query**: The search query.
    """
    return {"message": "Under construction", "query": query}


@app.get("/posts/{post_id}")
async def get_post(post_id: str):
    """
    Get information about a post.

    This endpoint retrieves information about a specific post.

    - **post_id**: The ID of the post to retrieve.
    """
    return {"message": "Under construction", "post_id": post_id}


@app.post("/posts/{post_id}/vote")
async def vote_on_post(post_id: str, upvote: bool):
    """
    Allows the user to upvote or downvote a post.

    - **post_id**: The ID of the post to vote on.
    - **upvote**: A boolean indicating whether the vote is an upvote (true) or a downvote (false).
    """
    return {"message": "Under construction"}


@app.post("/items/{item_id}/review")
async def review_item(item_id: str, form: FoodReviewForm = Depends()):
    """
    Submit a review for a food item.

    - **item_id**: The ID of the item to review.
    - **form**: The review form data.

    """
    return {"message": "Under construction"}


@app.post("/dining-hall/{hall_name}/review")
async def review_dining_hall(hall_name: str, form: FoodReviewForm = Depends()):
    """
    Submit a review for a dining hall.

    - **hall_name**: The name of the dining hall to review.
    - **form**: The review form data.

    """
    return {"message": "Under construction"}


@app.post("/posts/{post_id}/comment")
async def comment_on_post(post_id: str, comment: str):
    """
    Add a comment to a post.

    - **post_id**: The ID of the post to comment on.
    - **comment**: The comment text.

    """

    return {"message": "Under construction"}


@app.post("/posts/{post_id}/report")
async def report_post(post_id: str):
    """
    Report a post.
    
    This endpoint allows users to report inappropriate content in a post.

    - **post_id**: The ID of the post to be reported.
    """
    return {"message": "Under construction"}


@app.post("/account/{username}/report")
async def report_account(username: str):
    """
    Report a user account.
    
    This endpoint allows users to report inappropriate behavior from other users.

    - **username**: The username of the account being reported.
    """
    return {"message": "Under construction"}


@app.post("/posts/{post_id}/delete")
async def delete_post(post_id: str):
    """
    Delete a post.
    
    This endpoint allows users to delete their own posts or moderators to delete any post. The actual implementation will check user permissions and remove the post from the database.

    - **post_id**: The ID of the post to be deleted.
    """
    return {"message": "Under construction"}
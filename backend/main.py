from typing import Annotated
from fastapi import FastAPI, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

app = FastAPI()

@app.get("/")
async def index():
    return {"message": "Hello World"}


@app.post("/login")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    return {"access_token": "<token will go here>", "token_type": "bearer"}


@app.get("/logout")
async def logout():
    return {"message": "Logged out"}


@app.get("/posts")
async def get_posts(start: int = 0, limit: int = 10):
    return {"start": start, "limit": limit, "posts": []}


@app.get("/account/{username}")
async def get_account(username: str):
    return {"username": username, "account_info": {}}


@app.get("/dining-hall/{hall_name}")
async def get_dining_hall(hall_name: str):
    return {"hall_name": hall_name, "menu": []}


@app.get("/item/{item_id}")
async def get_item(item_id: str):
    return {"item_id": item_id}


@app.get("/search")
async def search(query: str):
    return {"query": query, "results": []}
    

@app.get("/report-post/{post_id}")
async def report_post(post_id: str):
    return {"post_id": post_id, "message": "Post reported"}


@app.get("/report-account/{username}")
async def report_account(username: str):
    return {"username": username, "message": "Account reported"}
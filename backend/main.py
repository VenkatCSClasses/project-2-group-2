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
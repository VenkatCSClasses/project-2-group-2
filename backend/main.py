from fastapi import FastAPI
from app.routes import router as api_router
from app.database import engine
from sqlmodel import SQLModel
import app.models

app = FastAPI()

@app.on_event("startup")
def on_startup():
    """
    Create database tables on startup.
    """
    SQLModel.metadata.create_all(engine)

## Import the router declared in app/routes/__init__.py
app.include_router(api_router)

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.routes import router as api_router
from app.database import engine
from sqlmodel import SQLModel
import app.models
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    """
    Create database tables on startup.
    """
    SQLModel.metadata.create_all(engine)

## Import the router declared in app/routes/__init__.py
app.include_router(api_router)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

from fastapi import FastAPI
from app.routes import router as api_router

app = FastAPI()

## Import the router declared in app/routes/__init__.py
app.include_router(api_router)

from pathlib import Path
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from sqlmodel import SQLModel, Session
from app.utils import ensure_admin_user_in_db

import app.models
from app.nutrislice.populate_food import populate_day, populate_missing_menu_days
from app.database import engine
from app.routes import router as api_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
scheduler = BackgroundScheduler()
upload_dir = Path(__file__).resolve().parent / "uploads"

upload_dir.mkdir(parents=True, exist_ok=True)


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
    ensure_admin_user_in_db(Session(engine)) # Create an admin account if doesn't exist

    def _run_daily_menu_population() -> None:
        with Session(engine) as db:
            populate_day(db)

    with Session(engine) as db:
        populate_missing_menu_days(db)

    scheduler.add_job(
        _run_daily_menu_population,
        "cron",
        hour=0,
        minute=0,
        id="daily-menu-population",
        replace_existing=True,
    )
    scheduler.start()


@app.on_event("shutdown")
def on_shutdown():
    if scheduler.running:
        scheduler.shutdown(wait=False)

## Import the router declared in app/routes/__init__.py
app.include_router(api_router)
app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

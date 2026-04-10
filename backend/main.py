from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from sqlmodel import SQLModel, Session

import app.models
from app.nutrislice.populate_food import populate_day
from app.database import engine
from app.routes import router as api_router


app = FastAPI()
scheduler = BackgroundScheduler()


@app.on_event("startup")
def on_startup():
    """
    Create database tables on startup.
    """
    SQLModel.metadata.create_all(engine)

    def _run_daily_menu_population() -> None:
        with Session(engine) as db:
            populate_day(db)

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
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
import os

from app.database import get_db
from main import app
from app.utils import ensure_admin_user_in_db
from app.nutrislice.populate_food import populate_missing_menu_days

# Set up test database (in-memory SQLite)
TEST_DATABASE_URL = "sqlite:///./test_db.db"

# We use connect_args to allow multithreading with sqlite
engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}
)

def override_get_db():
    with Session(engine) as session:
        yield session

# Override the database dependency
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    # Create the test database and tables
    SQLModel.metadata.create_all(engine)
    
    # Run startup data initialization manually for the test database
    with Session(engine) as db:
        ensure_admin_user_in_db(db)
        populate_missing_menu_days(db)
        db.commit()

    yield
    # Drop tables after tests finish
    SQLModel.metadata.drop_all(engine)
    if os.path.exists("./test_db.db"):
        os.remove("./test_db.db")

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client

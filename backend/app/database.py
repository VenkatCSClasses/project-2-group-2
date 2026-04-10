import os
import valkey
from sqlmodel import Session, create_engine


# Initialize Valkey cache
cache = valkey.from_url(os.getenv("VALKEY_URL", "valkey://localhost:6379"))


# Initalize PostgreSQL database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:gloorp@127.0.0.1:5432/food_db")
engine = create_engine(DATABASE_URL, echo=False)

# Get the session for database operations
def get_db():
    db = Session(engine)
    try:
        yield db
    finally:
        db.close()

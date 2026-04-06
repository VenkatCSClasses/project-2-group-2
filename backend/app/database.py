import os
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy import create_engine


DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:gloorp@127.0.0.1:5432/food_db")

engine = create_engine(DATABASE_URL, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# All  models will inherit from this class
class Base(DeclarativeBase):
    pass

# Get the session for database operations
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
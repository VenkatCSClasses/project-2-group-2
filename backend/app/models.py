# ruff: noqa (disable linting for this file)
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy import Column, Enum, String
from sqlmodel import Field, Relationship, SQLModel

from app.schemas import UserRole


class User(SQLModel, table=True):
    __tablename__ = "users"  # type: ignore[assignment]

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    username: str = Field(sa_type=String(50), unique=True, index=True)
    email: str = Field(sa_type=String(100), unique=True, index=True)
    password_hash: str = Field(sa_type=String(128))
    role: UserRole = Field(
        default=UserRole.USER,
        sa_column=Column(Enum(UserRole), nullable=False),
    )

    reviews: List["Review"] = Relationship(back_populates="user", cascade_delete=True)
    comments: List["Comment"] = Relationship(back_populates="author", cascade_delete=True)

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}', role='{self.role}')>"


class FoodItem(SQLModel, table=True):
    __tablename__ = "food_items"  # type: ignore[assignment]

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(sa_type=String(100), unique=True, index=True)
    description: Optional[str] = Field(default=None, sa_type=String(256))
    
    reviews: List["Review"] = Relationship(back_populates="food_item", cascade_delete=True)

    def __repr__(self):
        return f"<FoodItem(id={self.id}, name='{self.name}', description='{self.description}')>"


class Review(SQLModel, table=True):
    __tablename__ = "reviews"  # type: ignore[assignment]

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    author_id: UUID = Field(foreign_key="users.id")
    food_item_id: Optional[UUID] = Field(default=None, foreign_key="food_items.id")
    star_rating: int = Field(le=10, ge=0, index=True)  # 0-10 (each int represents a half star, so 10 = 5 stars, 9 = 4.5 stars, etc)
    content: Optional[str] = Field(default=None)
    image_url: Optional[str] = Field(default=None)
    
    user: Optional["User"] = Relationship(back_populates="reviews")
    food_item: Optional["FoodItem"] = Relationship(back_populates="reviews")
    comments: List["Comment"] = Relationship(back_populates="review", cascade_delete=True)

    def __repr__(self):
        return f"<Review(id={self.id}, author_id={self.author_id}, food_item_id={self.food_item_id}, star_rating={self.star_rating})>"


class Comment(SQLModel, table=True):
    __tablename__ = "comments"  # type: ignore[assignment]

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    text: str
    
    author_id: UUID = Field(foreign_key="users.id")
    review_id: UUID = Field(foreign_key="reviews.id")
    
    parent_id: Optional[UUID] = Field(default=None, foreign_key="comments.id") # Parent comment for reply functionality
    
    author: Optional["User"] = Relationship(back_populates="comments")
    review: Optional["Review"] = Relationship(back_populates="comments")
    
    parent: Optional["Comment"] = Relationship(
        back_populates="replies", 
        sa_relationship_kwargs=dict(remote_side="Comment.id")
    )
    replies: List["Comment"] = Relationship(back_populates="parent")

    def __repr__(self):
        return f"<Comment(id={self.id}, author_id={self.author_id}, review_id={self.review_id}, text='{self.text}')>"

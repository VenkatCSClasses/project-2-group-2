# ruff: noqa (disable linting for this file)
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy import Boolean, CheckConstraint, Column, DateTime, Enum, String, UniqueConstraint
from sqlmodel import Field, Relationship, SQLModel

from app.schemas import UserRole


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(SQLModel, table=True):
    __tablename__ = "users"  # type: ignore[assignment]

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    username: str = Field(sa_type=String(50), unique=True, index=True)
    email: str = Field(sa_type=String(100), unique=True, index=True)
    password_hash: str = Field(sa_type=String(128))
    profile_image_url: Optional[str] = Field(default=None)

    role: UserRole = Field(
        default=UserRole.USER,
        sa_column=Column(Enum(UserRole), nullable=False, index=True),
    )

    reviews: List["Review"] = Relationship(back_populates="user", cascade_delete=True)
    comments: List["Comment"] = Relationship(back_populates="author", cascade_delete=True)
    votes: List["Vote"] = Relationship(back_populates="user", cascade_delete=True)
    reports: List["Report"] = Relationship(back_populates="reporter", cascade_delete=True)

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}', role='{self.role}')>"


class FoodItem(SQLModel, table=True):
    __tablename__ = "food_items"  # type: ignore[assignment]

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(sa_type=String(100), unique=True, index=True)
    description: Optional[str] = Field(default=None, sa_type=String(256))
    image_url: Optional[str] = Field(default=None)
    
    reviews: List["Review"] = Relationship(back_populates="food_item", cascade_delete=True)
    food_place_id: Optional[UUID] = Field(default=None, foreign_key="food_places.id")
    food_place: Optional["FoodPlace"] = Relationship(back_populates="food_items")

    def __repr__(self):
        return f"<FoodItem(id={self.id}, name='{self.name}', description='{self.description}')>"


class Review(SQLModel, table=True):
    __tablename__ = "reviews"  # type: ignore[assignment]

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    author_id: UUID = Field(foreign_key="users.id")
    food_item_id: Optional[UUID] = Field(default=None, foreign_key="food_items.id")
    food_place_id: Optional[UUID] = Field(default=None, foreign_key="food_places.id")
    
    star_rating: int = Field(le=10, ge=1, index=True)  # 1-10 (each int represents a half star, so 10 = 5 stars, 9 = 4.5 stars, etc)
    content: Optional[str] = Field(default=None)
    image_url: Optional[str] = Field(default=None)
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True),
    )
    
    user: Optional["User"] = Relationship(back_populates="reviews")
    food_item: Optional["FoodItem"] = Relationship(back_populates="reviews")
    food_place: Optional["FoodPlace"] = Relationship(back_populates="reviews")
    comments: List["Comment"] = Relationship(back_populates="review", cascade_delete=True)
    votes: List["Vote"] = Relationship(back_populates="review", cascade_delete=True)
    reports: List["Report"] = Relationship(back_populates="review", cascade_delete=True)

    def __repr__(self):
        return f"<Review(id={self.id}, author_id={self.author_id}, food_item_id={self.food_item_id}, star_rating={self.star_rating})>"


class Comment(SQLModel, table=True):
    __tablename__ = "comments"  # type: ignore[assignment]

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    text: str
    
    author_id: UUID = Field(foreign_key="users.id")
    review_id: UUID = Field(foreign_key="reviews.id")
    
    parent_id: Optional[UUID] = Field(default=None, foreign_key="comments.id") # Parent comment for reply functionality
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True),
    )
    
    author: Optional["User"] = Relationship(back_populates="comments")
    review: Optional["Review"] = Relationship(back_populates="comments")
    votes: List["Vote"] = Relationship(back_populates="comment", cascade_delete=True)
    reports: List["Report"] = Relationship(back_populates="comment", cascade_delete=True)
    
    parent: Optional["Comment"] = Relationship(
        back_populates="replies", 
        sa_relationship_kwargs=dict(remote_side="Comment.id")
    )
    replies: List["Comment"] = Relationship(back_populates="parent", cascade_delete=True)

    def __repr__(self):
        return f"<Comment(id={self.id}, author_id={self.author_id}, review_id={self.review_id}, text='{self.text}')>"


class FoodPlace(SQLModel, table=True):
    __tablename__ = "food_places"  # type: ignore[assignment]

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(sa_type=String(100), unique=True, index=True)
    description: Optional[str] = Field(default=None)
    image_url: Optional[str] = Field(default=None)

    food_items: List[FoodItem] = Relationship(back_populates="food_place", cascade_delete=True)
    reviews: List[Review] = Relationship(back_populates="food_place", cascade_delete=True)


    def __repr__(self):
        return f"<FoodPlace(id={self.id}, name='{self.name}', description='{self.description}')>"


class Vote(SQLModel, table=True):
    __tablename__ = "votes"  # type: ignore[assignment]
    __table_args__ = (
        UniqueConstraint("user_id", "review_id", name="uq_votes_user_review"),
        UniqueConstraint("user_id", "comment_id", name="uq_votes_user_comment"),
        CheckConstraint(
            "((review_id IS NOT NULL AND comment_id IS NULL) OR (review_id IS NULL AND comment_id IS NOT NULL))",
            name="ck_votes_single_target",
        ),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id")
    review_id: Optional[UUID] = Field(default=None, foreign_key="reviews.id")
    comment_id: Optional[UUID] = Field(default=None, foreign_key="comments.id")
    is_upvote: bool = Field(sa_column=Column(Boolean, nullable=False))
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True),
    )

    user: Optional["User"] = Relationship(back_populates="votes")
    review: Optional["Review"] = Relationship(back_populates="votes")
    comment: Optional["Comment"] = Relationship(back_populates="votes")

    def __repr__(self):
        return f"<Vote(id={self.id}, user_id={self.user_id}, review_id={self.review_id}, comment_id={self.comment_id}, is_upvote={self.is_upvote})>"


class Report(SQLModel, table=True):
    __tablename__ = "reports"  # type: ignore[assignment]
    __table_args__ = (
        UniqueConstraint("reporter_id", "review_id", name="uq_reports_user_review"),
        UniqueConstraint("reporter_id", "comment_id", name="uq_reports_user_comment"),
        CheckConstraint(
            "((review_id IS NOT NULL AND comment_id IS NULL) OR (review_id IS NULL AND comment_id IS NOT NULL))",
            name="ck_reports_single_target",
        ),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    reporter_id: UUID = Field(foreign_key="users.id")
    review_id: Optional[UUID] = Field(default=None, foreign_key="reviews.id")
    comment_id: Optional[UUID] = Field(default=None, foreign_key="comments.id")
    reason: Optional[str] = Field(default=None, sa_type=String(256))
    created_at: datetime = Field(
        default_factory=utc_now,
        sa_column=Column(DateTime(timezone=True), nullable=False, index=True),
    )

    reporter: Optional["User"] = Relationship(back_populates="reports")
    review: Optional["Review"] = Relationship(back_populates="reports")
    comment: Optional["Comment"] = Relationship(back_populates="reports")

    def __repr__(self):
        return f"<Report(id={self.id}, reporter_id={self.reporter_id}, review_id={self.review_id}, comment_id={self.comment_id})>"

from sqlmodel import Session

from app.models import Comment, FoodItem, Report, Review, User, Vote


def votes(db: Session, review: Review) -> tuple[int, int]:
    upvotes = db.query(Vote).filter(
        Vote.review_id == review.id,
        Vote.is_upvote.is_(True),
    ).count()
    downvotes = db.query(Vote).filter(
        Vote.review_id == review.id,
        Vote.is_upvote.is_(False),
    ).count()
    return upvotes, downvotes


def comment_votes(db: Session, comment: Comment) -> tuple[int, int]:
    upvotes = db.query(Vote).filter(
        Vote.comment_id == comment.id,
        Vote.is_upvote.is_(True),
    ).count()
    downvotes = db.query(Vote).filter(
        Vote.comment_id == comment.id,
        Vote.is_upvote.is_(False),
    ).count()
    return upvotes, downvotes


def serialize_review(db: Session, review: Review) -> dict:
    author = db.get(User, review.author_id)
    food_item = db.get(FoodItem, review.food_item_id) if review.food_item_id else None
    upvotes, downvotes = votes(db, review)
    report_count = db.query(Report).filter(Report.review_id == review.id).count()

    return {
        "id": review.id,
        "author_id": review.author_id,
        "author_username": author.username if author else None,
        "food_item_id": review.food_item_id,
        "food_item_name": food_item.name if food_item else None,
        "star_rating": review.star_rating,
        "content": review.content,
        "image_url": review.image_url,
        "created_at": review.created_at,
        "upvotes": upvotes,
        "downvotes": downvotes,
        "report_count": report_count,
    }


def serialize_comment(db: Session, comment: Comment) -> dict:
    author = db.get(User, comment.author_id)
    upvotes, downvotes = comment_votes(db, comment)
    report_count = db.query(Report).filter(Report.comment_id == comment.id).count()

    return {
        "id": comment.id,
        "text": comment.text,
        "author_id": comment.author_id,
        "author_username": author.username if author else None,
        "review_id": comment.review_id,
        "parent_id": comment.parent_id,
        "created_at": comment.created_at,
        "upvotes": upvotes,
        "downvotes": downvotes,
        "report_count": report_count,
    }

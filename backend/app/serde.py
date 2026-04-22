from collections.abc import Sequence
from typing import Literal
from uuid import UUID

from sqlalchemy import func
from sqlmodel import Session

from app.models import Comment, FoodItem, Report, Review, User, Vote

VoteSelection = Literal["up", "down"] | None


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


def _review_vote_counts(
    db: Session, review_ids: Sequence[UUID]
) -> dict[UUID, tuple[int, int]]:
    if not review_ids:
        return {}

    upvote_rows = (
        db.query(Vote.review_id, func.count(Vote.id))
        .filter(Vote.review_id.in_(review_ids), Vote.is_upvote.is_(True))
        .group_by(Vote.review_id)
        .all()
    )
    downvote_rows = (
        db.query(Vote.review_id, func.count(Vote.id))
        .filter(Vote.review_id.in_(review_ids), Vote.is_upvote.is_(False))
        .group_by(Vote.review_id)
        .all()
    )

    counts = {review_id: (0, 0) for review_id in review_ids}
    for review_id, count in upvote_rows:
        _, downvotes = counts.get(review_id, (0, 0))
        counts[review_id] = (count, downvotes)
    for review_id, count in downvote_rows:
        upvotes, _ = counts.get(review_id, (0, 0))
        counts[review_id] = (upvotes, count)

    return counts


def _comment_vote_counts(
    db: Session, comment_ids: Sequence[UUID]
) -> dict[UUID, tuple[int, int]]:
    if not comment_ids:
        return {}

    upvote_rows = (
        db.query(Vote.comment_id, func.count(Vote.id))
        .filter(Vote.comment_id.in_(comment_ids), Vote.is_upvote.is_(True))
        .group_by(Vote.comment_id)
        .all()
    )
    downvote_rows = (
        db.query(Vote.comment_id, func.count(Vote.id))
        .filter(Vote.comment_id.in_(comment_ids), Vote.is_upvote.is_(False))
        .group_by(Vote.comment_id)
        .all()
    )

    counts = {comment_id: (0, 0) for comment_id in comment_ids}
    for comment_id, count in upvote_rows:
        _, downvotes = counts.get(comment_id, (0, 0))
        counts[comment_id] = (count, downvotes)
    for comment_id, count in downvote_rows:
        upvotes, _ = counts.get(comment_id, (0, 0))
        counts[comment_id] = (upvotes, count)

    return counts


def _review_comment_counts(
    db: Session, review_ids: Sequence[UUID]
) -> dict[UUID, int]:
    if not review_ids:
        return {}

    rows = (
        db.query(Comment.review_id, func.count(Comment.id))
        .filter(Comment.review_id.in_(review_ids))
        .group_by(Comment.review_id)
        .all()
    )
    return {review_id: count for review_id, count in rows}


def _review_viewer_votes(
    db: Session, review_ids: Sequence[UUID], viewer_user_id: UUID | None
) -> dict[UUID, VoteSelection]:
    if not review_ids or not viewer_user_id:
        return {}

    rows = (
        db.query(Vote.review_id, Vote.is_upvote)
        .filter(Vote.user_id == viewer_user_id, Vote.review_id.in_(review_ids))
        .all()
    )
    return {
        review_id: "up" if is_upvote else "down"
        for review_id, is_upvote in rows
    }


def _comment_viewer_votes(
    db: Session, comment_ids: Sequence[UUID], viewer_user_id: UUID | None
) -> dict[UUID, VoteSelection]:
    if not comment_ids or not viewer_user_id:
        return {}

    rows = (
        db.query(Vote.comment_id, Vote.is_upvote)
        .filter(Vote.user_id == viewer_user_id, Vote.comment_id.in_(comment_ids))
        .all()
    )
    return {
        comment_id: "up" if is_upvote else "down"
        for comment_id, is_upvote in rows
    }


def _report_counts(
    db: Session, model_field, ids: Sequence[UUID]
) -> dict[UUID, int]:
    if not ids:
        return {}

    rows = (
        db.query(model_field, func.count(Report.id))
        .filter(model_field.in_(ids))
        .group_by(model_field)
        .all()
    )
    return {entity_id: count for entity_id, count in rows}


def _user_map(db: Session, user_ids: Sequence[UUID]) -> dict[UUID, User]:
    if not user_ids:
        return {}

    users = db.query(User).filter(User.id.in_(user_ids)).all()
    return {user.id: user for user in users}


def _food_item_map(
    db: Session, food_item_ids: Sequence[UUID]
) -> dict[UUID, FoodItem]:
    if not food_item_ids:
        return {}

    food_items = db.query(FoodItem).filter(FoodItem.id.in_(food_item_ids)).all()
    return {food_item.id: food_item for food_item in food_items}


def serialize_review(
    db: Session,
    review: Review,
    reports: bool = False,
    *,
    author: User | None = None,
    food_item: FoodItem | None = None,
    vote_totals: tuple[int, int] | None = None,
    viewer_vote: VoteSelection = None,
    report_count: int | None = None,
    comment_count: int | None = None,
) -> dict:
    author = author or db.get(User, review.author_id)
    if review.food_item_id and food_item is None:
        food_item = db.get(FoodItem, review.food_item_id)
    upvotes, downvotes = vote_totals or votes(db, review)

    data = {
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
        "viewer_vote": viewer_vote,
        "comment_count": (
            comment_count
            if comment_count is not None
            else db.query(Comment).filter(Comment.review_id == review.id).count()
        ),
    }
    if reports:
        data["report_count"] = (
            report_count
            if report_count is not None
            else db.query(Report).filter(Report.review_id == review.id).count()
        )

    return data


def serialize_comment(
    db: Session,
    comment: Comment,
    reports: bool = False,
    *,
    author: User | None = None,
    vote_totals: tuple[int, int] | None = None,
    viewer_vote: VoteSelection = None,
    report_count: int | None = None,
) -> dict:
    author = author or db.get(User, comment.author_id)
    upvotes, downvotes = vote_totals or comment_votes(db, comment)

    data = {
        "id": comment.id,
        "text": comment.text,
        "author_id": comment.author_id,
        "author_username": author.username if author else None,
        "review_id": comment.review_id,
        "parent_id": comment.parent_id,
        "created_at": comment.created_at,
        "upvotes": upvotes,
        "downvotes": downvotes,
        "viewer_vote": viewer_vote,
    }
    if reports:
        data["report_count"] = (
            report_count
            if report_count is not None
            else db.query(Report).filter(Report.comment_id == comment.id).count()
        )

    return data


def serialize_reviews(
    db: Session,
    reviews: Sequence[Review],
    *,
    reports: bool = False,
    viewer_user_id: UUID | None = None,
) -> list[dict]:
    if not reviews:
        return []

    review_ids = [review.id for review in reviews]
    authors = _user_map(db, [review.author_id for review in reviews])
    food_items = _food_item_map(
        db, [review.food_item_id for review in reviews if review.food_item_id]
    )
    vote_counts = _review_vote_counts(db, review_ids)
    viewer_votes = _review_viewer_votes(db, review_ids, viewer_user_id)
    comment_counts = _review_comment_counts(db, review_ids)
    report_counts = (
        _report_counts(db, Report.review_id, review_ids) if reports else {}
    )

    return [
        serialize_review(
            db,
            review,
            reports=reports,
            author=authors.get(review.author_id),
            food_item=food_items.get(review.food_item_id),
            vote_totals=vote_counts.get(review.id, (0, 0)),
            viewer_vote=viewer_votes.get(review.id),
            report_count=report_counts.get(review.id),
            comment_count=comment_counts.get(review.id, 0),
        )
        for review in reviews
    ]


def serialize_comments(
    db: Session,
    comments: Sequence[Comment],
    *,
    reports: bool = False,
    viewer_user_id: UUID | None = None,
) -> list[dict]:
    if not comments:
        return []

    comment_ids = [comment.id for comment in comments]
    authors = _user_map(db, [comment.author_id for comment in comments])
    vote_counts = _comment_vote_counts(db, comment_ids)
    viewer_votes = _comment_viewer_votes(db, comment_ids, viewer_user_id)
    report_counts = (
        _report_counts(db, Report.comment_id, comment_ids) if reports else {}
    )

    return [
        serialize_comment(
            db,
            comment,
            reports=reports,
            author=authors.get(comment.author_id),
            vote_totals=vote_counts.get(comment.id, (0, 0)),
            viewer_vote=viewer_votes.get(comment.id),
            report_count=report_counts.get(comment.id),
        )
        for comment in comments
    ]

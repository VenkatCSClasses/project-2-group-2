from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlmodel import Session

from app.database import get_db
from app.models import Comment, FoodItem, Report, Review, User
from app.routes.helpers import get_or_404, parse_uuid, strip
from app.schemas import ReviewForm
from app.serde import serialize_comment, serialize_comments, serialize_review, serialize_reviews
from app.utils import get_current_moderator, get_current_user, get_optional_current_user


# This will be mounted at "/posts" in main.py, so all routes here will be prefixed with /posts
router = APIRouter()

@router.get("/")
async def get_posts(
    start: int = 0,
    limit: int = 10,
    current_user: dict | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a list of posts.

    This endpoint retrieves a list of posts with pagination.

    - **start**: The starting index for pagination (default is 0).
    - **limit**: The maximum number of posts to return (default is 10).
    """
    posts = db.query(Review).order_by(Review.created_at.desc()).offset(start).limit(limit).all()
    viewer_user_id = parse_uuid(current_user["user_id"]) if current_user else None
    results = serialize_reviews(db, posts, viewer_user_id=viewer_user_id)
    return {"start": start, "limit": limit, "posts": results}


@router.post("/create")
async def create_post(form: ReviewForm = Depends(), item_id: str = "", current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Create a post.

    This endpoint creates a new review-style post for a food item.

    - **item_id**: The ID of the food item being reviewed.
    - **form**: The review form data.
    """
    item_uuid = parse_uuid(item_id)
    item = get_or_404(db, FoodItem, item_uuid)
    user = get_or_404(db, User, current_user["user_id"])

    new_post = Review(
        author_id=user.id,
        food_item_id=item.id,
        star_rating=form.rating,
        content=strip(form.description),
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    from app.models import Vote
    auto_vote = Vote(
        user_id=user.id,
        review_id=new_post.id,
        is_upvote=True
    )
    db.add(auto_vote)
    db.commit()

    return {
        "message": "Post created successfully",
        "post": serialize_review(
            db,
            new_post,
            author=user,
            food_item=item,
            comment_count=0,
        ),
    }


@router.get("/reported")
async def get_reported_posts(current_moderator: dict = Depends(get_current_moderator), db: Session = Depends(get_db)):
    """
    Get a list of reported posts and comments.

    This endpoint allows moderators to retrieve reported reviews and comments for review.
    """
    review_reports = db.query(Report).filter(Report.review_id.is_not(None)).order_by(Report.created_at.desc()).all()
    comment_reports = db.query(Report).filter(Report.comment_id.is_not(None)).order_by(Report.created_at.desc()).all()

    seen_reviews = set()
    reported_posts = []
    for report in review_reports:
        if report.review_id in seen_reviews:
            continue
        seen_reviews.add(report.review_id)
        review = db.get(Review, report.review_id)
        if review:
            reported_post = serialize_review(db, review, reports=True)
            reported_post["latest_reported_at"] = report.created_at
            reported_posts.append(reported_post)

    seen_comments = set()
    reported_comments = []
    for report in comment_reports:
        if report.comment_id in seen_comments:
            continue
        seen_comments.add(report.comment_id)
        comment = db.get(Comment, report.comment_id)
        if comment:
            reported_comment = serialize_comment(db, comment, reports=True)
            reported_comment["latest_reported_at"] = report.created_at
            reported_comments.append(reported_comment)

    return {
        "reported_posts": reported_posts,
        "reported_comments": reported_comments,
        "count": len(reported_posts) + len(reported_comments),
    }


@router.get("/search")
async def search_posts(
    query: str,
    category: str = None,
    current_user: dict | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Search for posts.

    This endpoint allows users to search for posts based on a query string and optional category filter.

    - **query**: The search query for finding posts.
    - **category**: The category to filter by (optional).
    """
    trimmed_query = query.strip()
    if not trimmed_query:
        return {"query": query, "category": category, "results": [], "count": 0}

    category = strip(category)
    search_filter = (
        FoodItem.name.ilike(f"%{trimmed_query}%")
        if category == "item"
        else or_(
            Review.content.ilike(f"%{trimmed_query}%"),
            FoodItem.name.ilike(f"%{trimmed_query}%"),
        )
    )

    matches = db.query(Review).join(FoodItem, Review.food_item_id == FoodItem.id, isouter=True).filter(
        search_filter
    ).order_by(Review.created_at.desc()).all()

    viewer_user_id = parse_uuid(current_user["user_id"]) if current_user else None
    results = serialize_reviews(db, matches, viewer_user_id=viewer_user_id)
    if category == "item":
        results.sort(key=lambda post: (post["food_item_name"] or "").lower().find(trimmed_query.lower()) != -1, reverse=True)

    return {"query": query, "category": category, "results": results, "count": len(results)}


@router.get("/{post_id}")
async def get_post(
    post_id: str,
    current_user: dict | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Get information about a post.

    This endpoint retrieves information about a specific post.

    - **post_id**: The ID of the post to retrieve.
    """
    post_id = parse_uuid(post_id)
    post = get_or_404(db, Review, post_id)

    comments = db.query(Comment).filter(Comment.review_id == post.id).order_by(Comment.created_at.asc()).all()
    viewer_user_id = parse_uuid(current_user["user_id"]) if current_user else None
    return {
        "post_id": post.id,
        "post_info": serialize_reviews(db, [post], viewer_user_id=viewer_user_id)[0],
        "comments": serialize_comments(db, comments, viewer_user_id=viewer_user_id),
        "count": len(comments),
    }


@router.post("/{post_id}/report")
async def report_post(post_id: str, reason: str = None, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Report a post.

    This endpoint allows users to report inappropriate content in a post.

    - **post_id**: The ID of the post to be reported.
    """
    post_id = parse_uuid(post_id)
    post = get_or_404(db, Review, post_id)
    user = get_or_404(db, User, current_user["user_id"])

    report = db.query(Report).filter(
        Report.review_id == post.id,
        Report.reporter_id == user.id,
    ).first()
    if not report:
        report = Report(
            review_id=post.id,
            reporter_id=user.id,
            reason=strip(reason),
        )
        db.add(report)
        db.commit()

    report_count = db.query(Report).filter(Report.review_id == post.id).count()
    return {"message": "Post reported successfully", "post_id": post.id, "report_count": report_count}


@router.post("/{post_id}/delete")
async def delete_post(post_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Delete a post.

    This endpoint allows users to delete their own posts or moderators to delete any post.

    - **post_id**: The ID of the post to be deleted.
    """
    post_id = parse_uuid(post_id)
    post = get_or_404(db, Review, post_id)

    if str(post.author_id) != current_user["user_id"] and current_user["role"] not in {"moderator", "admin"}:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this post")

    db.delete(post)
    db.commit()
    return {"message": "Post deleted successfully", "post_id": post.id}

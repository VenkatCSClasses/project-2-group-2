from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_db
from app.models import Comment, Review, User, Vote
from app.routes.helpers import get_or_404, parse_uuid
from app.utils import get_current_user


router = APIRouter()

@router.post("/{post_id}/vote")
async def vote_on_post(post_id: str, upvote: bool, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Allows the user to upvote or downvote a post.

    - **post_id**: The ID of the post to vote on.
    - **upvote**: A boolean indicating whether the vote is an upvote (true) or a downvote (false).
    """
    post_id = parse_uuid(post_id)
    post = get_or_404(db, Review, post_id)
    user = get_or_404(db, User, current_user["user_id"])

    vote = db.query(Vote).filter(
        Vote.review_id == post.id,
        Vote.user_id == user.id,
    ).first()

    if not vote:
        vote = Vote(review_id=post.id, user_id=user.id, is_upvote=upvote)
        db.add(vote)
    else:
        vote.is_upvote = upvote

    db.commit()

    upvotes = db.query(Vote).filter(
        Vote.review_id == post.id,
        Vote.is_upvote.is_(True),
    ).count()
    downvotes = db.query(Vote).filter(
        Vote.review_id == post.id,
        Vote.is_upvote.is_(False),
    ).count()

    return {"message": "Vote recorded successfully", "post_id": post.id, "upvotes": upvotes, "downvotes": downvotes}


@router.post("/comments/{comment_id}/vote")
async def vote_on_comment(comment_id: str, upvote: bool, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Allows the user to upvote or downvote a comment.

    - **comment_id**: The ID of the comment to vote on.
    - **upvote**: A boolean indicating whether the vote is an upvote (true) or a downvote (false).
    """
    comment_id = parse_uuid(comment_id)
    comment = get_or_404(db, Comment, comment_id)
    user = get_or_404(db, User, current_user["user_id"])

    vote = db.query(Vote).filter(
        Vote.comment_id == comment.id,
        Vote.user_id == user.id,
    ).first()

    if not vote:
        vote = Vote(comment_id=comment.id, user_id=user.id, is_upvote=upvote)
        db.add(vote)
    else:
        vote.is_upvote = upvote

    db.commit()

    upvotes = db.query(Vote).filter(
        Vote.comment_id == comment.id,
        Vote.is_upvote.is_(True),
    ).count()
    downvotes = db.query(Vote).filter(
        Vote.comment_id == comment.id,
        Vote.is_upvote.is_(False),
    ).count()

    return {"message": "Vote recorded successfully", "comment_id": comment.id, "upvotes": upvotes, "downvotes": downvotes}

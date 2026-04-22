from typing import Literal

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_db
from app.models import Comment, Review, User, Vote
from app.routes.helpers import get_or_404, parse_uuid
from app.schemas import VoteRequest
from app.serde import VoteSelection, comment_votes, votes
from app.utils import get_current_user


router = APIRouter()

VoteTarget = Literal["review", "comment"]


def get_existing_vote(db: Session, *, user_id, target_id, target_type: VoteTarget):
    query = db.query(Vote).filter(Vote.user_id == user_id)

    if target_type == "review":
        query = query.filter(Vote.review_id == target_id)
    else:
        query = query.filter(Vote.comment_id == target_id)

    return query.first()


def apply_vote_selection(
    db: Session,
    *,
    user_id,
    target_id,
    target_type: VoteTarget,
    vote_selection: VoteSelection,
) -> VoteSelection:
    vote = get_existing_vote(
        db,
        user_id=user_id,
        target_id=target_id,
        target_type=target_type,
    )

    if vote_selection is None:
        if vote:
            db.delete(vote)
        return None

    is_upvote = vote_selection == "up"

    if not vote:
        vote = Vote(
            user_id=user_id,
            review_id=target_id if target_type == "review" else None,
            comment_id=target_id if target_type == "comment" else None,
            is_upvote=is_upvote,
        )
        db.add(vote)
    else:
        vote.is_upvote = is_upvote

    return vote_selection


@router.post("/{post_id}/vote")
async def vote_on_post(
    post_id: str,
    payload: VoteRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Set the current user's vote state for a post.

    - **post_id**: The ID of the post to vote on.
    - **payload.vote**: `"up"`, `"down"`, or `null` to clear the vote.
    """
    post_id = parse_uuid(post_id)
    post = get_or_404(db, Review, post_id)
    user = get_or_404(db, User, current_user["user_id"])

    viewer_vote = apply_vote_selection(
        db,
        user_id=user.id,
        target_id=post.id,
        target_type="review",
        vote_selection=payload.vote,
    )
    db.commit()

    upvotes, downvotes = votes(db, post)

    return {
        "message": "Vote recorded successfully",
        "post_id": post.id,
        "upvotes": upvotes,
        "downvotes": downvotes,
        "viewer_vote": viewer_vote,
    }


@router.post("/comments/{comment_id}/vote")
async def vote_on_comment(
    comment_id: str,
    payload: VoteRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Set the current user's vote state for a comment.

    - **comment_id**: The ID of the comment to vote on.
    - **payload.vote**: `"up"`, `"down"`, or `null` to clear the vote.
    """
    comment_id = parse_uuid(comment_id)
    comment = get_or_404(db, Comment, comment_id)
    user = get_or_404(db, User, current_user["user_id"])

    viewer_vote = apply_vote_selection(
        db,
        user_id=user.id,
        target_id=comment.id,
        target_type="comment",
        vote_selection=payload.vote,
    )
    db.commit()

    upvotes, downvotes = comment_votes(db, comment)

    return {
        "message": "Vote recorded successfully",
        "comment_id": comment.id,
        "upvotes": upvotes,
        "downvotes": downvotes,
        "viewer_vote": viewer_vote,
    }

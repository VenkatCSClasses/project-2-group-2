from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.database import get_db
from app.models import Comment, Report, Review, User
from app.routes.helpers import get_or_404, parse_uuid, strip
from app.serde import serialize_comment
from app.utils import get_current_user


router = APIRouter()

@router.post("/{post_id}/comment")
async def comment_on_post(post_id: str, comment: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Add a comment to a post.

    - **post_id**: The ID of the post to comment on.
    - **comment**: The comment text.
    """
    post_id = parse_uuid(post_id)
    post = get_or_404(db, Review, post_id)
    user = get_or_404(db, User, current_user["user_id"])

    comment_text = strip(comment)
    if not comment_text:
        raise HTTPException(status_code=400, detail="Comment cannot be empty")

    new_comment = Comment(text=comment_text, author_id=user.id, review_id=post.id)
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return {"message": "Comment added successfully", "comment": serialize_comment(db, new_comment)}


@router.post("/comments/{comment_id}/report")
async def report_comment(comment_id: str, reason: str = None, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Report a comment.

    This endpoint allows users to report inappropriate content in a comment.
    """
    comment_id = parse_uuid(comment_id)
    comment = get_or_404(db, Comment, comment_id)
    user = get_or_404(db, User, current_user["user_id"])

    report = db.query(Report).filter(
        Report.comment_id == comment.id,
        Report.reporter_id == user.id,
    ).first()
    if not report:
        report = Report(
            comment_id=comment.id,
            reporter_id=user.id,
            reason=strip(reason),
        )
        db.add(report)
        db.commit()

    report_count = db.query(Report).filter(Report.comment_id == comment.id).count()
    return {"message": "Comment reported successfully", "comment_id": comment.id, "report_count": report_count}

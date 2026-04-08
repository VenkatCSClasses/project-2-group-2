"""Add votes, reports, and timestamps

Revision ID: 4b7a9f0d2e11
Revises: 7de44378dfc5
Create Date: 2026-04-07 19:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "4b7a9f0d2e11"
down_revision: Union[str, Sequence[str], None] = "7de44378dfc5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "reviews",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index("ix_reviews_created_at", "reviews", ["created_at"], unique=False)

    op.add_column(
        "comments",
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
    )
    op.create_index("ix_comments_created_at", "comments", ["created_at"], unique=False)

    op.create_table(
        "votes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("review_id", sa.Uuid(), nullable=True),
        sa.Column("comment_id", sa.Uuid(), nullable=True),
        sa.Column("is_upvote", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(["comment_id"], ["comments.id"]),
        sa.ForeignKeyConstraint(["review_id"], ["reviews.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "review_id", name="uq_votes_user_review"),
        sa.UniqueConstraint("user_id", "comment_id", name="uq_votes_user_comment"),
        sa.CheckConstraint(
            "((review_id IS NOT NULL AND comment_id IS NULL) OR (review_id IS NULL AND comment_id IS NOT NULL))",
            name="ck_votes_single_target",
        ),
    )
    op.create_index("ix_votes_comment_id", "votes", ["comment_id"], unique=False)
    op.create_index("ix_votes_created_at", "votes", ["created_at"], unique=False)
    op.create_index("ix_votes_review_id", "votes", ["review_id"], unique=False)

    op.create_table(
        "reports",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("reporter_id", sa.Uuid(), nullable=False),
        sa.Column("review_id", sa.Uuid(), nullable=True),
        sa.Column("comment_id", sa.Uuid(), nullable=True),
        sa.Column("reason", sa.String(length=256), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(["reporter_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["review_id"], ["reviews.id"]),
        sa.ForeignKeyConstraint(["comment_id"], ["comments.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("reporter_id", "review_id", name="uq_reports_user_review"),
        sa.UniqueConstraint("reporter_id", "comment_id", name="uq_reports_user_comment"),
        sa.CheckConstraint(
            "((review_id IS NOT NULL AND comment_id IS NULL) OR (review_id IS NULL AND comment_id IS NOT NULL))",
            name="ck_reports_single_target",
        ),
    )
    op.create_index("ix_reports_comment_id", "reports", ["comment_id"], unique=False)
    op.create_index("ix_reports_created_at", "reports", ["created_at"], unique=False)
    op.create_index("ix_reports_review_id", "reports", ["review_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_reports_review_id", table_name="reports")
    op.drop_index("ix_reports_created_at", table_name="reports")
    op.drop_index("ix_reports_comment_id", table_name="reports")
    op.drop_table("reports")

    op.drop_index("ix_votes_review_id", table_name="votes")
    op.drop_index("ix_votes_created_at", table_name="votes")
    op.drop_index("ix_votes_comment_id", table_name="votes")
    op.drop_table("votes")

    op.drop_index("ix_comments_created_at", table_name="comments")
    op.drop_column("comments", "created_at")

    op.drop_index("ix_reviews_created_at", table_name="reviews")
    op.drop_column("reviews", "created_at")

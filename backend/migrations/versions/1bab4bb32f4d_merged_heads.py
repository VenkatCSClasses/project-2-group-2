"""Merged heads

Revision ID: 1bab4bb32f4d
Revises: 255188568530, 4b7a9f0d2e11
Create Date: 2026-04-08 21:15:25.221491

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '1bab4bb32f4d'
down_revision: Union[str, Sequence[str], None] = ('255188568530', '4b7a9f0d2e11')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

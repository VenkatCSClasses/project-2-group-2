"""Track food item menu dates

Revision ID: 9c3c4e5d2a11
Revises: f165d2456e30
Create Date: 2026-04-15 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9c3c4e5d2a11'
down_revision: Union[str, Sequence[str], None] = 'f165d2456e30'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('food_items', sa.Column('menu_date', sa.Date(), nullable=True))
    op.execute(sa.text("UPDATE food_items SET menu_date = CURRENT_DATE WHERE menu_date IS NULL"))
    op.alter_column('food_items', 'menu_date', nullable=False)
    op.drop_index(op.f('ix_food_items_name'), table_name='food_items')
    op.create_index(op.f('ix_food_items_name'), 'food_items', ['name'], unique=False)
    op.create_index(op.f('ix_food_items_menu_date'), 'food_items', ['menu_date'], unique=False)
    op.create_unique_constraint(
        'uq_food_items_name_place_menu_date',
        'food_items',
        ['name', 'food_place_id', 'menu_date'],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('uq_food_items_name_place_menu_date', 'food_items', type_='unique')
    op.drop_index(op.f('ix_food_items_menu_date'), table_name='food_items')
    op.drop_index(op.f('ix_food_items_name'), table_name='food_items')
    op.create_index(op.f('ix_food_items_name'), 'food_items', ['name'], unique=True)
    op.drop_column('food_items', 'menu_date')

"""make pregnant woman dob optional

Revision ID: f1953b5c7e7d
Revises: b61bc0f79da5
Create Date: 2026-01-23 14:58:42.307121

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1953b5c7e7d'
down_revision: Union[str, Sequence[str], None] = 'b61bc0f79da5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "pregnant_women",
        "date_of_birth",
        existing_type=sa.Date(),
        nullable=True,
    )

def downgrade() -> None:
    op.alter_column(
        "pregnant_women",
        "date_of_birth",
        existing_type=sa.Date(),
        nullable=False,
    )

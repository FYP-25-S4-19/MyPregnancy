"""Drop unique constraint on products.name

Revision ID: e2b7a1c4d9f0
Revises: fecf4f950054
Create Date: 2026-02-04

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "e2b7a1c4d9f0"
down_revision: Union[str, Sequence[str], None] = "fecf4f950054"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # The original products table was created with `UniqueConstraint("name")` (no explicit name),
    # which Postgres auto-named as `products_name_key`.
    op.drop_constraint("products_name_key", "products", type_="unique")


def downgrade() -> None:
    """Downgrade schema."""
    op.create_unique_constraint("products_name_key", "products", ["name"])

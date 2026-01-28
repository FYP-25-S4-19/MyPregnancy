from typing import Type, TypeVar

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.users_manager import current_active_user
from app.db.db_config import get_db
from app.db.db_schema import User

T = TypeVar("T", bound=User)


def require_role(model: Type[T]):
    """
    Ensures the authenticated user is of the required SQLAlchemy polymorphic subclass.
    IMPORTANT: We re-fetch from DB as the subclass to avoid async lazy-load / MissingGreenlet issues.
    """

    async def role_checker(
        current_user: User = Depends(current_active_user),
        db: AsyncSession = Depends(get_db),
    ) -> T:
        # Load the subclass row explicitly
        stmt = select(model).where(model.id == current_user.id)  # type: ignore[attr-defined]
        obj = (await db.execute(stmt)).scalar_one_or_none()

        if obj is None:
            # User exists, but not of this subclass
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: User is not of required type '{model.__name__}'",
            )

        return obj

    return role_checker

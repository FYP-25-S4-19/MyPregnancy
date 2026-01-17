from typing import Type, TypeVar, Union

from fastapi import Depends, HTTPException, status

from app.core.users_manager import current_active_user
from app.db.db_schema import Merchant, Nutritionist, PregnantWoman, User, VolunteerDoctor

T = TypeVar("T", bound=User)


def require_role(required_role: Type[T]):
    def role_checker(current_user: User = Depends(current_active_user)) -> T:
        if not isinstance(current_user, required_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: User is not of required type '{required_role.__name__}'",
            )
        return current_user

    return role_checker


def get_current_user(
    current_user: User = Depends(current_active_user),
) -> Union[PregnantWoman, VolunteerDoctor, Nutritionist, Merchant]:
    """
    Get the current authenticated user without role restrictions.
    Returns the user object regardless of their specific role.
    """
    return current_user

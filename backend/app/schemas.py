from typing import Optional
from uuid import UUID

from fastapi_users import schemas
from pydantic import ConfigDict

from app.db.db_schema import UserRole


class UserRead(schemas.BaseUser[UUID]):
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    role: UserRole
    profile_img_key: Optional[str] = None

    # Role-specific fields
    # mcr_no_id: Optional[int] = None  # Doctor/Nutritionist
    # shop_name: Optional[str] = None  # Merchant
    # date_of_birth: Optional[date] = None  # Pregnant Woman

    model_config = ConfigDict(from_attributes=True)


class UserCreate(schemas.BaseUserCreate):
    first_name: str
    middle_name: Optional[str] = None
    last_name: str
    role: UserRole
    type: str


class UserUpdate(schemas.BaseUserUpdate):
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    profile_img_key: Optional[str] = None

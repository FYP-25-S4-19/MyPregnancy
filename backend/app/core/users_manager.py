# app/core/users_manager.py

from typing import Optional
from uuid import UUID

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, FastAPIUsers, UUIDIDMixin, exceptions
from fastapi_users.authentication import AuthenticationBackend, BearerTransport, JWTStrategy
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.settings import settings
from app.db.db_config import get_db
from app.db.db_schema import (
    User,
    UserRole,
    PregnantWoman,
    Merchant,
    Nutritionist,
    VolunteerDoctor,
    Admin,
)


async def get_user_db(session: AsyncSession = Depends(get_db)):
    yield SQLAlchemyUserDatabase(session, User)


class UserManager(UUIDIDMixin, BaseUserManager[User, UUID]):
    reset_password_token_secret = settings.SECRET_KEY
    verification_token_secret = settings.SECRET_KEY

    async def create(self, user_create, safe: bool = False, request: Optional[Request] = None):
        """
        IMPORTANT:
        FastAPI Users default create() creates only the base `User`.
        We override it to create the correct SQLAlchemy polymorphic subclass
        (PregnantWoman / Merchant / Nutritionist / VolunteerDoctor / Admin)
        based on `role`, so require_role(PregnantWoman) works.
        """
        await self.validate_password(user_create.password, user_create)

        existing = await self.user_db.get_by_email(user_create.email)
        if existing:
            raise exceptions.UserAlreadyExists()

        user_dict = user_create.create_update_dict()
        password = user_dict.pop("password")
        user_dict["hashed_password"] = self.password_helper.hash(password)

        role = user_dict.get("role")

        role_to_model = {
            UserRole.ADMIN: Admin,
            UserRole.VOLUNTEER_DOCTOR: VolunteerDoctor,
            UserRole.PREGNANT_WOMAN: PregnantWoman,
            UserRole.NUTRITIONIST: Nutritionist,
            UserRole.MERCHANT: Merchant,
        }

        model_cls = role_to_model.get(role, User)

        # Create the correct subclass instance
        user_obj = model_cls(**user_dict)

        # SQLAlchemyUserDatabase exposes the session
        self.user_db.session.add(user_obj)
        await self.user_db.session.commit()
        await self.user_db.session.refresh(user_obj)

        await self.on_after_register(user_obj, request)
        return user_obj

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        print(f"User {user.id} has registered.")

    async def on_after_forgot_password(self, user: User, token: str, request: Optional[Request] = None):
        print(f"User {user.id} has forgot their password. Reset token: {token}")

    async def on_after_request_verify(self, user: User, token: str, request: Optional[Request] = None):
        print(f"Verification requested for user {user.id}. Verification token: {token}")


async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)


bearer_transport = BearerTransport(tokenUrl="auth/jwt/login")


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=settings.SECRET_KEY, lifetime_seconds=settings.JWT_EXP_SECONDS)


auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

fastapi_users = FastAPIUsers[User, UUID](
    get_user_manager,
    [auth_backend],
)

current_active_user = fastapi_users.current_user(active=True)
optional_current_active_user = fastapi_users.current_user(active=True, optional=True)
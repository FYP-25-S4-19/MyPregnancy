import datetime
import uuid
from typing import Any, AsyncGenerator, Awaitable, Callable

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.asyncio.engine import AsyncEngine
from sqlalchemy.pool import StaticPool

from app.core.users_manager import get_jwt_strategy
from app.db.db_config import get_db
from app.db.db_schema import (
    Admin,
    Base,
    Nutritionist,
    PregnantWoman,
    UserRole,
    VolunteerDoctor,
)
from app.main import app

# Use an in-memory SQLite database for testing with aiosqlite
# check_same_thread=False is needed for SQLite with async
engine: AsyncEngine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = async_sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ========================================================================
# ========================== MISC FIXTURES ===============================
# ========================================================================
@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="session")
def img_file_fixture() -> tuple[str, bytes, str]:
    """
    If you have a 'multipart/form-data' endpoint that requires an image upload,
    you can use this fixture to provide a valid PNG image file for testing.
    ...
    Say that your endpoint accepts a parameter named `le_random_image: UploadFile = File(...)`,
    then in your test you can pass it in like so:
    ...
    async def test_your_endpoint(
        client: AsyncClient,
        img_file_fixture: tuple[str, bytes, str]
    ):
        response = await client.post(
            "/your-endpoint",
            files={"le_random_image": img_file_fixture}, # Note this line
        )
    """
    valid_png = (  # Minimal 1x1 PNG
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
        b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    return ("test_image.png", valid_png, "image/png")


# ========================================================================
# ========================== ADMIN FIXTURES ==============================
# ========================================================================
CreateAdminCallable = Callable[
    ...,  # Accepts any keyword arguments (**kwargs)
    Awaitable[Admin],  # Must return an awaitable object (a coroutine) that resolves to Admin
]


@pytest_asyncio.fixture(scope="function")
async def admin_factory(db_session: AsyncSession, **kwargs: Any) -> CreateAdminCallable:
    async def _create_admin(**kwargs) -> Admin:
        unique_id = str(uuid.uuid4())
        defaults = {
            "role": UserRole.ADMIN,
            "email": f"admin_{unique_id}@test.com",
            "hashed_password": "hashed_password_123",
            "first_name": "Admin",
            "last_name": "McAdminface",
        }

        user_data = defaults | kwargs
        admin = Admin(**user_data)
        db_session.add(admin)
        await db_session.commit()
        return admin

    return _create_admin


@pytest_asyncio.fixture(scope="function")
async def admin(admin_factory: CreateAdminCallable) -> Admin:
    return await admin_factory()


@pytest_asyncio.fixture(scope="function")
async def authenticated_admin_client(client: AsyncClient, admin: Admin) -> tuple[AsyncClient, Admin]:
    strategy = get_jwt_strategy()
    jwt_token: str = await strategy.write_token(admin)
    client.headers["Authorization"] = f"Bearer {jwt_token}"
    return client, admin


# ========================================================================
# ===================== VOLUNTEER DOCTOR FIXTURES ========================
# ========================================================================
CreateDoctorCallable = Callable[
    ...,  # Accepts any keyword arguments (**kwargs)
    Awaitable[VolunteerDoctor],  # Must return an awaitable object (a coroutine) that resolves to VolunteerDoctor
]


@pytest_asyncio.fixture(scope="function")
async def volunteer_doctor_factory(db_session: AsyncSession) -> CreateDoctorCallable:
    async def _create_doctor(**kwargs) -> VolunteerDoctor:
        unique_id = str(uuid.uuid4())

        defaults = {
            "role": UserRole.VOLUNTEER_DOCTOR,
            "email": f"doctor_{unique_id}@test.com",
            "hashed_password": "hashed_password_123",
            "mcr_no_id": 1,
            "first_name": "John",
            "last_name": "Doe",
        }

        user_data = defaults | kwargs
        doctor = VolunteerDoctor(**user_data)

        db_session.add(doctor)
        await db_session.commit()
        return doctor

    return _create_doctor


@pytest_asyncio.fixture(scope="function")
async def volunteer_doctor(volunteer_doctor_factory: CreateDoctorCallable) -> VolunteerDoctor:
    return await volunteer_doctor_factory()


@pytest_asyncio.fixture(scope="function")
async def authenticated_doctor_client(
    client: AsyncClient, volunteer_doctor: VolunteerDoctor
) -> tuple[AsyncClient, VolunteerDoctor]:
    strategy = get_jwt_strategy()
    jwt_token: str = await strategy.write_token(volunteer_doctor)
    client.headers["Authorization"] = f"Bearer {jwt_token}"
    return client, volunteer_doctor


# ========================================================================
# ====================== PREGNANT WOMAN FIXTURES =========================
# ========================================================================
CreatePregnantWomanCallable = Callable[
    ...,  # Accepts any keyword arguments (**kwargs)
    Awaitable[PregnantWoman],  # Must return an awaitable object (a coroutine) that resolves to PregnantWoman
]


@pytest_asyncio.fixture(scope="function")
async def pregnant_woman_factory(db_session: AsyncSession) -> CreatePregnantWomanCallable:
    async def _create_woman(**kwargs) -> PregnantWoman:
        unique_id = str(uuid.uuid4())
        defaults = {
            "first_name": unique_id,
            "middle_name": unique_id,
            "last_name": unique_id,
            "date_of_birth": datetime.date(1990, 1, 1),
            "role": UserRole.PREGNANT_WOMAN,
            "email": f"mother_{unique_id}@test.com",
            "hashed_password": "hashed_password_456",
        }
        user_data = defaults | kwargs
        mother = PregnantWoman(**user_data)
        db_session.add(mother)
        await db_session.commit()
        return mother

    return _create_woman


@pytest_asyncio.fixture(scope="function")
async def pregnant_woman(pregnant_woman_factory: CreatePregnantWomanCallable) -> PregnantWoman:
    return await pregnant_woman_factory()


@pytest_asyncio.fixture(scope="function")
async def authenticated_pregnant_woman_client(
    client: AsyncClient, pregnant_woman: PregnantWoman
) -> tuple[AsyncClient, PregnantWoman]:
    strategy = get_jwt_strategy()
    jwt_token: str = await strategy.write_token(pregnant_woman)
    client.headers["Authorization"] = f"Bearer {jwt_token}"
    return client, pregnant_woman


# ========================================================================
# ====================== NUTRITIONIST FIXTURES ===========================
# ========================================================================
CreateNutritionistCallable = Callable[
    ...,  # Accepts any keyword arguments (**kwargs)
    Awaitable[Nutritionist],  # Must return an awaitable object (a coroutine) that resolves to Nutritionist
]


@pytest_asyncio.fixture(scope="function")
async def nutritionist_factory(db_session: AsyncSession) -> CreateNutritionistCallable:
    async def _create_nutritionist(**kwargs) -> Nutritionist:
        unique_id = str(uuid.uuid4())
        defaults = {
            "role": UserRole.NUTRITIONIST,
            "email": f"nutritionist_{unique_id}@test.com",
            "hashed_password": "hashed_password_789",
            "first_name": "Jane",
            "last_name": "Smith",
        }

        user_data = defaults | kwargs
        nutritionist = Nutritionist(**user_data)
        db_session.add(nutritionist)
        await db_session.commit()
        return nutritionist

    return _create_nutritionist


@pytest_asyncio.fixture(scope="function")
async def nutritionist(nutritionist_factory: CreateNutritionistCallable) -> Nutritionist:
    return await nutritionist_factory()


@pytest_asyncio.fixture(scope="function")
async def authenticated_nutritionist_client(
    client: AsyncClient, nutritionist: Nutritionist
) -> tuple[AsyncClient, Nutritionist]:
    strategy = get_jwt_strategy()
    jwt_token: str = await strategy.write_token(nutritionist)
    client.headers["Authorization"] = f"Bearer {jwt_token}"
    return client, nutritionist

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.db_schema import (
    AccountCreationRequestStatus,
    Admin,
    DoctorAccountCreationRequest,
    NutritionistAccountCreationRequest,
)
from tests.conftest import CreateDoctorCallable


@pytest.mark.asyncio
async def test_get_account_creation_requests_success(
    authenticated_admin_client: tuple[AsyncClient, Admin],
    db_session: AsyncSession,
) -> None:
    client, _ = authenticated_admin_client

    doctor_req = DoctorAccountCreationRequest(
        first_name="Doc",
        last_name="Request",
        email="doc.request@test.com",
        password="password",
        qualification_img_key="key1",
    )
    nutritionist_req = NutritionistAccountCreationRequest(
        first_name="Nutri",
        last_name="Request",
        email="nutri.request@test.com",
        password="password",
        qualification_img_key="key2",
    )
    db_session.add_all([doctor_req, nutritionist_req])
    await db_session.commit()

    response = await client.get("/account-requests/")
    assert response.status_code == status.HTTP_200_OK, "Expected 200 OK for successful retrieval"
    data = response.json()
    assert len(data) == 2, "Expected 2 account creation requests in the response"


@pytest.mark.asyncio
async def test_get_account_creation_requests_unauthorized(client: AsyncClient) -> None:
    response = await client.get("/account-requests/")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_submit_doctor_account_creation_request_success(
    client: AsyncClient,
    db_session: AsyncSession,
    img_file_fixture: tuple[str, bytes, str],
) -> None:
    doctor_email: str = "new_doctor@test.com"
    response = await client.post(
        "/account-requests/doctors",
        data={
            "email": doctor_email,
            "password": "password123",
            "first_name": "New",
            "last_name": "Doctor",
        },
        files={"qualification_img": img_file_fixture},
    )
    assert response.status_code == status.HTTP_201_CREATED

    stmt = select(DoctorAccountCreationRequest).where(DoctorAccountCreationRequest.email == doctor_email)
    query_data = (await db_session.execute(stmt)).scalar_one_or_none()
    assert query_data is not None
    assert query_data.account_status == AccountCreationRequestStatus.PENDING


@pytest.mark.asyncio
async def test_submit_nutritionist_account_creation_request_success(
    client: AsyncClient,
    db_session: AsyncSession,
    img_file_fixture: tuple[str, bytes, str],
) -> None:
    nutritionist_email: str = "new.nutri@test.com"

    response = await client.post(
        "/account-requests/nutritionists",
        data={
            "email": nutritionist_email,
            "password": "password123",
            "first_name": "New",
            "last_name": "Nutri",
        },
        files={"qualification_img": img_file_fixture},
    )
    assert response.status_code == status.HTTP_201_CREATED

    stmt = select(NutritionistAccountCreationRequest).where(
        NutritionistAccountCreationRequest.email == nutritionist_email
    )
    query_data = (await db_session.execute(stmt)).scalar_one_or_none()
    assert query_data is not None, "Nutritionist account creation request should be in the database"


@pytest.mark.asyncio
async def test_submit_doctor_request_email_conflict(
    client: AsyncClient,
    volunteer_doctor_factory: CreateDoctorCallable,
    db_session: AsyncSession,
    img_file_fixture: tuple[str, bytes, str],
) -> None:
    conflicting_email: str = "existing@test.com"

    existing_doctor = await volunteer_doctor_factory(email=conflicting_email)
    db_session.add(existing_doctor)
    await db_session.commit()

    response = await client.post(
        "/account-requests/doctors",
        data={
            "email": conflicting_email,
            "password": "password456",
            "first_name": "Conflicting",
            "last_name": "Doctor",
        },
        files={"qualification_img": img_file_fixture},
    )
    assert response.status_code == status.HTTP_409_CONFLICT, "Expected 409 CONFLICT for email already in use"


@pytest.mark.asyncio
async def test_process_request_not_found(
    authenticated_admin_client: tuple[AsyncClient, Admin],
) -> None:
    client, _ = authenticated_admin_client
    response = await client.patch("/account-requests/doctors/9999/accept")
    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.asyncio
async def test_process_request_already_processed(
    authenticated_admin_client: tuple[AsyncClient, Admin],
    db_session: AsyncSession,
) -> None:
    client, _ = authenticated_admin_client

    request = DoctorAccountCreationRequest(
        first_name="Approved",
        last_name="Doc",
        email="approved.doc@test.com",
        password="password",
        qualification_img_key="key",
        account_status=AccountCreationRequestStatus.APPROVED,
    )
    db_session.add(request)
    await db_session.commit()

    response = await client.patch(f"/account-requests/doctors/{request.id}/accept")
    assert response.status_code == status.HTTP_409_CONFLICT


@pytest.mark.asyncio
async def test_process_request_unauthorized(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    request = DoctorAccountCreationRequest(
        first_name="Pending",
        last_name="Doc",
        email="pending.doc@test.com",
        password="password",
        qualification_img_key="key",
        account_status=AccountCreationRequestStatus.PENDING,
    )
    db_session.add(request)
    await db_session.commit()

    response = await client.patch(f"/account-requests/doctors/{request.id}/accept")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED, (
        "Should not allow unauthorized access to process requests"
    )

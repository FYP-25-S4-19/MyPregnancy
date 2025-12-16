from argon2 import PasswordHasher
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.password_hasher import get_password_hasher
from app.core.security import require_role
from app.db.db_config import get_db
from app.db.db_schema import Admin, UserRole
from app.features.accounts.account_models import AccountCreationRequestView, RejectAccountCreationRequestReason
from app.features.accounts.account_service import AccountService

account_router = APIRouter(prefix="/account-requests", tags=["Account Creation Requests"])


def get_account_service(db: AsyncSession = Depends(get_db)) -> AccountService:
    return AccountService(db)


@account_router.get("/", response_model=list[AccountCreationRequestView])
async def get_account_creation_requests(
    _: Admin = Depends(require_role(Admin)),
    service: AccountService = Depends(get_account_service),
) -> list[AccountCreationRequestView]:
    return await service.get_account_creation_requests()


@account_router.post("/doctors", status_code=status.HTTP_201_CREATED)
async def submit_doctor_account_creation_request(
    email: str = Form(...),
    password: str = Form(...),
    first_name: str = Form(...),
    middle_name: str | None = Form(None),
    last_name: str = Form(...),
    qualification_img: UploadFile = File(),
    service: AccountService = Depends(get_account_service),
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await service.submit_account_creation_request(
            email,
            password,
            first_name,
            middle_name,
            last_name,
            UserRole.VOLUNTEER_DOCTOR.value,
            qualification_img,
        )
        await db.commit()
    except:
        await db.rollback()
        raise


@account_router.post("/nutritionists", status_code=status.HTTP_201_CREATED)
async def submit_nutritionist_account_creation_request(
    email: str = Form(...),
    password: str = Form(...),
    first_name: str = Form(...),
    middle_name: str | None = Form(None),
    last_name: str = Form(...),
    qualification_img: UploadFile = File(),
    service: AccountService = Depends(get_account_service),
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await service.submit_account_creation_request(
            email,
            password,
            first_name,
            middle_name,
            last_name,
            UserRole.NUTRITIONIST.value,
            qualification_img,
        )
        await db.commit()
    except:
        await db.rollback()
        raise


@account_router.patch("/doctors/{request_id}/accept", status_code=status.HTTP_204_NO_CONTENT)
async def accept_doctor_account_creation_request(
    request_id: int,
    _: Admin = Depends(require_role(Admin)),
    service: AccountService = Depends(get_account_service),
    password_hasher: PasswordHasher = Depends(get_password_hasher),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.accept_doctor_account_creation_request(request_id, password_hasher)
        await db.commit()
    except:
        await db.rollback()
        raise


@account_router.patch("/doctors/{request_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
async def reject_doctor_account_creation_request(
    request_id: int,
    request: RejectAccountCreationRequestReason,
    _: Admin = Depends(require_role(Admin)),
    service: AccountService = Depends(get_account_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.reject_doctor_account_creation_request(request_id, request.reject_reason)
        await db.commit()
    except:
        await db.rollback()
        raise


@account_router.patch("/nutritionists/{request_id}/accept", status_code=status.HTTP_204_NO_CONTENT)
async def accept_nutritionist_account_creation_request(
    request_id: int,
    _: Admin = Depends(require_role(Admin)),
    service: AccountService = Depends(get_account_service),
    password_hasher: PasswordHasher = Depends(get_password_hasher),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.accept_nutritionist_account_creation_request(request_id, password_hasher)
        await db.commit()
    except:
        await db.rollback()
        raise


@account_router.patch("/nutritionists/{request_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
async def reject_nutritionist_account_creation_request(
    request_id: int,
    request: RejectAccountCreationRequestReason,
    _: Admin = Depends(require_role(Admin)),
    service: AccountService = Depends(get_account_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.reject_nutritionist_account_creation_request(request_id, request.reject_reason)
        await db.commit()
    except:
        await db.rollback()
        raise

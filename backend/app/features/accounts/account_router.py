from argon2 import PasswordHasher
from fastapi import APIRouter, Depends, File, Form, UploadFile, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.password_hasher import get_password_hasher
from app.core.security import require_role, get_current_user
from app.db.db_config import get_db

from app.db.db_schema import Admin, PregnantWoman, VolunteerDoctor, Nutritionist, Merchant, UserRole, MCRNumber
from app.features.accounts.account_models import (
    AccountCreationRequestView,
    HealthProfileUpdateRequest,
    MyProfileResponse,
    PregnancyDetailsUpdateRequest,
    RejectAccountCreationRequestReason,
    DoctorUpdateRequest,
    NutritionistUpdateRequest,
    MerchantUpdateRequest,
    PregnantWomanUpdateRequest,
    MyAccountResponse,
)
from app.features.accounts.account_service import AccountService

account_router = APIRouter(prefix="/account-requests", tags=["Account Creation Requests"])


def get_account_service(db: AsyncSession = Depends(get_db)) -> AccountService:
    return AccountService(db)


@account_router.put("/me/pregnancy-details")
async def update_my_pregnancy_details(
    payload: PregnancyDetailsUpdateRequest,
    db: AsyncSession = Depends(get_db),
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
    service: AccountService = Depends(get_account_service),
) -> None:
    try:
        await service.update_pregnancy_details(mother, payload)
        await db.commit()
    except:
        await db.rollback()
        raise


@account_router.put("/me/health-profile")
async def update_my_health_profile(
    payload: HealthProfileUpdateRequest,
    db: AsyncSession = Depends(get_db),
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
    service: AccountService = Depends(get_account_service),
) -> None:
    try:
        await service.update_health_profile(mother, payload)
        await db.commit()
    except:
        await db.rollback()
        raise


@account_router.get("/me/profile", response_model=MyProfileResponse)
async def get_my_profile(
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
    service: AccountService = Depends(get_account_service),
) -> MyProfileResponse:
    return await service.get_my_profile(mother)


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




# .........................
# User profile updates
# ..........................

@account_router.put("/doctor", response_model=None)
async def update_doctor(
    payload: DoctorUpdateRequest,
    doctor: VolunteerDoctor = Depends(require_role(VolunteerDoctor)),
    service: AccountService = Depends(get_account_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.update_doctor_profile(doctor, payload)
        await db.commit()
    except:
        await db.rollback()
        raise

@account_router.put("/nutritionist", response_model=None)
async def update_nutritionist(
    payload: NutritionistUpdateRequest,
    nutritionist: Nutritionist = Depends(require_role(Nutritionist)),
    service: AccountService = Depends(get_account_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.update_nutritionist_profile(nutritionist, payload)
        await db.commit()
    except:
        await db.rollback()
        raise

@account_router.put("/merchant", response_model=None)
async def update_merchant(
    payload: MerchantUpdateRequest,
    merchant: Merchant = Depends(require_role(Merchant)),
    service: AccountService = Depends(get_account_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.update_merchant_profile(merchant, payload)
        await db.commit()
    except:
        await db.rollback()
        raise

@account_router.put("/pregnant-woman", response_model=None)
async def update_pregnant_woman(
    payload: PregnantWomanUpdateRequest,
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
    service: AccountService = Depends(get_account_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.update_pregnant_woman_profile(mother, payload)
        await db.commit()
    except:
        await db.rollback()
        raise
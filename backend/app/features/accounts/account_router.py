from argon2 import PasswordHasher
from fastapi import APIRouter, Depends, File, Form, UploadFile, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.password_hasher import get_password_hasher
from app.core.security import require_role, get_current_user
from app.db.db_config import get_db

from app.db.db_schema import Admin, PregnantWoman, VolunteerDoctor, Nutritionist, Merchant, UserRole
from app.features.accounts.account_models import (
    AccountCreationRequestView,
    HealthProfileUpdateRequest,
    MyProfileResponse,
    PregnancyDetailsUpdateRequest,
    RejectAccountCreationRequestReason,
    AccountUpdate,
    PregnantWomanUpdate, 
    VolunteerDoctorUpdate, 
    NutritionistUpdate, 
    MerchantUpdate,
    AccountUpdateType,
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


# @account_router.put("/me/account")
# async def update_my_account(
#     payload: AccountUpdate,
#     user: PregnantWoman | VolunteerDoctor | Nutritionist = Depends(UserRole),
#     service: AccountService = Depends(get_account_service),
#     db: AsyncSession = Depends(get_db),
#     password_hasher: PasswordHasher = Depends(get_password_hasher)
# ) -> None:
#     try:
#         await service.update_account_info(user, payload, password_hasher)
#         await db.commit()
#     except:
#         await db.rollback()
#         raise




# Helper function to determine the correct update model based on user type
def get_update_model(user: PregnantWoman | VolunteerDoctor | Nutritionist | Merchant):
    """Return the appropriate update model based on user type"""
    if isinstance(user, PregnantWoman):
        return PregnantWomanUpdate
    elif isinstance(user, VolunteerDoctor):
        return VolunteerDoctorUpdate
    elif isinstance(user, Nutritionist):
        return NutritionistUpdate
    elif isinstance(user, Merchant):
        return MerchantUpdate
    else:
        raise HTTPException(status_code=400, detail="Unknown user type")

@account_router.put("/me/account")
async def update_my_account(
    payload: AccountUpdateType,
    user: PregnantWoman | VolunteerDoctor | Nutritionist | Merchant = Depends(get_current_user),
    service: AccountService = Depends(get_account_service),
    db: AsyncSession = Depends(get_db),
    password_hasher: PasswordHasher = Depends(get_password_hasher)
) -> dict:
    """
    Update account information for the current user.
    Automatically uses the correct update model based on user type.
    """
    try:
        await service.update_account_info(user, payload, password_hasher)
        await db.commit()
        return {"message": "Account updated successfully"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


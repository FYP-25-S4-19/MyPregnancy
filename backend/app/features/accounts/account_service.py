from argon2 import PasswordHasher
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.db_schema import (
    AccountCreationRequestStatus,
    DoctorAccountCreationRequest,
    Nutritionist,
    NutritionistAccountCreationRequest,
    UserRole,
    VolunteerDoctor,
)
from app.features.accounts.account_models import AccountCreationRequestView
from app.shared.s3_storage_interface import S3StorageInterface
from app.shared.utils import is_valid_image


class AccountService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_account_creation_requests(self) -> list[AccountCreationRequestView]:
        doctor_creation_requests = [
            AccountCreationRequestView(
                first_name=req.first_name,
                middle_name=req.middle_name,
                last_name=req.last_name,
                qualification_img_url="",
                user_role=UserRole.VOLUNTEER_DOCTOR.value,
                submitted_at=req.submitted_at,
            )
            for req in (await self.db.execute(select(DoctorAccountCreationRequest))).scalars().all()
        ]
        nutritionist_creation_requests = [
            AccountCreationRequestView(
                first_name=req.first_name,
                middle_name=req.middle_name,
                last_name=req.last_name,
                qualification_img_url="",
                user_role=UserRole.NUTRITIONIST.value,
                submitted_at=req.submitted_at,
            )
            for req in (await self.db.execute(select(NutritionistAccountCreationRequest))).scalars().all()
        ]
        return sorted(
            doctor_creation_requests + nutritionist_creation_requests, key=lambda req: req.submitted_at, reverse=True
        )

    async def submit_account_creation_request(
        self,
        email: str,
        password: str,
        first_name: str,
        middle_name: str | None,
        last_name: str,
        user_role: str,
        qualification_img: UploadFile,
    ) -> None:
        if user_role != UserRole.VOLUNTEER_DOCTOR.value and user_role != UserRole.NUTRITIONIST.value:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user role")

        if qualification_img is not None and (not is_valid_image(qualification_img)):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Invalid qualification image file"
            )

        stmt = (
            select(VolunteerDoctor).where(VolunteerDoctor.email == email)
            if user_role == UserRole.VOLUNTEER_DOCTOR.value
            else select(Nutritionist).where(Nutritionist.email == email)
        )
        existing_user_with_email = (await self.db.execute(stmt)).scalar_one_or_none()
        if existing_user_with_email is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")

        img_key: str | None = S3StorageInterface.put_staging_qualification_img(qualification_img)
        if img_key is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload qualification image. Please try again.",
            )

        if user_role == UserRole.VOLUNTEER_DOCTOR.value:
            dr_acc_creation_req = DoctorAccountCreationRequest(
                first_name=first_name,
                middle_name=middle_name,
                last_name=last_name,
                email=email,
                password=password,
                qualification_img_key=img_key,
            )
            self.db.add(dr_acc_creation_req)
        else:
            nutritionist_acc_creation_req = NutritionistAccountCreationRequest(
                first_name=first_name,
                middle_name=middle_name,
                last_name=last_name,
                email=email,
                password=password,
                qualification_img_key=img_key,
            )
            self.db.add(nutritionist_acc_creation_req)

    async def accept_doctor_account_creation_request(self, request_id: int, password_hasher: PasswordHasher) -> None:
        stmt = select(DoctorAccountCreationRequest).where(DoctorAccountCreationRequest.id == request_id)
        acc_creation_req = (await self.db.execute(stmt)).scalar_one_or_none()
        if acc_creation_req is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account creation request not found")
        if acc_creation_req.account_status == AccountCreationRequestStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Account creation request has already been approved"
            )
        if acc_creation_req.account_status == AccountCreationRequestStatus.REJECTED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Account creation request has already been rejected"
            )

        new_doctor = VolunteerDoctor(
            first_name=acc_creation_req.first_name,
            middle_name=acc_creation_req.middle_name,
            last_name=acc_creation_req.last_name,
            email=acc_creation_req.email,
            hashed_password=password_hasher.hash(acc_creation_req.password),
        )
        self.db.add(new_doctor)
        await self.db.flush()  # To get the new doctor ID

        new_doctor.qualification_img_key = S3StorageInterface.promote_staging_qualification_img(
            user_id=new_doctor.id, staging_img_key=acc_creation_req.qualification_img_key
        )
        if new_doctor.qualification_img_key is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to promote qualification image. Please try again.",
            )
        acc_creation_req.account_status = AccountCreationRequestStatus.APPROVED

    async def reject_doctor_account_creation_request(self, request_id: int, reject_reason: str) -> None:
        stmt = select(DoctorAccountCreationRequest).where(DoctorAccountCreationRequest.id == request_id)
        acc_creation_req = (await self.db.execute(stmt)).scalar_one_or_none()
        if acc_creation_req is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account creation request not found")
        if acc_creation_req.account_status == AccountCreationRequestStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Account creation request has already been approved"
            )
        if acc_creation_req.account_status == AccountCreationRequestStatus.REJECTED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Account creation request has already been rejected"
            )
        acc_creation_req.account_status = AccountCreationRequestStatus.REJECTED
        acc_creation_req.reject_reason = reject_reason

    async def accept_nutritionist_account_creation_request(
        self, request_id: int, password_hasher: PasswordHasher
    ) -> None:
        stmt = select(NutritionistAccountCreationRequest).where(NutritionistAccountCreationRequest.id == request_id)
        acc_creation_req = (await self.db.execute(stmt)).scalar_one_or_none()
        if acc_creation_req is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account creation request not found")
        if acc_creation_req.account_status == AccountCreationRequestStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Account creation request has already been approved"
            )
        if acc_creation_req.account_status == AccountCreationRequestStatus.REJECTED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Account creation request has already been rejected"
            )

        new_nutritionist = Nutritionist(
            first_name=acc_creation_req.first_name,
            middle_name=acc_creation_req.middle_name,
            last_name=acc_creation_req.last_name,
            email=acc_creation_req.email,
            hashed_password=password_hasher.hash(acc_creation_req.password),
        )
        self.db.add(new_nutritionist)
        await self.db.flush()  # To get the new nutritionist ID

        new_nutritionist.qualification_img_key = S3StorageInterface.promote_staging_qualification_img(
            user_id=new_nutritionist.id, staging_img_key=acc_creation_req.qualification_img_key
        )
        if new_nutritionist.qualification_img_key is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to promote qualification image. Please try again.",
            )

        acc_creation_req.account_status = AccountCreationRequestStatus.APPROVED

    async def reject_nutritionist_account_creation_request(self, request_id: int, reject_reason: str) -> None:
        stmt = select(NutritionistAccountCreationRequest).where(NutritionistAccountCreationRequest.id == request_id)
        acc_creation_req = (await self.db.execute(stmt)).scalar_one_or_none()
        if acc_creation_req is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account creation request not found")
        if acc_creation_req.account_status == AccountCreationRequestStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Account creation request has already been approved"
            )
        if acc_creation_req.account_status == AccountCreationRequestStatus.REJECTED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Account creation request has already been rejected"
            )
        acc_creation_req.account_status = AccountCreationRequestStatus.REJECTED
        acc_creation_req.reject_reason = reject_reason

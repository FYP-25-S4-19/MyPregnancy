from argon2 import PasswordHasher
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.db_schema import (
    AccountCreationRequestStatus,
    DoctorAccountCreationRequest,
    DoctorSpecialisation,
    MCRNumber,
    Nutritionist,
    NutritionistAccountCreationRequest,
    PregnantWoman,
    UserRole,
    VolunteerDoctor,
)
from app.features.accounts.account_models import (
    AccountCreationRequestView,
    HealthProfileUpdateRequest,
    MyProfileResponse,
    PregnancyDetailsUpdateRequest,
)
from app.shared.s3_storage_interface import S3StorageInterface
from app.shared.utils import is_valid_image


class AccountService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def update_pregnancy_details(self, mother: PregnantWoman, data: PregnancyDetailsUpdateRequest) -> None:
        mother.pregnancy_stage = data.stage
        mother.pregnancy_week = data.pregnancy_week

        # stage-based fields
        if data.stage == "pregnant":
            mother.expected_due_date = data.expected_due_date
            mother.baby_date_of_birth = None
        elif data.stage == "postpartum":
            mother.baby_date_of_birth = data.baby_date_of_birth
            mother.expected_due_date = None
        else:  # planning
            mother.expected_due_date = None
            mother.baby_date_of_birth = None

        await self.db.flush()

    async def update_health_profile(self, mother: PregnantWoman, data: HealthProfileUpdateRequest) -> None:
        mother.blood_type = data.blood_type
        mother.allergies = data.allergies or []
        mother.diet_preferences = data.diet_preferences or []
        mother.medical_conditions = data.medical_conditions
        await self.db.flush()

    async def get_my_profile(self, mother: PregnantWoman) -> MyProfileResponse:
        return MyProfileResponse(
            stage=mother.pregnancy_stage,
            pregnancy_week=mother.pregnancy_week,
            expected_due_date=mother.expected_due_date,
            baby_date_of_birth=mother.baby_date_of_birth,
            blood_type=mother.blood_type,
            allergies=mother.allergies or [],
            diet_preferences=mother.diet_preferences or [],
            medical_conditions=mother.medical_conditions,
        )

    async def get_account_creation_requests(self) -> list[AccountCreationRequestView]:
        doctor_reqs = (
            (
                await self.db.execute(
                    select(DoctorAccountCreationRequest).where(
                        DoctorAccountCreationRequest.account_status == AccountCreationRequestStatus.PENDING
                    )
                )
            )
            .scalars()
            .all()
        )
        nutritionist_reqs = (
            (
                await self.db.execute(
                    select(NutritionistAccountCreationRequest).where(
                        NutritionistAccountCreationRequest.account_status == AccountCreationRequestStatus.PENDING
                    )
                )
            )
            .scalars()
            .all()
        )

        doctor_creation_requests = [
            AccountCreationRequestView(
                request_id=req.id,
                user_role=UserRole.VOLUNTEER_DOCTOR.value,
                first_name=req.first_name,
                middle_name=req.middle_name,
                last_name=req.last_name,
                email=req.email,
                qualification_img_url=req.qualification_img_key,  # or convert to URL if you do that elsewhere
                account_status=req.account_status.value if hasattr(req.account_status, "value") else req.account_status,
                reject_reason=req.reject_reason,
                submitted_at=req.submitted_at,
            )
            for req in doctor_reqs
        ]

        nutritionist_creation_requests = [
            AccountCreationRequestView(
                request_id=req.id,
                user_role=UserRole.NUTRITIONIST.value,
                first_name=req.first_name,
                middle_name=req.middle_name,
                last_name=req.last_name,
                email=req.email,
                qualification_img_url=req.qualification_img_key,
                account_status=req.account_status.value if hasattr(req.account_status, "value") else req.account_status,
                reject_reason=req.reject_reason,
                submitted_at=req.submitted_at,
            )
            for req in nutritionist_reqs
        ]

        return sorted(
            doctor_creation_requests + nutritionist_creation_requests,
            key=lambda r: r.submitted_at,
            reverse=True,
        )

    async def submit_doctor_account_creation_request(
        self,
        email: str,
        password: str,
        first_name: str,
        middle_name: str | None,
        last_name: str,
        mcr_no: str,
        specialisation: str,
        user_role: str,
        qualification_img: UploadFile,
    ) -> None:
        if user_role not in (UserRole.VOLUNTEER_DOCTOR.value, UserRole.NUTRITIONIST.value):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user role")

        if qualification_img is not None and (not is_valid_image(qualification_img)):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Invalid qualification image file",
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

        mcr_stmt = select(MCRNumber).where(MCRNumber.value == mcr_no)
        mcr_result = (await self.db.execute(mcr_stmt)).scalar_one_or_none()
        if mcr_result is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MCR number not found")

        specialisation_stmt = select(DoctorSpecialisation).where(DoctorSpecialisation.specialisation == specialisation)
        specialisation_result = (await self.db.execute(specialisation_stmt)).scalar_one_or_none()
        if specialisation_result is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor specialisation not found")

        self.db.add(
            DoctorAccountCreationRequest(
                first_name=first_name,
                middle_name=middle_name,
                last_name=last_name,
                email=email,
                mcr_no=mcr_result.value,
                specialisation=specialisation_result.specialisation,
                password=password,
                qualification_img_key=img_key,
            )
        )

        await self.db.flush()

    async def submit_nutritionist_account_creation_request(
        self,
        email: str,
        password: str,
        first_name: str,
        middle_name: str | None,
        last_name: str,
        user_role: str,
        qualification_img: UploadFile,
    ) -> None:
        if user_role not in (UserRole.VOLUNTEER_DOCTOR.value, UserRole.NUTRITIONIST.value):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user role")

        if qualification_img is not None and (not is_valid_image(qualification_img)):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Invalid qualification image file",
            )

        stmt = select(Nutritionist).where(Nutritionist.email == email)
        existing_user_with_email = (await self.db.execute(stmt)).scalar_one_or_none()
        if existing_user_with_email is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")

        img_key: str | None = S3StorageInterface.put_staging_qualification_img(qualification_img)
        if img_key is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload qualification image. Please try again.",
            )

        self.db.add(
            NutritionistAccountCreationRequest(
                first_name=first_name,
                middle_name=middle_name,
                last_name=last_name,
                email=email,
                password=password,
                qualification_img_key=img_key,
            )
        )
        await self.db.flush()

    async def accept_doctor_account_creation_request(self, request_id: int, password_hasher: PasswordHasher) -> None:
        stmt = select(DoctorAccountCreationRequest).where(DoctorAccountCreationRequest.id == request_id)
        acc_creation_req = (await self.db.execute(stmt)).scalar_one_or_none()

        if acc_creation_req is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account creation request not found")
        if acc_creation_req.account_status == AccountCreationRequestStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Account creation request already approved"
            )
        if acc_creation_req.account_status == AccountCreationRequestStatus.REJECTED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Account creation request already rejected"
            )

        mcr_stmt = select(MCRNumber).where(MCRNumber.value == acc_creation_req.mcr_no)
        mcr_no_obj = (await self.db.execute(mcr_stmt)).scalar_one_or_none()
        if not mcr_no_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MCR number not found")

        specialisation_stmt = select(DoctorSpecialisation).where(
            DoctorSpecialisation.specialisation == acc_creation_req.specialisation
        )
        specialisation_obj = (await self.db.execute(specialisation_stmt)).scalar_one_or_none()
        if not specialisation_obj:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor specialisation not not found")

        # ✅ FIX: role must be set (users.role is NOT NULL)
        new_doctor = VolunteerDoctor(
            first_name=acc_creation_req.first_name,
            middle_name=acc_creation_req.middle_name,
            last_name=acc_creation_req.last_name,
            mcr_no=mcr_no_obj,
            specialisation=specialisation_obj,
            email=acc_creation_req.email,
            hashed_password=password_hasher.hash(acc_creation_req.password),
            role=UserRole.VOLUNTEER_DOCTOR,  # <-- critical
        )

        self.db.add(new_doctor)
        await self.db.flush()  # get new_doctor.id

        new_doctor.qualification_img_key = S3StorageInterface.promote_staging_qualification_img(
            user_id=new_doctor.id,
            staging_img_key=acc_creation_req.qualification_img_key,
        )
        if new_doctor.qualification_img_key is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to promote qualification image. Please try again.",
            )

        acc_creation_req.account_status = AccountCreationRequestStatus.APPROVED
        await self.db.flush()

    async def reject_doctor_account_creation_request(self, request_id: int, reject_reason: str) -> None:
        stmt = select(DoctorAccountCreationRequest).where(DoctorAccountCreationRequest.id == request_id)
        acc_creation_req = (await self.db.execute(stmt)).scalar_one_or_none()

        if acc_creation_req is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account creation request not found")
        if acc_creation_req.account_status == AccountCreationRequestStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Account creation request already approved"
            )
        if acc_creation_req.account_status == AccountCreationRequestStatus.REJECTED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Account creation request already rejected"
            )

        acc_creation_req.account_status = AccountCreationRequestStatus.REJECTED
        acc_creation_req.reject_reason = reject_reason
        await self.db.flush()

    async def accept_nutritionist_account_creation_request(
        self, request_id: int, password_hasher: PasswordHasher
    ) -> None:
        stmt = select(NutritionistAccountCreationRequest).where(NutritionistAccountCreationRequest.id == request_id)
        acc_creation_req = (await self.db.execute(stmt)).scalar_one_or_none()

        if acc_creation_req is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account creation request not found")
        if acc_creation_req.account_status == AccountCreationRequestStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Account creation request already approved"
            )
        if acc_creation_req.account_status == AccountCreationRequestStatus.REJECTED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Account creation request already rejected"
            )

        # ✅ FIX: role must be set (users.role is NOT NULL)
        new_nutritionist = Nutritionist(
            first_name=acc_creation_req.first_name,
            middle_name=acc_creation_req.middle_name,
            last_name=acc_creation_req.last_name,
            email=acc_creation_req.email,
            hashed_password=password_hasher.hash(acc_creation_req.password),
            role=UserRole.NUTRITIONIST,  # <-- critical
        )

        self.db.add(new_nutritionist)
        await self.db.flush()  # get new_nutritionist.id

        new_nutritionist.qualification_img_key = S3StorageInterface.promote_staging_qualification_img(
            user_id=new_nutritionist.id,
            staging_img_key=acc_creation_req.qualification_img_key,
        )
        if new_nutritionist.qualification_img_key is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to promote qualification image. Please try again.",
            )

        acc_creation_req.account_status = AccountCreationRequestStatus.APPROVED
        await self.db.flush()

    async def reject_nutritionist_account_creation_request(self, request_id: int, reject_reason: str) -> None:
        stmt = select(NutritionistAccountCreationRequest).where(NutritionistAccountCreationRequest.id == request_id)
        acc_creation_req = (await self.db.execute(stmt)).scalar_one_or_none()

        if acc_creation_req is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account creation request not found")
        if acc_creation_req.account_status == AccountCreationRequestStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Account creation request already approved"
            )
        if acc_creation_req.account_status == AccountCreationRequestStatus.REJECTED:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Account creation request already rejected"
            )

        acc_creation_req.account_status = AccountCreationRequestStatus.REJECTED
        acc_creation_req.reject_reason = reject_reason
        await self.db.flush()

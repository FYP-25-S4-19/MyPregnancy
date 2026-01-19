from datetime import date, datetime
from typing import Literal, Optional

from app.core.custom_base_model import CustomBaseModel

PregnancyStage = Literal["planning", "pregnant", "postpartum"]


class PregnancyDetailsUpdateRequest(CustomBaseModel):
    stage: PregnancyStage
    pregnancy_week: int | None = None
    expected_due_date: date | None = None
    baby_date_of_birth: date | None = None


class HealthProfileUpdateRequest(CustomBaseModel):
    blood_type: str | None = None
    allergies: list[str] = []
    diet_preferences: list[str] = []
    medical_conditions: str | None = None


class MyProfileResponse(CustomBaseModel):
    stage: PregnancyStage | None
    pregnancy_week: int | None
    expected_due_date: date | None
    baby_date_of_birth: date | None
    blood_type: str | None
    allergies: list[str]
    diet_preferences: list[str]
    medical_conditions: str | None


class AccountCreationRequestView(CustomBaseModel):
    request_id: int

    user_role: Literal["VOLUNTEER_DOCTOR", "NUTRITIONIST"]

    first_name: str
    middle_name: Optional[str] = None
    last_name: str

    email: str

    qualification_img_url: str

    account_status: str
    reject_reason: Optional[str] = None

    submitted_at: datetime
    
    # Doctor-specific fields
    mcr_no: Optional[str] = None
    specialisation: Optional[str] = None


class RejectAccountCreationRequestReason(CustomBaseModel):
    reject_reason: str

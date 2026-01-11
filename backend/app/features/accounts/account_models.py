from datetime import date, datetime
from typing import Literal

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
    first_name: str
    middle_name: str | None = None
    last_name: str
    qualification_img_url: str
    user_role: str
    submitted_at: datetime


class RejectAccountCreationRequestReason(CustomBaseModel):
    reject_reason: str


class AccountUpdate(CustomBaseModel):
    email: str | None = None
    first_name: str | None = None
    middle_name: str | None = None
    last_name: str | None = None
    date_of_birth: date | None = None



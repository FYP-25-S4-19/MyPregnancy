from datetime import date, datetime
from typing import Literal, Optional
from pydantic import BaseModel, validator, EmailStr
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


# .................
# User profile models
# .................

# Base model for all users
class UserUpdateRequest(BaseModel):
    first_name: str
    middle_name: str | None = None
    last_name: str
    email: EmailStr

# Doctor-specific update (includes MCR number)
class DoctorUpdateRequest(UserUpdateRequest):
    mcr_no_id: int

# Nutritionist update (just name and email)
class NutritionistUpdateRequest(UserUpdateRequest):
    pass

# Merchant update (includes shop name)
class MerchantUpdateRequest(UserUpdateRequest):
    shop_name: str

# Pregnant woman update (includes DOB)
class PregnantWomanUpdateRequest(UserUpdateRequest):
    date_of_birth: date

# Response model for any user
class MyAccountResponse(CustomBaseModel):
    first_name: str
    middle_name: str | None
    last_name: str
    email: str
    role: str
    extra: dict | None = None  # For additional fields like MCR or DOB
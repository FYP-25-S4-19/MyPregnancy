from datetime import date, datetime
from typing import Literal, Optional
from pydantic import BaseModel, validator
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


# class AccountUpdate(CustomBaseModel):
#     email: str | None = None
#     first_name: str | None = None
#     middle_name: str | None = None
#     last_name: str | None = None
#     date_of_birth: date | None = None



# Base model with COMMON fields for ALL user types
class BaseAccountUpdate(CustomBaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = None
    middle_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    password: Optional[str] = None
    
    @validator('email')
    def validate_email(cls, v):
        if v and '@' not in v:
            raise ValueError('Invalid email format')
        return v.lower() if v else v

# Pregnant Woman specific update model
class PregnantWomanUpdate(BaseAccountUpdate):
    # PregnantWoman specific fields (EXACTLY from your database)
    due_date: Optional[date] = None
    pregnancy_stage: Optional[str] = None
    pregnancy_week: Optional[int] = None
    expected_due_date: Optional[date] = None
    baby_date_of_birth: Optional[date] = None
    blood_type: Optional[str] = None
    allergies: Optional[list[str]] = None
    diet_preferences: Optional[list[str]] = None
    medical_conditions: Optional[str] = None
    
    @validator('pregnancy_week')
    def validate_pregnancy_week(cls, v):
        if v is not None and (v < 1 or v > 42):
            raise ValueError('Pregnancy week must be between 1 and 42')
        return v
    
    @validator('blood_type')
    def validate_blood_type(cls, v):
        if v and v.upper() not in ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']:
            raise ValueError('Invalid blood type')
        return v.upper() if v else v

# Volunteer Doctor update model
class VolunteerDoctorUpdate(BaseAccountUpdate):
    # VolunteerDoctor has no additional fields in your database that need updating
    # But you could add validation for future fields
    pass

# Nutritionist update model  
class NutritionistUpdate(BaseAccountUpdate):
    # Nutritionist has no additional fields in your database that need updating
    pass

# Merchant update model
class MerchantUpdate(BaseAccountUpdate):
    # Merchant has no additional fields in your database that need updating
    pass

# Union type for service method
AccountUpdateType = PregnantWomanUpdate | VolunteerDoctorUpdate | NutritionistUpdate | MerchantUpdate


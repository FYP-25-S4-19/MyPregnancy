from datetime import date, datetime
from uuid import UUID

from app.core.custom_base_model import CustomBaseModel


class UserModel(CustomBaseModel):
    id: UUID
    name: str
    created_at: datetime
    is_active: bool


class DoctorModel(UserModel):
    mcr_no: str


class MotherModel(UserModel):
    due_date: date | None
    date_of_birth: date


class MerchantModel(UserModel):
    pass


class UserEditRequestModel(CustomBaseModel):
    is_active: bool


class DoctorSpecialisationModel(CustomBaseModel):
    id: int
    specialisation: str


class CreateDoctorSpecialisationRequest(CustomBaseModel):
    specialisation: str


class UpdateDoctorSpecialisationRequest(CustomBaseModel):
    specialisation: str

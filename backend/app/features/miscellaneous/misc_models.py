from uuid import UUID

from pydantic import Field

from app.core.custom_base_model import CustomBaseModel


class DoctorSpecializationModel(CustomBaseModel):
    id: int
    specialisation: str


class CreateDoctorSpecializationRequest(CustomBaseModel):
    specialisation: str


class UpdateDoctorSpecializationRequest(CustomBaseModel):
    specialisation: str


class DoctorRatingRequest(CustomBaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating value between 1 and 5")


class DoctorRatingResponse(CustomBaseModel):
    has_rating: bool


class DoctorPreviewData(CustomBaseModel):
    doctor_id: UUID
    profile_img_url: str | None
    first_name: str
    specialisation: str
    is_liked: bool


class DoctorsPaginatedResponse(CustomBaseModel):
    doctors: list[DoctorPreviewData]
    next_cursor: str | None
    has_more: bool

from uuid import UUID

from app.core.custom_base_model import CustomBaseModel


class DoctorPreviewData(CustomBaseModel):
    doctor_id: UUID
    profile_img_url: str | None
    first_name: str
    is_liked: bool

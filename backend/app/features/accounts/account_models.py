from datetime import datetime

from app.core.custom_base_model import CustomBaseModel


class AccountCreationRequestView(CustomBaseModel):
    first_name: str
    middle_name: str | None = None
    last_name: str
    qualification_img_url: str
    user_role: str
    submitted_at: datetime


class RejectAccountCreationRequestReason(CustomBaseModel):
    reject_reason: str

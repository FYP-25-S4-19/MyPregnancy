from uuid import UUID

from app.core.custom_base_model import CustomBaseModel


class TokenResponse(CustomBaseModel):
    token: str


class ChannelCreationArgs(CustomBaseModel):
    doctor_id: UUID


class ChannelCreationResponse(CustomBaseModel):
    channel_id: str

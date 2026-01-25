from uuid import UUID

from app.core.custom_base_model import CustomBaseModel


# =============================================================
class NotifyThreadLikeRequest(CustomBaseModel):
    user_id: UUID
    thread_id: int


# =============================================================
# =============================================================
# =============================================================
# =============================================================
class ExpoPushTokenInsert(CustomBaseModel):
    token: str


class ExpoNotificationContent(CustomBaseModel):
    to: str
    title: str
    body: str
    data: dict | None = None


# =============================================================
class AppNotificationCreateBase(CustomBaseModel):
    recipient_id: UUID


class ThreadLikeAppNotificationCreate(CustomBaseModel):
    thread_id: int


# =============================================================
# Response Models
# =============================================================


class AppNotificationResponse(CustomBaseModel):
    id: int
    recipient_id: str
    content: str
    sent_at: str
    is_seen: bool
    type: str
    data: dict


class AppNotificationListResponse(CustomBaseModel):
    notifications: list[AppNotificationResponse]

from app.core.custom_base_model import CustomBaseModel
from app.db.db_schema import NotificationType


# DTO for the Expo notification payload
class ExpoNotification(CustomBaseModel):
    to: str  # Expo push token
    title: str
    body: str
    data: dict | None = None


# Notification model used internally for our app
class AppNotification(CustomBaseModel):
    id: int
    type: NotificationType

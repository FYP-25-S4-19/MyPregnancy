from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.core.users_manager import current_active_user
from app.db.db_config import get_db
from app.db.db_schema import Admin, User
from app.features.notifications.notification_models import (
    AppNotificationCreateBase,
    AppNotificationListResponse,
    ExpoPushTokenInsert,
    ThreadLikeAppNotificationCreate,
)
from app.features.notifications.notification_service import NotificationService

notification_router = APIRouter(prefix="/notifications", tags=["Notifications"])


def get_notification_service(db: AsyncSession = Depends(get_db)) -> NotificationService:
    return NotificationService(db)


@notification_router.get("", response_model=AppNotificationListResponse)
async def get_notifications(
    user: User = Depends(current_active_user),
    service: NotificationService = Depends(get_notification_service),
    limit: int = 50,
    offset: int = 0,
) -> AppNotificationListResponse:
    """Fetch notifications for the current user."""
    notifications = await service.get_user_notifications(user.id, limit=limit, offset=offset)
    return AppNotificationListResponse(notifications=notifications)


@notification_router.patch("/{notification_id}/seen", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notification_seen(
    notification_id: int,
    user: User = Depends(current_active_user),
    service: NotificationService = Depends(get_notification_service),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Mark a notification as seen."""
    try:
        await service.mark_notification_as_seen(notification_id, user.id)
        await db.commit()
    except Exception:
        await db.rollback()
        raise


@notification_router.patch("/upsert", status_code=status.HTTP_204_NO_CONTENT)
async def upsert_push_token(
    req: ExpoPushTokenInsert,
    user: User = Depends(current_active_user),
    service: NotificationService = Depends(get_notification_service),
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await service.upsert_push_token(req.token, user)
        await db.commit()
    except Exception:
        await db.rollback()
        raise


@notification_router.post("/thread/like", status_code=status.HTTP_204_NO_CONTENT)
async def notify_thread_like(
    req: ThreadLikeAppNotificationCreate,
    service: NotificationService = Depends(get_notification_service),
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        await service.notify_thread_like(req)
        await db.commit()
    except Exception:
        await db.rollback()
        raise


@notification_router.post("/", status_code=status.HTTP_204_NO_CONTENT)
async def send_to_all(
    _: Admin = Depends(require_role(Admin)), service: NotificationService = Depends(get_notification_service)
) -> None:
    await service.send_to_all()

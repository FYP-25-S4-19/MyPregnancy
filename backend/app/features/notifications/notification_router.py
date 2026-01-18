from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.core.users_manager import current_active_user
from app.db.db_config import get_db
from app.db.db_schema import Admin, ExpoPushToken, User
from app.features.notifications.notification_models import ExpoPushTokenInsert
from app.features.notifications.notification_service import NotificationService

notification_router = APIRouter(prefix="/notifications", tags=["Notifications"])


def get_notification_service(db: AsyncSession = Depends(get_db)) -> NotificationService:
    return NotificationService(db)


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
    except Exception as e:
        await db.rollback()
        raise e


@notification_router.post("/", status_code=status.HTTP_204_NO_CONTENT)
async def send_to_all(
    _: Admin = Depends(require_role(Admin)), service: NotificationService = Depends(get_notification_service)
) -> None:
    await service.send_to_all()

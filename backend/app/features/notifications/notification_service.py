import httpx
from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.db_schema import ExpoPushToken, User
from app.features.notifications.notification_models import ExpoNotification

EXPO_PUSH_URL: str = "https://exp.host/--/api/v2/push/send"
BATCH_SIZE: int = 100


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def insert_push_token(self, token: str, user: User) -> None:
        stmt = insert(ExpoPushToken).values(token=token, user_id=user.id)
        await self.db.execute(stmt)

    async def send_to_all(self):
        query_res = (await self.db.execute(select(ExpoPushToken))).scalars().all()
        async with httpx.AsyncClient() as client:
            for entry in query_res:
                payload = ExpoNotification(
                    to=entry.token,
                    title=f"Hi, {entry.user.first_name}!",
                    body=f"Log your symptoms today, {entry.user.first_name}!",
                )
                await client.post(EXPO_PUSH_URL, json=payload)

    def mass_send_notification(self, user_id: int, message: str) -> None:
        pass

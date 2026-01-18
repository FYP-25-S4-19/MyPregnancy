import httpx
from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.db_schema import ExpoPushToken, User
from app.features.notifications.notification_models import ExpoNotification

EXPO_PUSH_URL: str = "https://exp.host/--/api/v2/push/send"
BATCH_SIZE: int = 100


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upsert_push_token(self, token: str, user: User) -> None:
        token_exists = (
            await self.db.execute(select(ExpoPushToken).where(ExpoPushToken.token == token))
        ).scalar_one_or_none()
        if token_exists is not None:
            return

        stmt = insert(ExpoPushToken).values(token=token, user_id=user.id)
        await self.db.execute(stmt)

    async def send_to_all(self):
        stmt = select(ExpoPushToken).options(selectinload(ExpoPushToken.user))
        query_res = (await self.db.execute(stmt)).scalars().all()

        if not query_res:
            print("No push tokens found to send notifications")
            return

        print(f"Sending notifications to {len(query_res)} users")

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Build array of notifications
            notifications = []
            for entry in query_res:
                notification = {
                    "to": entry.token,
                    "title": f"Hi, {entry.user.first_name}!",
                    "body": f"Log your symptoms today, {entry.user.first_name}!",
                }
                notifications.append(notification)
            print(f"Sending {len(notifications)} notifications")
            print(f"Payload: {notifications}")

            try:
                response = await client.post(EXPO_PUSH_URL, json=notifications)

                print(f"Response status: {response.status_code}")

                if response.status_code != 200:
                    print(f"Failed to send notifications. Status: {response.status_code}, Response: {response.text}")
                    return

                response_data = response.json()
                print(f"Expo response: {response_data}")

                # Check if Expo returned errors in the response body
                if isinstance(response_data, dict):
                    if response_data.get("errors"):
                        print(f"Expo API errors: {response_data.get('errors')}")
                    else:
                        # Check individual notification results
                        data = response_data.get("data", [])
                        success_count = 0
                        error_count = 0
                        for idx, result in enumerate(data):
                            if result.get("status") == "error":
                                error_count += 1
                                print(f"Notification {idx} failed: {result.get('message')}")
                            else:
                                success_count += 1
                        print(f"Sent {success_count} notifications successfully, {error_count} failed")

            except httpx.RequestError as e:
                print(f"Network error sending notifications: {str(e)}")
            except httpx.HTTPStatusError as e:
                print(f"HTTP error sending notifications: {e.response.status_code} - {e.response.text}")
            except Exception as e:
                print(f"Unexpected error sending notifications: {str(e)}")

        print("Notification sending completed")

    def mass_send_notification(self, user_id: int, message: str) -> None:
        pass

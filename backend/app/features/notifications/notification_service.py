import json
from datetime import datetime
from uuid import UUID

import httpx
from fastapi import HTTPException, status
from sqlalchemy import insert, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.db_schema import CommunityThread, ExpoPushToken, Notification, NotificationType, User
from app.features.notifications.notification_helpers import get_rand_thread_like_notif
from app.features.notifications.notification_models import (
    AppNotificationResponse,
    ExpoNotificationContent,
    ThreadLikeAppNotificationCreate,
)

EXPO_PUSH_URL: str = "https://exp.host/--/api/v2/push/send"
BATCH_SIZE: int = 100


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def upsert_push_token(self, token: str, user: User) -> None:
        token_exists = (
            await self.db.execute(select(ExpoPushToken).where(ExpoPushToken.token == token))
        ).scalar_one_or_none()
        if token_exists:
            print(f"Push token {token_exists.token} already exists, no need to upsert")
            return
        stmt = insert(ExpoPushToken).values(token=token, user_id=user.id)
        await self.db.execute(stmt)

    async def notify_thread_like(self, req: ThreadLikeAppNotificationCreate) -> None:
        thread_stmt = (
            select(CommunityThread)
            .options(selectinload(CommunityThread.creator))
            .where(CommunityThread.id == req.thread_id)
        )
        thread = (await self.db.execute(thread_stmt)).scalar_one_or_none()
        if thread is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found")

        push_token = await self._get_user_push_token(thread.creator_id)
        if push_token is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Push token not found for the recipient")

        notif_data = get_rand_thread_like_notif(thread.title)
        expo_notif = ExpoNotificationContent(to=push_token, title=notif_data.title, body=notif_data.body, data={})

        # If this line fails, then (by right) the next line where we insert the notifications into the
        # table should not execute - since there will be an exception thrown
        await self._mass_send_notifications([expo_notif])

        # Serialize thread_id into the data field
        notification_data = {"thread_id": req.thread_id}

        insert_notif_stmt = insert(Notification).values(
            recipient_id=thread.creator_id,
            content=expo_notif.body,
            sent_at=datetime.now(),
            is_seen=False,
            type=NotificationType.THREAD_LIKE,
            data=json.dumps(notification_data),
        )
        await self.db.execute(insert_notif_stmt)

    async def get_user_notifications(
        self, user_id: UUID, limit: int = 50, offset: int = 0
    ) -> list[AppNotificationResponse]:
        stmt = (
            select(Notification)
            .where(Notification.recipient_id == user_id)
            .order_by(Notification.sent_at.desc())
            .limit(limit)
            .offset(offset)
        )
        notifications = (await self.db.execute(stmt)).scalars().all()

        result = []
        for notif in notifications:
            result.append(
                AppNotificationResponse(
                    id=notif.id,
                    recipient_id=str(notif.recipient_id),
                    content=notif.content,
                    sent_at=notif.sent_at.isoformat(),
                    is_seen=notif.is_seen,
                    type=notif.type.value,
                    data=json.loads(notif.data) if notif.data else {},
                )
            )

        return result

    async def mark_notification_as_seen(self, notification_id: int, user_id: UUID) -> None:
        stmt = (
            select(Notification).where(Notification.id == notification_id).where(Notification.recipient_id == user_id)
        )
        notification = (await self.db.execute(stmt)).scalar_one_or_none()

        if notification is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found or you don't have permission to access it",
            )

        notification.is_seen = True

    async def send_to_all(self):
        stmt = select(ExpoPushToken).options(selectinload(ExpoPushToken.user))
        query_res = (await self.db.execute(stmt)).scalars().all()

        if not query_res:
            print("No push tokens found to send notifications")
            return

        print(f"Sending notifications to {len(query_res)} users")

        async with httpx.AsyncClient(timeout=30.0) as client:
            notifications = []  # Build array of notitifications
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

    async def _get_user_push_token(self, user_id: UUID) -> str | None:
        stmt = select(ExpoPushToken).where(ExpoPushToken.user_id == user_id)
        token_obj = (await self.db.execute(stmt)).scalar_one_or_none()
        return token_obj.token if token_obj else None

    async def _mass_send_notifications(self, all_notification_data: list[ExpoNotificationContent]) -> None:
        async with httpx.AsyncClient(timeout=30.0) as client:
            all_notifs_to_send = []
            for notif_data in all_notification_data:
                notif_to_send = {
                    "to": notif_data.to,
                    "title": notif_data.title,
                    "body": notif_data.body,
                    "data": notif_data.data if notif_data.data else {},
                }
                all_notifs_to_send.append(notif_to_send)
            print(f"Sending {len(all_notifs_to_send)} notifications")
            print(f"Payload: {all_notifs_to_send}")

            try:
                response = await client.post(EXPO_PUSH_URL, json=all_notifs_to_send)

                print(f"Response status: {response.status_code}")

                if response.status_code != status.HTTP_200_OK:
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

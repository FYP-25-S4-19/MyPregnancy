from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status
from stream_chat import StreamChat
from stream_chat.channel import Channel
from stream_chat.types.stream_response import StreamResponse

from app.db.db_schema import PregnantWoman, User, VolunteerDoctor
from app.features.getstream.stream_models import (
    ChannelCreationArgs,
    ChannelCreationResponse,
    GenericChannelCreationArgs,
    TokenResponse,
)
from app.shared.utils import format_user_fullname


class StreamService:
    def __init__(self, db: AsyncSession, client: StreamChat):
        self.db = db
        self.client = client

    async def get_stream_token(self, user: User) -> TokenResponse:
        self.client.upsert_user({"id": str(user.id), "name": format_user_fullname(user)})
        stream_token: str = self.client.create_token(str(user.id))
        return TokenResponse(token=stream_token)

    async def create_chat_channel(self, args: ChannelCreationArgs, mother: PregnantWoman) -> ChannelCreationResponse:
        doctor = await self.db.get(VolunteerDoctor, args.doctor_id)
        if doctor is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Could not find doctor with ID")

        doctor_id = str(doctor.id)
        mother_id = str(mother.id)
        self.client.upsert_users(
            [
                {"id": doctor_id, "name": format_user_fullname(doctor)},
                {"id": mother_id, "name": format_user_fullname(mother)},
            ]
        )
        sorted_members: list[str] = sorted([doctor_id, mother_id])
        channel: Channel = self.client.channel(
            "messaging",
            data=dict(members=sorted_members),
        )
        res: StreamResponse = channel.create(mother_id)
        channel_id: str = res["channel"]["cid"]
        return ChannelCreationResponse(channel_id=channel_id)

    async def create_generic_chat_channel(
        self, args: GenericChannelCreationArgs, current_user: User
    ) -> ChannelCreationResponse:
        """
        Generic channel creation that works for any user type (doctor or mother).
        Creates a channel between the current user and the other_user_id.
        """
        # Fetch the other user
        other_user = await self.db.get(User, args.other_user_id)
        if other_user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Could not find specified user")

        current_user_id = str(current_user.id)
        other_user_id = str(other_user.id)

        # Upsert both users
        self.client.upsert_users(
            [
                {"id": current_user_id, "name": format_user_fullname(current_user)},
                {"id": other_user_id, "name": format_user_fullname(other_user)},
            ]
        )

        # Create channel with sorted member IDs to ensure consistency
        sorted_members: list[str] = sorted([current_user_id, other_user_id])
        channel: Channel = self.client.channel(
            "messaging",
            data=dict(members=sorted_members),
        )
        res: StreamResponse = channel.create(current_user_id)
        channel_id: str = res["channel"]["cid"]
        return ChannelCreationResponse(channel_id=channel_id)

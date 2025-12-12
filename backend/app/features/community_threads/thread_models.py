from datetime import datetime
from uuid import UUID

from app.core.custom_base_model import CustomBaseModel


class ThreadPreviewData(CustomBaseModel):
    id: int
    creator_name: str
    title: str
    content: str
    posted_at: str


class ThreadCommentData(CustomBaseModel):
    id: int

    thread_id: int
    commenter_id: UUID
    commenter_fullname: str

    commented_at: datetime
    content: str


class ThreadData(CustomBaseModel):
    id: int

    creator_id: UUID
    creator_fullname: str

    title: str
    content: str
    posted_at: datetime

    comments: list[ThreadCommentData]


class CreateThreadData(CustomBaseModel):
    title: str
    content: str


class ThreadUpdateData(CustomBaseModel):
    title: str
    content: str

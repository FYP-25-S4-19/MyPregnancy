from datetime import datetime
from uuid import UUID

from app.core.custom_base_model import CustomBaseModel


class ThreadCategoryData(CustomBaseModel):
    id: int
    label: str


class ThreadPreviewData(CustomBaseModel):
    id: int
    creator_name: str
    title: str
    content: str
    posted_at: str
    categories: list[ThreadCategoryData] = []
    like_count: int = 0
    comment_count: int = 0
    is_liked_by_current_user: bool = False


class ThreadCommentData(CustomBaseModel):
    id: int

    thread_id: int
    commenter_id: UUID
    commenter_fullname: str

    commented_at: datetime
    content: str
    like_count: int = 0
    is_liked_by_current_user: bool = False


class ThreadData(CustomBaseModel):
    id: int

    creator_id: UUID
    creator_fullname: str

    title: str
    content: str
    posted_at: datetime

    like_count: int = 0
    is_liked_by_current_user: bool = False

    comments: list[ThreadCommentData]


class CreateThreadData(CustomBaseModel):
    title: str
    content: str


class ThreadUpdateData(CustomBaseModel):
    title: str
    content: str


class CreateCommentData(CustomBaseModel):
    content: str


class UpdateCommentData(CustomBaseModel):
    content: str

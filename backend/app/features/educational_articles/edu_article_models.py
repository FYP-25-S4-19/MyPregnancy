from uuid import UUID

from app.core.custom_base_model import CustomBaseModel


class ArticleOverviewResponse(CustomBaseModel):
    id: int
    title: str


class ArticleDetailedResponse(CustomBaseModel):
    id: int
    author_id: UUID
    author: str
    category: str
    img_key: str | None
    title: str
    content_markdown: str

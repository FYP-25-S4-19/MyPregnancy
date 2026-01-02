from uuid import UUID
from typing import Optional

from app.core.custom_base_model import CustomBaseModel


class ArticlePreviewData(CustomBaseModel):
    id: int
    title: str


class ArticleOverviewResponse(CustomBaseModel):
    id: int
    title: str
    category: str
    excerpt: str


class ArticleDetailedResponse(CustomBaseModel):
    id: int
    author_id: Optional [UUID] = None
    author: str
    category: str
    img_key: str | None
    title: str
    content_markdown: str

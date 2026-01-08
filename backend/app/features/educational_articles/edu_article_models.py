from typing import Optional
from uuid import UUID

from app.core.custom_base_model import CustomBaseModel


class ArticlePreviewData(CustomBaseModel):
    id: int
    title: str


class ArticleOverviewResponse(CustomBaseModel):
    id: int
    title: str
    category: str
    excerpt: str
    trimester: int


class ArticleDetailedResponse(CustomBaseModel):
    id: int
    author_id: Optional[UUID] = None
    author: str
    category: str
    img_key: str | None
    title: str
    content_markdown: str
    trimester: int


class EduArticleCategoryModel(CustomBaseModel):
    id: int
    label: str


class CreateEduArticleCategoryRequest(CustomBaseModel):
    label: str


class UpdateEduArticleCategoryRequest(CustomBaseModel):
    label: str

from datetime import datetime
from typing import Optional
from uuid import UUID

from app.core.custom_base_model import CustomBaseModel


class ArticlePreviewData(CustomBaseModel):
    id: int
    title: str


class MyArticlePreviewData(CustomBaseModel):
    id: int
    title: str
    author: str
    category: str
    trimester: int
    created_at: datetime
    author_id: Optional[UUID] = None


class ArticleOverviewResponse(CustomBaseModel):
    id: int
    title: str
    category: str
    excerpt: str
    trimester: int


class UpdateArticleRequest(CustomBaseModel):
    category_id: Optional[int] = None
    title: Optional[str] = None
    content_markdown: Optional[str] = None
    trimester: Optional[int] = None


class ArticleDetailedResponse(CustomBaseModel):
    id: int
    author_id: Optional[UUID] = None
    author: str
    category: str
    title: str
    content_markdown: str
    trimester: int
    created_at: Optional[datetime] = None


class EduArticleCategoryModel(CustomBaseModel):
    id: int
    label: str


class CreateEduArticleCategoryRequest(CustomBaseModel):
    label: str


class UpdateEduArticleCategoryRequest(CustomBaseModel):
    label: str

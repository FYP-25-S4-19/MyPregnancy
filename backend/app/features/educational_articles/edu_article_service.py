from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.db_schema import EduArticle, EduArticleCategory, VolunteerDoctor
from app.features.educational_articles.edu_article_models import (
    ArticleDetailedResponse,
    ArticleOverviewResponse,
    ArticlePreviewData,
)
from app.shared.s3_storage_interface import S3StorageInterface
from app.shared.utils import format_user_fullname


class EduArticleService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_article_categories(self) -> list[str]:
        return [cat.value for cat in list(EduArticleCategory)]

    async def get_article_previews(self, limit: int) -> list[ArticlePreviewData]:
        stmt = select(EduArticle).order_by(func.random()).limit(limit)
        result = (await self.db.execute(stmt)).scalars().all()
        return [ArticlePreviewData(id=article.id, title=article.title) for article in result]

    async def get_article_overviews_by_category(self, category: str) -> list[ArticleOverviewResponse]:
        if category not in [cat.value for cat in list(EduArticleCategory)]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST)

        query = select(EduArticle.id, EduArticle.title).where(EduArticle.category == category)
        result = await self.db.execute(query)
        article_overviews = result.mappings().all()

        return [ArticleOverviewResponse(id=ao.id, title=ao.title) for ao in article_overviews]

    async def get_article_detailed(self, article_id: int) -> ArticleDetailedResponse:
        # Use selectinload to eagerly load the author relationship
        query = select(EduArticle).options(selectinload(EduArticle.author)).where(EduArticle.id == article_id)
        result = await self.db.execute(query)
        article = result.scalars().first()

        if article is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        author: VolunteerDoctor = article.author
        return ArticleDetailedResponse(
            id=article.id,
            author_id=article.author_id,
            author=format_user_fullname(author),
            category=article.category.value,
            img_key=None,
            title=article.title,
            content_markdown=article.content_markdown,
        )

    async def create_article(
        self, category: str, title: str, content_markdown: str, img_data: UploadFile, doctor: VolunteerDoctor
    ) -> EduArticle | None:
        query = select(EduArticle).where(EduArticle.title == title)
        result = await self.db.execute(query)
        existing_articles = result.scalars().all()

        if len(existing_articles) > 0:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT)

        article = EduArticle(
            author_id=doctor.id,
            category=category,
            img_key=None,
            title=title,
            content_markdown=content_markdown,
        )
        self.db.add(article)
        await self.db.flush()

        article_img_key: str | None = S3StorageInterface.put_article_img(article.id, img_data)
        article.img_key = article_img_key
        return article

    async def delete_article(self, article_id: int, deleter: VolunteerDoctor) -> None:
        article = await self.db.get(EduArticle, article_id)
        if article is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        if article.author_id != deleter.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
        await self.db.delete(article)

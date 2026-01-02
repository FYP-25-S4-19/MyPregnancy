import re

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


def _strip_markdown(md: str) -> str:
    s = md or ""
    s = re.sub(r"```[\s\S]*?```", " ", s)
    s = re.sub(r"`[^`]*`", " ", s)
    s = re.sub(r"!\[[^\]]*\]\([^)]+\)", " ", s)
    s = re.sub(r"\[[^\]]*\]\([^)]+\)", " ", s)
    s = re.sub(r"^>\s?", "", s, flags=re.MULTILINE)
    s = re.sub(r"^#{1,6}\s+", "", s, flags=re.MULTILINE)
    s = re.sub(r"[*_~]", "", s)
    s = re.sub(r"^\s*[-+*]\s+", "", s, flags=re.MULTILINE)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _make_excerpt(content: str, max_chars: int = 140) -> str:
    cleaned = _strip_markdown(content)
    if not cleaned:
        return "Quick tips and guidance for your pregnancy journey."

    parts = [p for p in re.split(r"(?<=[.!?])\s+", cleaned) if p]
    excerpt = " ".join(parts[:2]).strip() or cleaned

    if len(excerpt) > max_chars:
        excerpt = excerpt[:max_chars].rstrip() + "…"
    return excerpt


class EduArticleService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_article_categories(self) -> list[str]:
        return [c.value for c in EduArticleCategory]

    async def get_article_previews(self, limit: int) -> list[ArticlePreviewData]:
        if limit <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST)

        query = select(EduArticle.id, EduArticle.title).order_by(EduArticle.id.desc()).limit(limit)
        result = await self.db.execute(query)
        rows = result.mappings().all()
        return [ArticlePreviewData(id=row["id"], title=row["title"]) for row in rows]

    async def get_article_overviews_by_category(self, category: str) -> list[ArticleOverviewResponse]:
        valid = {c.value for c in EduArticleCategory}
        if category not in valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST)

        query = (
            select(
                EduArticle.id,
                EduArticle.title,
                EduArticle.category,
                EduArticle.content_markdown,
            )
            .where(EduArticle.category == EduArticleCategory(category))
            .order_by(EduArticle.id.desc())
        )

        result = await self.db.execute(query)
        rows = result.mappings().all()

        return [
            ArticleOverviewResponse(
                id=row["id"],
                title=row["title"],
                category=row["category"].value if hasattr(row["category"], "value") else str(row["category"]),
                excerpt=_make_excerpt(row["content_markdown"] or ""),
            )
            for row in rows
        ]

    async def get_article_detailed(self, article_id: int) -> ArticleDetailedResponse:
        query = select(EduArticle).options(selectinload(EduArticle.author)).where(EduArticle.id == article_id)
        result = await self.db.execute(query)
        article = result.scalars().first()

        if article is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

        author_obj = article.author
        author_name = "Unknown author"
        if author_obj is not None:
            author_name = format_user_fullname(author_obj)

        return ArticleDetailedResponse(
            id=article.id,
            author_id=article.author_id,
            author=author_name,
            category=article.category.value,
            img_key=article.img_key,
            title=article.title,
            content_markdown=article.content_markdown,
        )

    async def create_article(
        self, category: str, title: str, content_markdown: str, img_data: UploadFile, doctor: VolunteerDoctor
    ) -> EduArticle:
        valid = {c.value for c in EduArticleCategory}
        if category not in valid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST)

        cleaned_title = (title or "").strip()
        if not cleaned_title:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST)

        dup_q = select(EduArticle.id).where(func.lower(EduArticle.title) == func.lower(cleaned_title))
        dup = (await self.db.execute(dup_q)).first()
        if dup is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT)

        article = EduArticle(
            author_id=doctor.id,
            category=EduArticleCategory(category),
            img_key=None,
            title=cleaned_title,
            content_markdown=content_markdown or "",
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

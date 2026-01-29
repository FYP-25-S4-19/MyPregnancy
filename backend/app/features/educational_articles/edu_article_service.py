import re

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.db_schema import EduArticle, EduArticleCategory, User
from app.features.educational_articles.edu_article_models import (
    ArticleDetailedResponse,
    ArticleOverviewResponse,
    ArticlePreviewData,
    EduArticleCategoryModel,
)
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
        query = select(EduArticleCategory).order_by(EduArticleCategory.label)
        result = await self.db.execute(query)
        categories = result.scalars().all()
        return [cat.label for cat in categories]

    async def get_article_previews(self, limit: int) -> list[ArticlePreviewData]:
        if limit <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST)

        query = select(EduArticle.id, EduArticle.title).order_by(EduArticle.created_at.desc()).limit(limit)
        result = await self.db.execute(query)
        rows = result.mappings().all()
        return [ArticlePreviewData(id=row["id"], title=row["title"]) for row in rows]

    async def get_article_overviews_by_category(self, category: str) -> list[ArticleOverviewResponse]:
        # Check if category exists
        cat_query = select(EduArticleCategory).where(EduArticleCategory.label == category)
        cat_result = await self.db.execute(cat_query)
        cat_obj = cat_result.scalars().first()
        if not cat_obj:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST)

        query = (
            select(
                EduArticle.id,
                EduArticle.title,
                EduArticleCategory.label,
                EduArticle.content_markdown,
                EduArticle.trimester,
            )
            .join(EduArticleCategory)
            .where(EduArticle.category_id == cat_obj.id)
            .order_by(EduArticle.created_at.desc())
        )

        result = await self.db.execute(query)
        rows = result.mappings().all()

        return [
            ArticleOverviewResponse(
                id=row["id"],
                title=row["title"],
                category=row["label"],
                excerpt=_make_excerpt(row["content_markdown"] or ""),
                trimester=row["trimester"],
            )
            for row in rows
        ]

    async def get_article_detailed(self, article_id: int) -> ArticleDetailedResponse:
        query = (
            select(EduArticle)
            .options(selectinload(EduArticle.author), selectinload(EduArticle.category))
            .where(EduArticle.id == article_id)
        )
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
            category=article.category.label,
            title=article.title,
            content_markdown=article.content_markdown,
            trimester=article.trimester,
        )

    async def create_article(
        self,
        category_id: int,
        title: str,
        content_markdown: str,
        trimester: int,
        author: User,
    ) -> EduArticle:
        # Check if category exists
        cat_query = select(EduArticleCategory).where(EduArticleCategory.id == category_id)
        cat_result = await self.db.execute(cat_query)
        cat_obj = cat_result.scalars().first()
        if not cat_obj:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category not found")

        cleaned_title = (title or "").strip()
        if not cleaned_title:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required")

        if trimester < 1 or trimester > 3:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Trimester must be 1, 2, or 3")

        dup_q = select(EduArticle.id).where(func.lower(EduArticle.title) == func.lower(cleaned_title))
        dup = (await self.db.execute(dup_q)).first()
        if dup is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Article with this title already exists")

        article = EduArticle(
            author_id=author.id,
            category_id=category_id,
            title=cleaned_title,
            content_markdown=content_markdown or "",
            trimester=trimester,
        )

        self.db.add(article)
        await self.db.flush()

        # Note: Articles no longer support images
        return article

    async def delete_article(self, article_id: int, deleter: User) -> None:
        article = await self.db.get(EduArticle, article_id)
        if article is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        if article.author_id != deleter.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own articles")
        await self.db.delete(article)

    async def get_my_articles(self, author: User) -> list[EduArticle]:
        """Fetch all articles created by the current user"""
        query = (
            select(EduArticle)
            .options(selectinload(EduArticle.author), selectinload(EduArticle.category))
            .where(EduArticle.author_id == author.id)
            .order_by(EduArticle.created_at.desc())
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_article(
        self,
        article_id: int,
        author: User,
        category_id: int | None = None,
        title: str | None = None,
        content_markdown: str | None = None,
        trimester: int | None = None,
    ) -> EduArticle:
        """Update an article (only by its author)"""
        article_stmt = (
            select(EduArticle)
            .options(selectinload(EduArticle.author), selectinload(EduArticle.category))
            .where(EduArticle.id == article_id)
        )
        article = (await self.db.execute(article_stmt)).scalar_one_or_none()
        if article is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
        if article.author_id != author.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own articles")

        # Validate and update category if provided
        if category_id is not None:
            cat_query = select(EduArticleCategory).where(EduArticleCategory.id == category_id)
            cat_result = await self.db.execute(cat_query)
            cat_obj = cat_result.scalars().first()
            if not cat_obj:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category not found")
            article.category_id = category_id

        # Validate and update title if provided
        if title is not None:
            cleaned_title = title.strip()
            if not cleaned_title:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title cannot be empty")

            # Check for duplicate title (excluding current article)
            dup_q = select(EduArticle.id).where(
                func.lower(EduArticle.title) == func.lower(cleaned_title), EduArticle.id != article_id
            )
            dup = (await self.db.execute(dup_q)).first()
            if dup is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT, detail="Article with this title already exists"
                )
            article.title = cleaned_title

        # Validate and update trimester if provided
        if trimester is not None:
            if trimester < 1 or trimester > 3:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Trimester must be 1, 2, or 3")
            article.trimester = trimester

        # Update content if provided
        if content_markdown is not None:
            article.content_markdown = content_markdown

        # Note: Articles no longer support images (img_data parameter ignored)
        await self.db.flush()
        return article

    async def get_all_categories(self) -> list[EduArticleCategoryModel]:
        query = select(EduArticleCategory).order_by(EduArticleCategory.label)
        result = await self.db.execute(query)
        categories = result.scalars().all()
        return [EduArticleCategoryModel(id=cat.id, label=cat.label) for cat in categories]

    async def create_category(self, label: str) -> EduArticleCategoryModel:
        # Check if category already exists
        query = select(EduArticleCategory).where(EduArticleCategory.label == label)
        result = await self.db.execute(query)
        existing = result.scalars().first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category already exists",
            )

        new_category = EduArticleCategory(label=label)
        self.db.add(new_category)
        await self.db.flush()

        return EduArticleCategoryModel(id=new_category.id, label=new_category.label)

    async def update_category(self, category_id: int, label: str) -> EduArticleCategoryModel:
        query = select(EduArticleCategory).where(EduArticleCategory.id == category_id)
        result = await self.db.execute(query)
        category = result.scalars().first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )

        # Check if new label already exists (and it's not the same category being updated)
        query = select(EduArticleCategory).where(EduArticleCategory.label == label)
        result = await self.db.execute(query)
        existing = result.scalars().first()
        if existing and existing.id != category_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category label already exists",
            )

        category.label = label
        await self.db.flush()

        return EduArticleCategoryModel(id=category.id, label=category.label)

    async def delete_category(self, category_id: int) -> None:
        query = select(EduArticleCategory).where(EduArticleCategory.id == category_id)
        result = await self.db.execute(query)
        category = result.scalars().first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )

        # Check if any articles have this category
        article_query = select(EduArticle).where(EduArticle.category_id == category_id)
        article_result = await self.db.execute(article_query)
        articles = article_result.scalars().all()
        if articles:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot delete category. {len(articles)} article(s) have this category.",
            )

        await self.db.delete(category)

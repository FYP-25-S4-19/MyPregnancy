from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.core.users_manager import current_active_user
from app.db.db_config import get_db
from app.db.db_schema import Admin, Nutritionist, User, VolunteerDoctor
from app.features.educational_articles.edu_article_models import (
    ArticleDetailedResponse,
    ArticleOverviewResponse,
    ArticlePreviewData,
    CreateEduArticleCategoryRequest,
    EduArticleCategoryModel,
    MyArticlePreviewData,
    UpdateEduArticleCategoryRequest,
)
from app.features.educational_articles.edu_article_service import EduArticleService

edu_articles_router = APIRouter(prefix="/articles", tags=["Educational Articles"])


def get_edu_articles_service(db: AsyncSession = Depends(get_db)) -> EduArticleService:
    return EduArticleService(db)


def _check_article_author(user: User) -> User:
    """Check if user is a doctor or nutritionist"""
    if not isinstance(user, (VolunteerDoctor, Nutritionist)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and nutritionists can create articles",
        )
    return user


@edu_articles_router.get("/categories", response_model=list[EduArticleCategoryModel])
async def get_article_categories(
    service: EduArticleService = Depends(get_edu_articles_service),
) -> list[EduArticleCategoryModel]:
    return await service.get_all_categories()


@edu_articles_router.get("/previews", response_model=list[ArticlePreviewData])
async def get_article_previews(
    limit: int, service: EduArticleService = Depends(get_edu_articles_service)
) -> list[ArticlePreviewData]:
    return await service.get_article_previews(limit)


@edu_articles_router.get("", response_model=list[ArticleOverviewResponse])
async def get_article_overviews_by_category(
    category: str, service: EduArticleService = Depends(get_edu_articles_service)
):
    return await service.get_article_overviews_by_category(category)


@edu_articles_router.get("/my-articles", response_model=list[MyArticlePreviewData])
async def get_my_articles(
    user: User = Depends(current_active_user),
    service: EduArticleService = Depends(get_edu_articles_service),
) -> list[MyArticlePreviewData]:
    # Check if user is doctor or nutritionist
    _check_article_author(user)

    articles = await service.get_my_articles(user)
    from datetime import datetime as dt

    return [
        MyArticlePreviewData(
            id=article.id,
            title=article.title,
            author=f"{article.author.first_name} {article.author.last_name}" if article.author else "Unknown",
            category=article.category.label if article.category else "General",
            trimester=article.trimester,
            created_at=getattr(article, "created_at", dt.now()),
            author_id=article.author_id,
        )
        for article in articles
    ]


@edu_articles_router.get("/saved", response_model=list[ArticleOverviewResponse])
async def get_saved_articles(
    user: User = Depends(current_active_user),
    service: EduArticleService = Depends(get_edu_articles_service),
) -> list[ArticleOverviewResponse]:
    """Get all articles saved by the current user"""
    return await service.get_saved_articles(user)


@edu_articles_router.get("/{article_id}", response_model=ArticleDetailedResponse)
async def get_article_detailed(
    article_id: int, service: EduArticleService = Depends(get_edu_articles_service)
) -> ArticleDetailedResponse:
    return await service.get_article_detailed(article_id)


@edu_articles_router.get("/{article_id}/is-saved", response_model=dict)
async def check_if_article_is_saved(
    article_id: int,
    user: User = Depends(current_active_user),
    service: EduArticleService = Depends(get_edu_articles_service),
) -> dict:
    """Check if the current user has saved this article"""
    is_saved = await service.is_article_saved(user, article_id)
    return {"is_saved": is_saved}


@edu_articles_router.post("/{article_id}/save", status_code=status.HTTP_201_CREATED)
async def save_article(
    article_id: int,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
    service: EduArticleService = Depends(get_edu_articles_service),
) -> dict:
    """Save an article for the current user"""
    try:
        await service.save_article(user, article_id)
        await db.commit()
        return {"message": "Article saved successfully"}
    except Exception:
        await db.rollback()
        raise


@edu_articles_router.delete("/{article_id}/save", status_code=status.HTTP_204_NO_CONTENT)
async def unsave_article(
    article_id: int,
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
    service: EduArticleService = Depends(get_edu_articles_service),
) -> None:
    """Unsave an article for the current user"""
    try:
        await service.unsave_article(user, article_id)
        await db.commit()
    except Exception:
        await db.rollback()
        raise


@edu_articles_router.post("", status_code=status.HTTP_201_CREATED)
async def create_article(
    category_id: int = Form(...),
    title: str = Form(...),
    content_markdown: str = Form(...),
    trimester: int = Form(...),
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
    service: EduArticleService = Depends(get_edu_articles_service),
) -> None:
    # Check if user is doctor or nutritionist
    _check_article_author(user)

    try:
        await service.create_article(category_id, title, content_markdown, trimester, user)
        await db.commit()
    except Exception:
        await db.rollback()
        raise


@edu_articles_router.put("/{article_id}", status_code=status.HTTP_200_OK)
async def update_article(
    article_id: int,
    category_id: int | None = Form(None),
    title: str | None = Form(None),
    content_markdown: str | None = Form(None),
    trimester: int | None = Form(None),
    user: User = Depends(current_active_user),
    db: AsyncSession = Depends(get_db),
    service: EduArticleService = Depends(get_edu_articles_service),
) -> ArticleDetailedResponse:
    # Check if user is doctor or nutritionist
    _check_article_author(user)

    try:
        updated_article = await service.update_article(
            article_id, user, category_id, title, content_markdown, trimester
        )
        await db.commit()

        return ArticleDetailedResponse(
            id=updated_article.id,
            author_id=updated_article.author_id,
            author=f"{updated_article.author.first_name} {updated_article.author.last_name}"
            if updated_article.author
            else "Unknown",
            category=updated_article.category.label if updated_article.category else "General",
            title=updated_article.title,
            content_markdown=updated_article.content_markdown,
            trimester=updated_article.trimester,
        )
    except Exception:
        await db.rollback()
        raise


@edu_articles_router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: int,
    user: User = Depends(current_active_user),
    service: EduArticleService = Depends(get_edu_articles_service),
    db: AsyncSession = Depends(get_db),
) -> None:
    # Check if user is doctor or nutritionist
    _check_article_author(user)

    try:
        await service.delete_article(article_id, user)
        await db.commit()
    except Exception:
        await db.rollback()
        raise


@edu_articles_router.post("/categories", response_model=EduArticleCategoryModel, status_code=status.HTTP_201_CREATED)
async def create_category(
    request: CreateEduArticleCategoryRequest,
    _: Admin = Depends(require_role(Admin)),
    db: AsyncSession = Depends(get_db),
    service: EduArticleService = Depends(get_edu_articles_service),
) -> EduArticleCategoryModel:
    try:
        result = await service.create_category(request.label.strip())
        await db.commit()
        return result
    except Exception:
        await db.rollback()
        raise


@edu_articles_router.patch("/admin/categories/{category_id}", response_model=EduArticleCategoryModel)
async def update_category(
    category_id: int,
    request: UpdateEduArticleCategoryRequest,
    _: Admin = Depends(require_role(Admin)),
    db: AsyncSession = Depends(get_db),
    service: EduArticleService = Depends(get_edu_articles_service),
) -> EduArticleCategoryModel:
    try:
        result = await service.update_category(category_id, request.label.strip())
        await db.commit()
        return result
    except Exception:
        await db.rollback()
        raise


@edu_articles_router.delete("/admin/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    _: Admin = Depends(require_role(Admin)),
    db: AsyncSession = Depends(get_db),
    service: EduArticleService = Depends(get_edu_articles_service),
) -> None:
    try:
        await service.delete_category(category_id)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

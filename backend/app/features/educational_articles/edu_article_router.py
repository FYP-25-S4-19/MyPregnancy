from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.db_config import get_db
from app.db.db_schema import VolunteerDoctor
from app.features.educational_articles.edu_article_models import (
    ArticleDetailedResponse,
    ArticleOverviewResponse,
    ArticlePreviewData,
)
from app.features.educational_articles.edu_article_service import EduArticleService

edu_articles_router = APIRouter(prefix="/articles", tags=["Educational Articles"])


def get_edu_articles_service(db: AsyncSession = Depends(get_db)) -> EduArticleService:
    return EduArticleService(db)


@edu_articles_router.get("/categories", response_model=list[str])
async def get_article_categories(
    service: EduArticleService = Depends(get_edu_articles_service),
) -> list[str]:
    return await service.get_article_categories()


@edu_articles_router.get("/previews", response_model=list[ArticlePreviewData])
async def get_article_previews(
    limit: int, service: EduArticleService = Depends(get_edu_articles_service)
) -> list[ArticlePreviewData]:
    return await service.get_article_previews(limit)


@edu_articles_router.get("/", response_model=list[ArticleOverviewResponse])
async def get_article_overviews_by_category(
    category: str, service: EduArticleService = Depends(get_edu_articles_service)
):
    return await service.get_article_overviews_by_category(category)


@edu_articles_router.get("/{article_id}", response_model=ArticleDetailedResponse)
async def get_article_detailed(
    article_id: int, service: EduArticleService = Depends(get_edu_articles_service)
) -> ArticleDetailedResponse:
    return await service.get_article_detailed(article_id)


@edu_articles_router.post("/", status_code=status.HTTP_201_CREATED)
async def create_article(
    category: str = Form(...),
    title: str = Form(...),
    content_markdown: str = Form(...),
    img_data: UploadFile = File(),
    db: AsyncSession = Depends(get_db),
    doctor: VolunteerDoctor = Depends(require_role(VolunteerDoctor)),
    service: EduArticleService = Depends(get_edu_articles_service),
) -> None:
    try:
        await service.create_article(category, title, content_markdown, img_data, doctor)
        await db.commit()
    except:
        await db.rollback()
        raise


@edu_articles_router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: int,
    service: EduArticleService = Depends(get_edu_articles_service),
    db: AsyncSession = Depends(get_db),
    deleter: VolunteerDoctor = Depends(require_role(VolunteerDoctor)),
) -> None:
    try:
        await service.delete_article(article_id, deleter)
        await db.commit()
    except:
        await db.rollback()
        raise

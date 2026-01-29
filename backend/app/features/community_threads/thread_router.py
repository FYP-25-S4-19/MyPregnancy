from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.users_manager import current_active_user, optional_current_active_user
from app.db.db_config import get_db
from app.db.db_schema import User
from app.features.community_threads.thread_models import (
    CreateCommentData,
    CreateThreadData,
    ThreadCategoryData,
    ThreadData,
    ThreadPreviewData,
    ThreadUpdateData,
    UpdateCommentData,
)
from app.features.community_threads.thread_service import ThreadService

community_threads_router = APIRouter(prefix="/threads", tags=["Community Threads"])


def get_threads_service(db: AsyncSession = Depends(get_db)) -> ThreadService:
    return ThreadService(db)


@community_threads_router.get("/categories", response_model=list[ThreadCategoryData])
async def get_thread_categories(service: ThreadService = Depends(get_threads_service)) -> list[ThreadCategoryData]:
    return await service.get_thread_categories()


@community_threads_router.get("/", response_model=list[ThreadPreviewData])
async def get_thread_previews(
    service: ThreadService = Depends(get_threads_service),
    current_user: User | None = Depends(optional_current_active_user),
) -> list[ThreadPreviewData]:
    return await service.get_thread_previews(current_user)


@community_threads_router.get("/my-threads", response_model=list[ThreadPreviewData])
async def get_my_threads(
    service: ThreadService = Depends(get_threads_service),
    current_user: User = Depends(current_active_user),
) -> list[ThreadPreviewData]:
    return await service.get_my_threads(current_user)


@community_threads_router.get("/{thread_id}", response_model=ThreadData)
async def get_thread_by_id(
    thread_id: int,
    service: ThreadService = Depends(get_threads_service),
    current_user: User | None = Depends(optional_current_active_user),
) -> ThreadData:
    return await service.get_thread_by_id(thread_id, current_user)


@community_threads_router.post("/", status_code=status.HTTP_201_CREATED)
async def create_thread(
    thread_data: CreateThreadData,
    service: ThreadService = Depends(get_threads_service),
    db: AsyncSession = Depends(get_db),
    creator: User = Depends(current_active_user),
) -> None:
    try:
        await service.create_thread(thread_data, creator)
        await db.commit()
    except:
        await db.rollback()
        raise


@community_threads_router.put("/{thread_id}", status_code=status.HTTP_200_OK)
async def update_thread(
    thread_id: int,
    thread_data: ThreadUpdateData,
    service: ThreadService = Depends(get_threads_service),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(current_active_user),
) -> None:
    try:
        await service.update_thread(thread_id, thread_data, current_user)
        await db.commit()
    except:
        await db.rollback()
        raise


@community_threads_router.delete("/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_thread(
    thread_id: int,
    service: ThreadService = Depends(get_threads_service),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(current_active_user),
) -> None:
    try:
        await service.delete_thread(thread_id, current_user)
        await db.commit()
    except:
        await db.rollback()
        raise


@community_threads_router.post("/{thread_id}/comments", status_code=status.HTTP_201_CREATED)
async def create_comment(
    thread_id: int,
    comment_data: CreateCommentData,
    service: ThreadService = Depends(get_threads_service),
    db: AsyncSession = Depends(get_db),
    commenter: User = Depends(current_active_user),
) -> None:
    try:
        new_comment = await service.create_comment(thread_id, comment_data, commenter)
        db.add(new_comment)
        await db.commit()
    except:
        await db.rollback()
        raise


@community_threads_router.put("/{thread_id}/comments/{comment_id}", status_code=status.HTTP_200_OK)
async def update_comment(
    comment_id: int,
    comment_data: UpdateCommentData,
    service: ThreadService = Depends(get_threads_service),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(current_active_user),
) -> None:
    try:
        await service.update_comment(comment_id, comment_data, current_user)
        await db.commit()
    except:
        await db.rollback()
        raise


@community_threads_router.delete("/{thread_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    service: ThreadService = Depends(get_threads_service),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(current_active_user),
) -> None:
    try:
        await service.delete_comment(comment_id, current_user)
        await db.commit()
    except:
        await db.rollback()
        raise


@community_threads_router.post("/{thread_id}/like", status_code=status.HTTP_201_CREATED)
async def like_thread(
    thread_id: int,
    service: ThreadService = Depends(get_threads_service),
    db: AsyncSession = Depends(get_db),
    liker: User = Depends(current_active_user),
) -> None:
    try:
        new_like = await service.like_thread(thread_id, liker)
        db.add(new_like)
        await db.commit()
    except:
        await db.rollback()
        raise


@community_threads_router.delete("/{thread_id}/unlike", status_code=status.HTTP_204_NO_CONTENT)
async def unlike_thread(
    thread_id: int,
    service: ThreadService = Depends(get_threads_service),
    db: AsyncSession = Depends(get_db),
    liker: User = Depends(current_active_user),
) -> None:
    try:
        await service.unlike_thread(thread_id, liker)
        await db.commit()
    except:
        await db.rollback()
        raise


@community_threads_router.post("/{thread_id}/comments/{comment_id}/like", status_code=status.HTTP_201_CREATED)
async def like_comment(
    comment_id: int,
    service: ThreadService = Depends(get_threads_service),
    db: AsyncSession = Depends(get_db),
    liker: User = Depends(current_active_user),
) -> None:
    try:
        new_like = await service.like_comment(comment_id, liker)
        db.add(new_like)
        await db.commit()
    except:
        await db.rollback()
        raise


@community_threads_router.delete("/{thread_id}/comments/{comment_id}/unlike", status_code=status.HTTP_204_NO_CONTENT)
async def unlike_comment(
    comment_id: int,
    service: ThreadService = Depends(get_threads_service),
    db: AsyncSession = Depends(get_db),
    liker: User = Depends(current_active_user),
) -> None:
    try:
        await service.unlike_comment(comment_id, liker)
        await db.commit()
    except:
        await db.rollback()
        raise

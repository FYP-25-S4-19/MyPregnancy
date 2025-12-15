from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload
from starlette import status

from app.db.db_schema import (
    CommentLike,
    CommunityThread,
    CommunityThreadLike,
    ThreadCategoryAssociation,
    ThreadComment,
    User,
)
from app.features.community_threads.thread_models import (
    CreateCommentData,
    CreateThreadData,
    ThreadCategoryData,
    ThreadCommentData,
    ThreadData,
    ThreadPreviewData,
    ThreadUpdateData,
    UpdateCommentData,
)
from app.shared.utils import format_user_fullname


class ThreadService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_thread_previews(self) -> list[ThreadPreviewData]:
        stmt = (
            select(CommunityThread)
            .options(
                selectinload(CommunityThread.creator),
                selectinload(CommunityThread.thread_category_associations).selectinload(
                    ThreadCategoryAssociation.category
                ),
            )
            .order_by(CommunityThread.posted_at.desc())
        )
        query_results = (await self.db.execute(stmt)).scalars().all()
        return [
            ThreadPreviewData(
                id=thread.id,
                creator_name=thread.creator.first_name,
                title=thread.title,
                content=thread.content,
                posted_at=thread.posted_at.isoformat(),
                categories=[
                    ThreadCategoryData(id=association.category.id, label=association.category.label)
                    for association in thread.thread_category_associations
                ],
            )
            for thread in query_results
        ]

    async def get_thread_by_id(self, thread_id: int) -> ThreadData:
        stmt = (
            select(CommunityThread)
            .where(CommunityThread.id == thread_id)
            .options(
                joinedload(CommunityThread.creator),
                selectinload(CommunityThread.comments).joinedload(ThreadComment.commenter),
            )
        )
        thread_result = (await self.db.execute(stmt)).scalar_one_or_none()
        if not thread_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found")
        return ThreadData(
            id=thread_result.id,
            creator_id=thread_result.creator.id,
            creator_fullname=format_user_fullname(thread_result.creator),
            title=thread_result.title,
            content=thread_result.content,
            posted_at=thread_result.posted_at,
            comments=[
                ThreadCommentData(
                    id=comment.id,
                    thread_id=comment.thread_id,
                    commenter_id=comment.commenter_id,
                    commenter_fullname=format_user_fullname(comment.commenter),
                    commented_at=comment.commented_at,
                    content=comment.content,
                )
                for comment in thread_result.comments
            ],
        )

    async def create_thread(self, thread_data: CreateThreadData, creator: User) -> None:
        new_thread = CommunityThread(
            creator_id=creator.id,
            title=thread_data.title,
            content=thread_data.content,
        )
        self.db.add(new_thread)
        await self.db.commit()
        await self.db.refresh(new_thread)

    async def update_thread(self, thread_id: int, thread_data: ThreadUpdateData, current_user: User) -> None:
        stmt = select(CommunityThread).where(CommunityThread.id == thread_id)
        thread_result = (await self.db.execute(stmt)).scalar_one_or_none()

        if not thread_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found")

        if thread_result.creator_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this thread")

        thread_result.title = thread_data.title
        thread_result.content = thread_data.content

    async def delete_thread(self, thread_id: int, current_user: User) -> None:
        stmt = select(CommunityThread).where(CommunityThread.id == thread_id)
        thread_result = (await self.db.execute(stmt)).scalar_one_or_none()

        if not thread_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found")

        if thread_result.creator_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this thread")

        await self.db.delete(thread_result)

    async def create_comment(self, thread_id: int, comment_data: CreateCommentData, commenter: User) -> ThreadComment:
        stmt = select(CommunityThread).where(CommunityThread.id == thread_id)
        thread_result = (await self.db.execute(stmt)).scalar_one_or_none()

        if not thread_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found")

        return ThreadComment(
            thread_id=thread_id,
            commenter_id=commenter.id,
            content=comment_data.content,
        )

    async def update_comment(self, comment_id: int, comment_data: UpdateCommentData, current_user: User) -> None:
        stmt = select(ThreadComment).where(ThreadComment.id == comment_id)
        comment_result = (await self.db.execute(stmt)).scalar_one_or_none()

        if not comment_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

        if comment_result.commenter_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this comment")

        comment_result.content = comment_data.content

    async def delete_comment(self, comment_id: int, current_user: User) -> None:
        stmt = select(ThreadComment).where(ThreadComment.id == comment_id)
        comment_result = (await self.db.execute(stmt)).scalar_one_or_none()

        if not comment_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

        if comment_result.commenter_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this comment")

        await self.db.delete(comment_result)

    async def like_thread(self, thread_id: int, liker: User) -> CommunityThreadLike:
        # Verify thread exists
        stmt = select(CommunityThread).where(CommunityThread.id == thread_id)
        thread_result = (await self.db.execute(stmt)).scalar_one_or_none()

        if not thread_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found")

        # Check if user already liked this thread
        like_stmt = select(CommunityThreadLike).where(
            CommunityThreadLike.thread_id == thread_id, CommunityThreadLike.liker_id == liker.id
        )
        existing_like = (await self.db.execute(like_stmt)).scalar_one_or_none()

        if existing_like:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Thread already liked")

        return CommunityThreadLike(thread_id=thread_id, liker_id=liker.id)

    async def unlike_thread(self, thread_id: int, liker: User) -> None:
        # Find the existing like
        stmt = select(CommunityThreadLike).where(
            CommunityThreadLike.thread_id == thread_id, CommunityThreadLike.liker_id == liker.id
        )
        like_result = (await self.db.execute(stmt)).scalar_one_or_none()

        if not like_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Like not found")

        await self.db.delete(like_result)

    async def like_comment(self, comment_id: int, liker: User) -> CommentLike:
        # Verify comment exists
        stmt = select(ThreadComment).where(ThreadComment.id == comment_id)
        comment_result = (await self.db.execute(stmt)).scalar_one_or_none()

        if not comment_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")

        # Check if user already liked this comment
        like_stmt = select(CommentLike).where(CommentLike.comment_id == comment_id, CommentLike.liker_id == liker.id)
        existing_like = (await self.db.execute(like_stmt)).scalar_one_or_none()

        if existing_like:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Comment already liked")

        return CommentLike(comment_id=comment_id, liker_id=liker.id)

    async def unlike_comment(self, comment_id: int, liker: User) -> None:
        # Find the existing like
        stmt = select(CommentLike).where(CommentLike.comment_id == comment_id, CommentLike.liker_id == liker.id)
        like_result = (await self.db.execute(stmt)).scalar_one_or_none()

        if not like_result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Like not found")

        await self.db.delete(like_result)

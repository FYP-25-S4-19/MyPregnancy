import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing_extensions import Annotated

from app.db.db_config import get_db
from app.db.db_schema import UserAppFeedback

Rating = Annotated[int, Field(greater=1, lesser=5)]
Content = Annotated[str, Field(min_length=1)]


class FeedbackCreate(BaseModel):
    author_id: uuid.UUID
    rating: Rating
    content: Content


router = APIRouter(prefix="/feedback", tags=["Feedback YH"])


class FeedbackResponse(BaseModel):
    id: int
    author_id: uuid.UUID
    rating: int
    content: str

    class Config:
        orm_mode = True


class FeedbackStatsResponse(BaseModel):
    total_count: int
    average_rating: float
    rating_distribution: dict


@router.post("/", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_feedback(
    feedback: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
):
    new_feedback = UserAppFeedback(
        author_id=feedback.author_id,
        rating=feedback.rating,
        content=feedback.content,
    )

    db.add(new_feedback)
    await db.commit()
    await db.refresh(new_feedback)

    return new_feedback


# feedback able to filter and sort
@router.get("/", response_model=list[FeedbackResponse])
async def get_all_feedback(
    min_rating: Optional[int] = Query(None, greater_equal=1, lesser_equal=5),
    max_rating: Optional[int] = Query(None, greater_equal=1, lesser_equal=5),
    sort_by: str = Query("newest", regex="^(newest|oldest|highest|lowest)$"),
    limit: Optional[int] = Query(None, greater_equal=1),
    db: AsyncSession = Depends(get_db),
):
    query = select(UserAppFeedback)

    # Apply rating filters
    if min_rating is not None:
        query = query.where(UserAppFeedback.rating >= min_rating)
    if max_rating is not None:
        query = query.where(UserAppFeedback.rating <= max_rating)

    # Apply sorting
    if sort_by == "newest":
        query = query.order_by(desc(UserAppFeedback.id))
    elif sort_by == "oldest":
        query = query.order_by(UserAppFeedback.id)
    elif sort_by == "highest":
        query = query.order_by(desc(UserAppFeedback.rating))
    elif sort_by == "lowest":
        query = query.order_by(UserAppFeedback.rating)

    # Apply limit
    if limit is not None:
        query = query.limit(limit)

    result = await db.execute(query)
    feedbacks = result.scalars().all()
    return feedbacks


# Get feedback statistics
@router.get("/stats", response_model=FeedbackStatsResponse)
async def get_feedback_stats(db: AsyncSession = Depends(get_db)):
    # Get total count
    count_result = await db.execute(select(func.count(UserAppFeedback.id)))
    total_count = count_result.scalar() or 0

    # Get average rating
    avg_result = await db.execute(select(func.avg(UserAppFeedback.rating)))
    average_rating = float(avg_result.scalar() or 0)

    # Get rating distribution
    result = await db.execute(select(UserAppFeedback))
    feedbacks = result.scalars().all()

    rating_dist = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for feedback in feedbacks:
        if feedback.rating in rating_dist:
            rating_dist[feedback.rating] += 1

    return FeedbackStatsResponse(
        total_count=total_count, average_rating=round(average_rating, 2), rating_distribution=rating_dist
    )


# Get feedback by user
@router.get("/user/{user_id}", response_model=list[FeedbackResponse])
async def get_feedback_by_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserAppFeedback).where(UserAppFeedback.author_id == user_id))
    feedbacks = result.scalars().all()
    return feedbacks

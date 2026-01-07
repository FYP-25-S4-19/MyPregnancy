from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.db_config import get_db
from app.db.db_schema import UserAppFeedback, User
import uuid
from pydantic import BaseModel, Field
from typing_extensions import Annotated


Rating = Annotated[int, Field(ge=1, le=5)]
Content = Annotated[str, Field(min_length=1)]

class FeedbackCreate(BaseModel):
    author_id: uuid.UUID
    rating: Rating
    content: Content

router = APIRouter(prefix="/feedback", tags=["Feedback"])

class FeedbackResponse(BaseModel):
    id: int
    author_id: uuid.UUID
    rating: int
    content: str

    class Config:
        orm_mode = True


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


# Get all feedback
@router.get("/", response_model=list[FeedbackResponse])
async def get_all_feedback(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserAppFeedback))
    feedbacks = result.scalars().all()
    return feedbacks

# Get feedback by user
@router.get("/user/{user_id}", response_model=list[FeedbackResponse])
async def get_feedback_by_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserAppFeedback).where(UserAppFeedback.author_id == user_id))
    feedbacks = result.scalars().all()
    return feedbacks




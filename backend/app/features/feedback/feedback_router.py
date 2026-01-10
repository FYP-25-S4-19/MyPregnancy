import uuid

from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.db.db_config import get_async_db
from app.db.db_schema import UserAppFeedback

from .service import FeedbackSentimentService

Rating = Annotated[int, Field(ge=1, le=5)]
Content = Annotated[str, Field(min_length=1)]


class FeedbackCreate(BaseModel):
    author_id: uuid.UUID
    rating: Rating
    content: Content


class FeedbackResponse(BaseModel):
    id: int
    author_id: uuid.UUID
    rating: int
    content: str
    positive_score: float
    neutral_score: float
    negative_score: float
    compound_score: float

    class Config:
        orm_mode = True

feedback_router = APIRouter(prefix="/feedback", tags=["Feedback"])
sentiment_service = FeedbackSentimentService()


@feedback_router.post("/", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_feedback(
    feedback: FeedbackCreate,
    db: AsyncSession = Depends(get_async_db),
):
    scores = sentiment_service.analyze(feedback.content)

    new_feedback = UserAppFeedback(
        author_id=feedback.author_id,
        rating=feedback.rating,
        content=feedback.content,
        positive_score=scores["pos"],
        neutral_score=scores["neu"],
        negative_score=scores["neg"],
        compound_score=scores["compound"],
    )

    db.add(new_feedback)
    await db.commit()
    await db.refresh(new_feedback)

    return new_feedback


@feedback_router.get("/positive", status_code=status.HTTP_200_OK)
async def get_positive_feedback(
    threshold: float = 0.05,
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(UserAppFeedback))
    feedbacks = result.scalars().all()

    def compound_score(entry: UserAppFeedback) -> float:
        if entry.compound_score is not None:
            return entry.compound_score
        scores = sentiment_service.analyze(entry.content)
        return scores["compound"]

    positive_feedbacks = [f for f in feedbacks if compound_score(f) >= threshold]

    return [
        {
            "id": f.id,
            "content": f.content,
            "rating": f.rating,
            "compound_score": compound_score(f),
        }
        for f in sorted(positive_feedbacks, key=compound_score, reverse=True)
    ]


@feedback_router.get("/sentiment", status_code=status.HTTP_200_OK)
async def get_feedback_by_sentiment(
    threshold: float = 0.05,
    as_text: bool = False,
    db: AsyncSession = Depends(get_async_db),
):
    result = await db.execute(select(UserAppFeedback))
    feedbacks = result.scalars().all()

    positive: list[dict] = []
    negative: list[dict] = []

    for f in feedbacks:
        compound = round(f.compound_score, 3) if f.compound_score is not None else round(
            sentiment_service.analyze(f.content)["compound"], 3
        )
        payload = {"id": f.id, "rating": f.rating, "compound": compound, "content": f.content}
        if compound >= threshold:
            positive.append(payload)
        else:
            negative.append(payload)

    # Sort for readability: positive high->low, negative low->high
    positive_sorted = sorted(positive, key=lambda x: x["compound"], reverse=True)
    negative_sorted = sorted(negative, key=lambda x: x["compound"])

    if as_text:
        lines: list[str] = []
        lines.append(f"threshold={threshold}")
        lines.append(f"positive ({len(positive_sorted)}):")
        for item in positive_sorted:
            lines.append(
                f"  id={item['id']} | rating={item['rating']} | compound={item['compound']} | content={item['content']}"
            )
        lines.append("")
        lines.append(f"negative ({len(negative_sorted)}):")
        for item in negative_sorted:
            lines.append(
                f"  id={item['id']} | rating={item['rating']} | compound={item['compound']} | content={item['content']}"
            )
        body = "\n".join(lines)
        return Response(content=body, media_type="text/plain")

    return {
        "threshold": threshold,
        "counts": {"positive": len(positive_sorted), "negative": len(negative_sorted)},
        "positive": positive_sorted,
        "negative": negative_sorted,
    }

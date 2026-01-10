from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.db_config import get_async_db
from app.db.db_schema import UserAppFeedback

from .service import FeedbackSentimentService

feedback_router = APIRouter(prefix="/feedback", tags=["Feedback"])
sentiment_service = FeedbackSentimentService()


@feedback_router.get("/positive", status_code=status.HTTP_200_OK)
async def get_positive_feedback(db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(UserAppFeedback))
    feedbacks = result.scalars().all()

    positive_feedbacks = [
        f for f in feedbacks if sentiment_service.is_positive(f.content)
    ]

    return [
        {"id": f.id, "content": f.content, "rating": f.rating}
        for f in positive_feedbacks
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
        scores = sentiment_service.analyze(f.content)
        compound = round(scores["compound"], 3)
        payload = {"id": f.id, "rating": f.rating, "compound": compound, "content": f.content}
        if scores["compound"] >= threshold:
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

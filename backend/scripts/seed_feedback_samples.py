r"""Insert sample feedback rows for testing sentiment endpoint.

Usage (from backend folder):
    .venv\Scripts\python.exe scripts\seed_feedback_samples.py --author-id <uuid>

Requires the .env to have SYNC_DATABASE_URL / ASYNC_DATABASE_URL set.
"""
from __future__ import annotations

import argparse
import asyncio
import uuid

from sqlalchemy import select

from app.db.db_config import AsyncSessionLocal
from app.db.db_schema import User, UserAppFeedback


SAMPLE_FEEDBACK = [
    (21, "I love this app, it really helps me track everything easily."),
    (22, "Great experience, smooth and informative."),
    (23, "It's okay, could use some improvements."),
    (24, "The app is slow sometimes and crashes."),
    (25, "Terrible experience, nothing works as expected."),
    (26, "i hate this app."),
    (27, "i love this app."),
    (28, "this app help me a lot during my pregnancy time."),
    (28, "this app did not help me at all during my pregnancy time."),

]


async def ensure_author_exists(db, author_id: uuid.UUID) -> None:
    # Ensure the author exists to avoid FK violation
    result = await db.execute(select(User).where(User.id == author_id))
    if result.scalar_one_or_none() is None:
        raise ValueError(f"Author with id {author_id} not found in users table")


async def insert_feedback(db, author_id: uuid.UUID) -> None:
    for rating, content in SAMPLE_FEEDBACK:
        db.add(UserAppFeedback(author_id=author_id, rating=rating, content=content))
    await db.commit()


async def main() -> None:
    parser = argparse.ArgumentParser(description="Seed sample user app feedback")
    parser.add_argument("--author-id", required=True, help="UUID of an existing user to own the feedback")
    args = parser.parse_args()

    author_id = uuid.UUID(args.author_id)

    async with AsyncSessionLocal() as db:
        await ensure_author_exists(db, author_id)
        await insert_feedback(db, author_id)

    print("Inserted sample feedback rows. You can now call /feedback/positive.")


if __name__ == "__main__":
    asyncio.run(main())

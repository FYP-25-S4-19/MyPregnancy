"""List a few users (id, email) to grab a valid author_id for seeding feedback."""

from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.db.db_config import AsyncSessionLocal
from app.db.db_schema import User


async def main() -> None:
    async with AsyncSessionLocal() as db:
        rows = (await db.execute(select(User.id, User.email).limit(10))).all()
        for rid, email in rows:
            print(f"{rid}  {email}")


if __name__ == "__main__":
    asyncio.run(main())

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

SYNC_DATABASE_URL = os.getenv("SYNC_DATABASE_URL") or ""
if not SYNC_DATABASE_URL:
    raise RuntimeError("SYNC_DATABASE_URL not set in '.env' file'")

engine = create_engine(SYNC_DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --------------------------------------------------------------------------
ASYNC_DATABASE_URL = os.getenv("ASYNC_DATABASE_URL") or ""
if not ASYNC_DATABASE_URL:
    raise RuntimeError("ASYNC_DATABASE_URL not set in '.env' file'")

async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    pool_pre_ping=True,
    # Explicitly manage the footprint on shared RDS
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    # Keep this 'False' for Async compatibility
    expire_on_commit=False,
)


# --------------------------------------------------------------------------
async def get_db():
    async with AsyncSessionLocal() as db:
        try:
            yield db
        finally:
            await db.close()

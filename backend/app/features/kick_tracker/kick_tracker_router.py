from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.db_config import get_db
from app.db.db_schema import PregnantWoman
from app.features.kick_tracker.kick_tracker_models import (
    KickCountsResponse,
    KickRecordRequest,
    KickRecordResponse,
    KickSessionStartResponse,
    KickSessionStopResponse,
)
from app.features.kick_tracker.kick_tracker_service import KickTrackerService

kick_tracker_router = APIRouter(prefix="/kick-tracker", tags=["Kick Tracker"])


def get_kick_tracker_service(db: AsyncSession = Depends(get_db)) -> KickTrackerService:
    return KickTrackerService(db)


@kick_tracker_router.post("/kicks", response_model=KickRecordResponse)
async def record_kick(
    request: KickRecordRequest,
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
    db: AsyncSession = Depends(get_db),
    service: KickTrackerService = Depends(get_kick_tracker_service),
) -> KickRecordResponse:
    resp = await service.record_kick(mother.id, request.kick_at)
    await db.commit()
    return resp


@kick_tracker_router.post("/sessions/start", response_model=KickSessionStartResponse)
async def start_kick_session(
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
    db: AsyncSession = Depends(get_db),
    service: KickTrackerService = Depends(get_kick_tracker_service),
) -> KickSessionStartResponse:
    resp = await service.start_session(mother.id)
    await db.commit()
    return resp


@kick_tracker_router.post("/sessions/stop", response_model=KickSessionStopResponse)
async def stop_kick_session(
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
    db: AsyncSession = Depends(get_db),
    service: KickTrackerService = Depends(get_kick_tracker_service),
) -> KickSessionStopResponse:
    resp = await service.stop_session(mother.id)
    await db.commit()
    return resp


@kick_tracker_router.get("/counts", response_model=KickCountsResponse)
async def get_kick_counts(
    start_date: date | None = None,
    end_date: date | None = None,
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
    service: KickTrackerService = Depends(get_kick_tracker_service),
) -> KickCountsResponse:
    # Default to last 14 days (inclusive)
    if end_date is None:
        end_date = date.today()
    if start_date is None:
        start_date = end_date - timedelta(days=13)

    return await service.get_daily_counts(mother.id, start_date, end_date)

from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from typing import Sequence
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.db_schema import KickTrackerDataPoint, KickTrackerSession
from app.features.kick_tracker.kick_tracker_models import (
    KickCountsResponse,
    KickDailyCount,
    KickRecordResponse,
    KickSessionStartResponse,
    KickSessionStopResponse,
)


def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def _to_date(value: object) -> date:
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        return date.fromisoformat(value)
    raise TypeError(f"Unsupported day value type: {type(value)!r}")


class KickTrackerService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_active_session(self, mother_id: UUID) -> KickTrackerSession | None:
        stmt = (
            select(KickTrackerSession)
            .where(KickTrackerSession.mother_id == mother_id, KickTrackerSession.ended_at.is_(None))
            .order_by(KickTrackerSession.started_at.desc())
            .limit(1)
        )
        return (await self.db.execute(stmt)).scalars().first()

    async def start_session(self, mother_id: UUID, started_at: datetime | None = None) -> KickSessionStartResponse:
        now = _ensure_utc(started_at or datetime.now(timezone.utc))

        existing = await self._get_active_session(mother_id)
        if existing is not None:
            return KickSessionStartResponse(session_id=existing.id, started_at=existing.started_at)

        session = KickTrackerSession(mother_id=mother_id, started_at=now, ended_at=None)
        self.db.add(session)
        await self.db.flush()
        return KickSessionStartResponse(session_id=session.id, started_at=session.started_at)

    async def stop_session(self, mother_id: UUID, ended_at: datetime | None = None) -> KickSessionStopResponse:
        now = _ensure_utc(ended_at or datetime.now(timezone.utc))
        session = await self._get_active_session(mother_id)
        if session is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active kick session")

        session.ended_at = now
        await self.db.flush()
        return KickSessionStopResponse(session_id=session.id, ended_at=session.ended_at)

    async def record_kick(self, mother_id: UUID, kick_at: datetime | None = None) -> KickRecordResponse:
        now = _ensure_utc(kick_at or datetime.now(timezone.utc))

        session = await self._get_active_session(mother_id)
        if session is None:
            # If the client didn't explicitly start a session, we still record the kick.
            session = KickTrackerSession(mother_id=mother_id, started_at=now, ended_at=None)
            self.db.add(session)
            await self.db.flush()

        kick = KickTrackerDataPoint(session_id=session.id, kick_at=now)
        self.db.add(kick)
        await self.db.flush()  # assigns kick.id

        session_count_stmt = select(func.count(KickTrackerDataPoint.id)).where(
            KickTrackerDataPoint.session_id == session.id
        )
        session_kick_count = (await self.db.execute(session_count_stmt)).scalar_one()

        start_of_day = datetime.combine(now.date(), time.min, tzinfo=now.tzinfo)
        end_of_day = start_of_day + timedelta(days=1)
        today_count_stmt = (
            select(func.count(KickTrackerDataPoint.id))
            .join(KickTrackerSession, KickTrackerDataPoint.session_id == KickTrackerSession.id)
            .where(
                KickTrackerSession.mother_id == mother_id,
                KickTrackerDataPoint.kick_at >= start_of_day,
                KickTrackerDataPoint.kick_at < end_of_day,
            )
        )
        today_kick_count = (await self.db.execute(today_count_stmt)).scalar_one()

        return KickRecordResponse(
            kick_id=kick.id,
            session_id=session.id,
            kick_at=kick.kick_at,
            session_kick_count=int(session_kick_count),
            today_kick_count=int(today_kick_count),
        )

    async def get_daily_counts(self, mother_id: UUID, start_date: date, end_date: date) -> KickCountsResponse:
        if start_date > end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="start_date must be <= end_date",
            )

        start_dt = datetime.combine(start_date, time.min, tzinfo=timezone.utc)
        end_dt = datetime.combine(end_date + timedelta(days=1), time.min, tzinfo=timezone.utc)

        day_expr = func.date(KickTrackerDataPoint.kick_at)
        stmt = (
            select(day_expr.label("day"), func.count(KickTrackerDataPoint.id).label("count"))
            .join(KickTrackerSession, KickTrackerDataPoint.session_id == KickTrackerSession.id)
            .where(
                KickTrackerSession.mother_id == mother_id,
                KickTrackerDataPoint.kick_at >= start_dt,
                KickTrackerDataPoint.kick_at < end_dt,
            )
            .group_by(day_expr)
            .order_by(day_expr)
        )
        rows: Sequence[tuple[object, int]] = (await self.db.execute(stmt)).all()  # type: ignore[assignment]

        by_day: dict[date, int] = {}
        for day_val, count in rows:
            by_day[_to_date(day_val)] = int(count)

        days: list[KickDailyCount] = []
        cursor = start_date
        while cursor <= end_date:
            days.append(KickDailyCount(date=cursor, kick_count=by_day.get(cursor, 0)))
            cursor += timedelta(days=1)

        return KickCountsResponse(start_date=start_date, end_date=end_date, days=days)

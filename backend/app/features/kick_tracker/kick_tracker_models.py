from __future__ import annotations

from datetime import date, datetime

from app.core.custom_base_model import CustomBaseModel


class KickRecordRequest(CustomBaseModel):
    kick_at: datetime | None = None


class KickSessionStartResponse(CustomBaseModel):
    session_id: int
    started_at: datetime


class KickSessionStopResponse(CustomBaseModel):
    session_id: int
    ended_at: datetime


class KickRecordResponse(CustomBaseModel):
    kick_id: int
    session_id: int
    kick_at: datetime
    session_kick_count: int
    today_kick_count: int


class KickDailyCount(CustomBaseModel):
    date: date
    kick_count: int


class KickCountsResponse(CustomBaseModel):
    start_date: date
    end_date: date
    days: list[KickDailyCount]

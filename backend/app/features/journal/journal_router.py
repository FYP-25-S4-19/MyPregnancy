from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.db_config import get_db
from app.db.db_schema import PregnantWoman, User
from app.features.journal.journal_models import (
    GetJournalEntryResponse,
    JournalPreviewData,
    UpsertJournalEntryRequest,
)
from app.features.journal.journal_service import JournalService

journal_router = APIRouter(prefix="/journals", tags=["Journal"])


def get_journal_service(db: AsyncSession = Depends(get_db)) -> JournalService:
    return JournalService(db)


@journal_router.get("/metrics/template", response_model=GetJournalEntryResponse)
async def get_metrics_template(
    _: User = Depends(require_role(User)),
    service: JournalService = Depends(get_journal_service),
) -> GetJournalEntryResponse:
    """
    Get a template with all available binary and scalar metrics.
    This is useful for rendering the journal UI when no entries exist yet.
    """
    return await service.get_metrics_template()


@journal_router.get("/range", response_model=list[GetJournalEntryResponse])
async def get_journal_entries_in_range(
    start_date: date,
    end_date: date,
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
    service: JournalService = Depends(get_journal_service),
) -> list[GetJournalEntryResponse]:
    """
    Fetch journal entries within a date range for sliding window pagination.
    Example: GET /journals/range?start_date=2025-11-01&end_date=2025-11-14
    """
    return await service.get_journal_entries_in_range(mother.id, start_date, end_date)


@journal_router.get("/{entry_date}", response_model=JournalPreviewData)
async def scalar_metrics_and_kick_count_on_date(
    entry_date: date,
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
    service: JournalService = Depends(get_journal_service),
) -> JournalPreviewData:
    return await service.scalar_metrics_and_kick_count_on_date(mother.id, entry_date)


@journal_router.get("/", response_model=list[GetJournalEntryResponse])
async def get_all_journal_entries_for_mother(
    mother: PregnantWoman = Depends(require_role(PregnantWoman)), service: JournalService = Depends(get_journal_service)
) -> list[GetJournalEntryResponse]:
    return await service.get_journal_entries_for_mother(mother.id)


@journal_router.put("/{entry_date}")
async def upsert_journal_entry(
    entry_date: date,
    request: UpsertJournalEntryRequest,
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
    db: AsyncSession = Depends(get_db),
    service: JournalService = Depends(get_journal_service),
):
    try:
        await service.upsert_journal_entry(mother.id, entry_date, request)
        await db.commit()
    except:
        await db.rollback()
        raise


@journal_router.delete("/{entry_date}")
async def delete_journal_entry(
    entry_date: date,
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
    db: AsyncSession = Depends(get_db),
    service: JournalService = Depends(get_journal_service),
):
    try:
        await service.delete_journal_entry(mother.id, entry_date)
        await db.commit()
    except:
        await db.rollback()
        raise

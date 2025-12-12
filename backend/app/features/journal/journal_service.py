from collections import defaultdict
from datetime import date
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import Sequence, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.db_schema import BinaryMetric, JournalBinaryMetricLog, JournalEntry, JournalScalarMetricLog
from app.features.journal.journal_models import (
    BinaryMetricCategoryGroup,
    BinaryMetricView,
    BloodPressureData,
    GetJournalEntryResponse,
    ScalarMetricView,
    UpsertJournalEntryRequest,
)


class JournalService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_journal_entries_for_mother(self, mother_id: UUID) -> list[GetJournalEntryResponse]:
        # Fetch all possible options
        #
        # We need this to render the "unselected" options (False).
        # We sort by ID so the UI always renders them in the same order.
        binary_defs_result = await self.db.execute(select(BinaryMetric).order_by(BinaryMetric.id))
        all_binary_defs: Sequence[BinaryMetric] = binary_defs_result.scalars().all()

        # Fetch user data
        stmt = (
            select(JournalEntry)
            .where(JournalEntry.author_id == mother_id)
            .options(
                selectinload(JournalEntry.journal_binary_metric_logs),
                selectinload(JournalEntry.journal_scalar_metric_logs).joinedload(JournalScalarMetricLog.scalar_metric),
            )
            .order_by(JournalEntry.logged_on.desc())
        )
        entries_result = await self.db.execute(stmt)
        entries = entries_result.scalars().all()

        response_list: list[GetJournalEntryResponse] = []
        for entry in entries:
            selected_ids: set[int] = {log.binary_metric_id for log in entry.journal_binary_metric_logs}

            grouped_binary: defaultdict[str, list[BinaryMetricView]] = defaultdict(list)
            for definition in all_binary_defs:
                is_selected: bool = definition.id in selected_ids
                view_model = BinaryMetricView(
                    metric_id=definition.id,  # ID for future edits
                    label=definition.label,  # Text for display
                    category=definition.category.value,
                    is_selected=is_selected,
                )
                grouped_binary[definition.category.value].append(view_model)

            binary_metrics_response: list[BinaryMetricCategoryGroup] = [  # Convert to list
                BinaryMetricCategoryGroup(category=cat, binary_metric_logs=logs) for cat, logs in grouped_binary.items()
            ]

            scalar_metrics_response = []
            for log in entry.journal_scalar_metric_logs:
                scalar_metrics_response.append(
                    ScalarMetricView(
                        metric_id=log.scalar_metric.id,  # ID for future edits
                        label=log.scalar_metric.label,
                        value=log.value,
                        unit_of_measurement=log.scalar_metric.unit_of_measurement,
                    )
                )

            response_list.append(
                GetJournalEntryResponse(
                    id=entry.id,
                    logged_on=entry.logged_on,
                    content=entry.content,
                    binary_metrics=binary_metrics_response,
                    scalar_metrics=scalar_metrics_response,
                    blood_pressure=BloodPressureData(systolic=entry.systolic, diastolic=entry.diastolic),
                )
            )
        return response_list

    async def upsert_journal_entry(self, mother_id: UUID, entry_date: date, request: UpsertJournalEntryRequest) -> None:
        if entry_date > date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Journal entry date cannot be in the future"
            )

        # 1. Check for Existing Entry (Eager load relationships for update/create)
        stmt = (
            select(JournalEntry)
            .where(JournalEntry.author_id == mother_id, JournalEntry.logged_on == entry_date)
            .options(
                selectinload(JournalEntry.journal_binary_metric_logs),
                selectinload(JournalEntry.journal_scalar_metric_logs),
            )
        )
        result = await self.db.execute(stmt)
        entry = result.scalars().first()

        if entry is None:
            entry = JournalEntry(
                author_id=mother_id,
                logged_on=entry_date,
                content=request.content or "",
                systolic=request.blood_pressure.systolic if request.blood_pressure else 0,
                diastolic=request.blood_pressure.diastolic if request.blood_pressure else 0,
            )
            self.db.add(entry)
            await self.db.flush()

        if request.content is not None:
            entry.content = request.content

        if request.blood_pressure is not None:
            entry.systolic = request.blood_pressure.systolic
            entry.diastolic = request.blood_pressure.diastolic

        if request.scalar_metrics is not None:
            entry.journal_scalar_metric_logs.clear()
            for sm in request.scalar_metrics:
                entry.journal_scalar_metric_logs.append(
                    JournalScalarMetricLog(scalar_metric_id=sm.metric_id, value=sm.value)
                )

        if request.binary_metric_ids is not None:
            entry.journal_binary_metric_logs.clear()
            for bm_id in request.binary_metric_ids:
                entry.journal_binary_metric_logs.append(JournalBinaryMetricLog(binary_metric_id=bm_id))

    async def delete_journal_entry(self, mother_id: UUID, entry_date: date) -> None:
        stmt = select(JournalEntry).where(JournalEntry.logged_on == entry_date, JournalEntry.author_id == mother_id)
        result = await self.db.execute(stmt)
        journal_entry = result.scalars().first()

        if journal_entry is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found")
        await self.db.delete(journal_entry)

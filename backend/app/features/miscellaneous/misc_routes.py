import base64
import json
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import and_, null, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.db_config import get_db
from app.db.db_schema import MCRNumber, VolunteerDoctor
from app.features.miscellaneous.misc_models import DoctorPreviewData, DoctorsPaginatedResponse
from app.shared.utils import get_s3_bucket_prefix

misc_router = APIRouter(tags=["Miscellaneous"])


@misc_router.get("/avail-mcr", response_model=list[str])
async def get_available_mcr_numbers(db: AsyncSession = Depends(get_db)) -> list[str]:
    stmt = select(MCRNumber).where(MCRNumber.doctor == null)
    all_mcr_obj = (await db.execute(stmt)).scalars().all()
    return [mcr_obj.value for mcr_obj in all_mcr_obj]


def encode_cursor(created_at: datetime, doctor_id: str) -> str:
    """Encode timestamp and UUID into a base64 cursor"""
    cursor_data = {"created_at": created_at.isoformat(), "id": doctor_id}
    cursor_json = json.dumps(cursor_data)
    return base64.b64encode(cursor_json.encode()).decode()


def decode_cursor(cursor: str) -> tuple[datetime, str]:
    """Decode base64 cursor back to timestamp and UUID"""
    cursor_json = base64.b64decode(cursor.encode()).decode()
    cursor_data = json.loads(cursor_json)
    return datetime.fromisoformat(cursor_data["created_at"]), cursor_data["id"]


@misc_router.get("/doctors", response_model=DoctorsPaginatedResponse)
async def list_of_doctors(
    limit: int = 5, cursor: str | None = None, db: AsyncSession = Depends(get_db)
) -> DoctorsPaginatedResponse:
    # Build query with timestamp-based pagination
    stmt = select(VolunteerDoctor).where(VolunteerDoctor.is_active)  # type: ignore

    # Apply cursor filter if provided
    if cursor is not None:
        cursor_created_at, cursor_id = decode_cursor(cursor)
        # Use timestamp for ordering, UUID for tie-breaking
        stmt = stmt.where(
            or_(
                VolunteerDoctor.created_at < cursor_created_at,
                and_(VolunteerDoctor.created_at == cursor_created_at, VolunteerDoctor.id < cursor_id),
            )
        )

    # Order by created_at DESC (newest first), then by ID for consistency
    stmt = stmt.order_by(VolunteerDoctor.created_at.desc(), VolunteerDoctor.id.desc()).limit(limit + 1)

    doctors = (await db.execute(stmt)).scalars().all()

    # Check if there are more results
    has_more = len(doctors) > limit
    doctors_to_return = doctors[:limit]

    # Generate next cursor using the last doctor's timestamp and ID
    next_cursor = (
        encode_cursor(doctors_to_return[-1].created_at, str(doctors_to_return[-1].id))
        if doctors_to_return and has_more
        else None
    )

    doctor_previews = [
        DoctorPreviewData(
            doctor_id=doctor.id,
            profile_img_url=get_s3_bucket_prefix() + doctor.profile_img_key if doctor.profile_img_key else None,
            first_name=doctor.first_name,
            is_liked=False,  # TODO
        )
        for doctor in doctors_to_return
    ]

    return DoctorsPaginatedResponse(doctors=doctor_previews, next_cursor=next_cursor, has_more=has_more)


@misc_router.get("/")
async def index():
    return "Ping!"

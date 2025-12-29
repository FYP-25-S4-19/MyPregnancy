import base64
import json
from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import and_, null, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.db_config import get_db
from app.db.db_schema import DoctorRating, MCRNumber, Page, PregnantWoman, VolunteerDoctor
from app.features.miscellaneous.misc_models import (
    DoctorPreviewData,
    DoctorRatingRequest,
    DoctorRatingResponse,
    DoctorsPaginatedResponse,
)
from app.shared.utils import get_s3_bucket_prefix

misc_router = APIRouter(tags=["Miscellaneous"])


@misc_router.get("/doctors/{doctor_id}/rating", response_model=DoctorRatingResponse)
async def check_doctor_rating(
    doctor_id: UUID,
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
    db: AsyncSession = Depends(get_db),
) -> DoctorRatingResponse:
    doctor_stmt = select(VolunteerDoctor).where(VolunteerDoctor.id == doctor_id)  # Check if doctor exists
    doctor = (await db.execute(doctor_stmt)).scalars().first()
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    rating_stmt = select(DoctorRating).where(  # Check for existing rating
        and_(DoctorRating.doctor_id == doctor_id, DoctorRating.rater_id == mother.id)
    )
    existing_rating = (await db.execute(rating_stmt)).scalars().first()

    return DoctorRatingResponse(has_rating=(existing_rating is not None))


@misc_router.post("/doctors/{doctor_id}/rating", status_code=status.HTTP_204_NO_CONTENT)
async def rate_doctor(
    doctor_id: UUID,
    rating_request: DoctorRatingRequest,
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        doctor_stmt = select(VolunteerDoctor).where(VolunteerDoctor.id == doctor_id)  # Check if doctor exists
        doctor = (await db.execute(doctor_stmt)).scalars().first()
        if not doctor:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

        rating_stmt = select(DoctorRating).where(  # Check for existing rating
            and_(DoctorRating.doctor_id == doctor_id, DoctorRating.rater_id == mother.id)
        )
        existing_rating = (await db.execute(rating_stmt)).scalars().first()
        if existing_rating:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rating already exists")

        new_rating = DoctorRating(
            rater=mother,
            doctor=doctor,
            rating=rating_request.rating,
        )
        db.add(new_rating)
        await db.commit()
    except Exception:
        await db.rollback()


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


router = APIRouter(prefix="/website", tags=["Website"])


class PageUpdate(BaseModel):
    sections: List[Any] = []
    background_image: Optional[str] = None


@router.put("/pages/{slug}")
async def update_page(slug: str, data: PageUpdate, db: AsyncSession = Depends(get_db)):
    """Update or create a page with sections and background image"""
    try:
        result = await db.execute(select(Page).filter(Page.slug == slug))
        page = result.scalars().first()

        if not page:
            # Create new page if it doesn't exist
            page = Page(slug=slug, sections=data.sections, background_image=data.background_image)
            db.add(page)
        else:
            # Update existing page
            page.sections = data.sections
            page.background_image = data.background_image

        await db.commit()
        await db.refresh(page)

        return {
            "id": page.id,
            "slug": page.slug,
            "sections": page.sections,
            "background_image": page.background_image,
            "message": "Page saved successfully",
        }
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/pages/{slug}")
async def get_page(slug: str, db: AsyncSession = Depends(get_db)):
    """Get a page by slug"""
    result = await db.execute(select(Page).filter(Page.slug == slug))
    page = result.scalars().first()

    if not page:
        raise HTTPException(status_code=404, detail="Page not found")

    return {
        "page": {"id": page.id, "slug": page.slug, "sections": page.sections, "background_image": page.background_image}
    }


@router.get("/pages")
async def get_all_pages(db: AsyncSession = Depends(get_db)):
    """Get all pages"""
    result = await db.execute(select(Page))
    pages = result.scalars().all()
    return {"pages": [{"id": p.id, "slug": p.slug, "sections": p.sections} for p in pages]}

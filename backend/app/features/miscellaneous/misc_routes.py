import base64
import json
from datetime import datetime
from typing import Any, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import and_, delete, func, null, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import require_role
from app.db.db_config import get_db
from app.db.db_schema import (
    Admin,
    DoctorRating,
    DoctorSpecialisation,
    MCRNumber,
    Page,
    PregnantWoman,
    SavedVolunteerDoctor,
    VolunteerDoctor,
)
from app.features.miscellaneous.misc_models import (
    CreateDoctorSpecializationRequest,
    DoctorPreviewData,
    DoctorRatingRequest,
    DoctorRatingResponse,
    DoctorRatingSummaryResponse,
    DoctorsPaginatedResponse,
    DoctorSpecializationModel,
    UpdateDoctorSpecializationRequest,
)
from app.shared.utils import get_s3_bucket_prefix

misc_router = APIRouter(tags=["Miscellaneous"])


# ===================== DOCTOR SPECIALIZATION ENDPOINTS =====================


@misc_router.get("/doctor-specializations", response_model=list[DoctorSpecializationModel])
async def get_doctor_specializations(
    db: AsyncSession = Depends(get_db),
) -> list[DoctorSpecializationModel]:
    stmt = select(DoctorSpecialisation).order_by(DoctorSpecialisation.specialisation)
    result = await db.execute(stmt)
    specializations = result.scalars().all()
    return [DoctorSpecializationModel(id=s.id, specialisation=s.specialisation) for s in specializations]


@misc_router.post(
    "/doctor-specializations", response_model=DoctorSpecializationModel, status_code=status.HTTP_201_CREATED
)
async def create_doctor_specialization(
    request: CreateDoctorSpecializationRequest,
    _: Admin = Depends(require_role(Admin)),
    db: AsyncSession = Depends(get_db),
) -> DoctorSpecializationModel:
    try:
        # Check if specialization already exists
        stmt = select(DoctorSpecialisation).where(DoctorSpecialisation.specialisation == request.specialisation.strip())
        existing = (await db.execute(stmt)).scalars().first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Specialization already exists")

        new_spec = DoctorSpecialisation(specialisation=request.specialisation.strip())
        db.add(new_spec)
        await db.flush()
        await db.commit()
        return DoctorSpecializationModel(id=new_spec.id, specialisation=new_spec.specialisation)
    except Exception:
        await db.rollback()
        raise


@misc_router.patch("/admin/doctor-specializations/{specialization_id}", response_model=DoctorSpecializationModel)
async def update_doctor_specialization(
    specialization_id: int,
    request: UpdateDoctorSpecializationRequest,
    _: Admin = Depends(require_role(Admin)),
    db: AsyncSession = Depends(get_db),
) -> DoctorSpecializationModel:
    try:
        stmt = select(DoctorSpecialisation).where(DoctorSpecialisation.id == specialization_id)
        specialization = (await db.execute(stmt)).scalars().first()
        if not specialization:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specialization not found")

        # Check if new specialization already exists (and it's not the same one being updated)
        stmt = select(DoctorSpecialisation).where(DoctorSpecialisation.specialisation == request.specialisation.strip())
        existing = (await db.execute(stmt)).scalars().first()
        if existing and existing.id != specialization_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Specialization already exists")

        specialization.specialisation = request.specialisation.strip()
        await db.flush()
        await db.commit()
        return DoctorSpecializationModel(id=specialization.id, specialisation=specialization.specialisation)
    except Exception:
        await db.rollback()
        raise


@misc_router.delete("/admin/doctor-specializations/{specialization_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_doctor_specialization(
    specialization_id: int,
    _: Admin = Depends(require_role(Admin)),
    db: AsyncSession = Depends(get_db),
) -> None:
    try:
        stmt = select(DoctorSpecialisation).where(DoctorSpecialisation.id == specialization_id)
        specialization = (await db.execute(stmt)).scalars().first()
        if not specialization:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Specialization not found")

        # Check if any doctors have this specialization
        doctor_stmt = select(VolunteerDoctor).where(VolunteerDoctor.specialisation_id == specialization_id)
        doctors = (await db.execute(doctor_stmt)).scalars().all()
        if doctors:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot delete specialization. {len(doctors)} doctor(s) have this specialization.",
            )

        await db.delete(specialization)
        await db.commit()
    except Exception:
        await db.rollback()
        raise


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


@misc_router.get("/doctors/{doctor_id}/rating/summary", response_model=DoctorRatingSummaryResponse)
async def get_doctor_rating_summary(
    doctor_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> DoctorRatingSummaryResponse:
    doctor_stmt = select(VolunteerDoctor.id).where(VolunteerDoctor.id == doctor_id)
    doctor_exists = (await db.execute(doctor_stmt)).scalar_one_or_none()
    if not doctor_exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")
    # Calculate average + count
    stmt = select(
        func.avg(DoctorRating.rating),
        func.count(DoctorRating.id),
    ).where(DoctorRating.doctor_id == doctor_id)

    avg_rating, count_rating = (await db.execute(stmt)).one()

    avg_value = round(float(avg_rating), 1) if avg_rating is not None else None
    count_value = int(count_rating or 0)

    return DoctorRatingSummaryResponse(
        doctor_id=doctor_id,
        average_rating=avg_value,
        ratings_count=count_value,
    )


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
    limit: int = 5,
    cursor: str | None = None,
    q: str | None = None,
    db: AsyncSession = Depends(get_db),
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
) -> DoctorsPaginatedResponse:
    # Build query with timestamp-based pagination
    stmt = (
        select(VolunteerDoctor).options(selectinload(VolunteerDoctor.specialisation)).where(VolunteerDoctor.is_active)
    )  # type: ignore

    if q:
        like = f"%{q.strip()}%"

        stmt = stmt.join(DoctorSpecialisation).where(
            or_(
                VolunteerDoctor.first_name.ilike(like),
                DoctorSpecialisation.specialisation.ilike(like),
            )
        )

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

    doctor_ids = [d.id for d in doctors_to_return]

    liked_ids: set[UUID] = set()
    if doctor_ids:
        liked_stmt = select(SavedVolunteerDoctor.volunteer_doctor_id).where(
            SavedVolunteerDoctor.mother_id == mother.id,
            SavedVolunteerDoctor.volunteer_doctor_id.in_(doctor_ids),
        )
        liked_ids = set((await db.execute(liked_stmt)).scalars().all())

    rating_map: dict[UUID, tuple[float | None, int]] = {}
    if doctor_ids:
        rating_stmt = (
            select(
                DoctorRating.doctor_id,
                func.avg(DoctorRating.rating),
                func.count(DoctorRating.rater_id),
            )
            .where(DoctorRating.doctor_id.in_(doctor_ids))
            .group_by(DoctorRating.doctor_id)
        )
        rows = (await db.execute(rating_stmt)).all()
        for doctor_id, avg_rating, cnt in rows:
            rating_map[doctor_id] = (round(float(avg_rating), 1) if avg_rating is not None else None, int(cnt or 0))

    doctor_previews = []
    for doctor in doctors_to_return:
        avg_rating, cnt = rating_map.get(doctor.id, (None, 0))

        doctor_previews.append(
            DoctorPreviewData(
                doctor_id=doctor.id,
                profile_img_url=get_s3_bucket_prefix() + doctor.profile_img_key if doctor.profile_img_key else None,
                first_name=doctor.first_name,
                specialisation=doctor.specialisation.specialisation,
                is_liked=doctor.id in liked_ids,
                avg_rating=avg_rating if isinstance(avg_rating, float) else None,
                ratings_count=cnt,
            )
        )

    return DoctorsPaginatedResponse(doctors=doctor_previews, next_cursor=next_cursor, has_more=has_more)


@misc_router.post("/doctors/{doctor_id}/like")
async def like_doctor(
    doctor_id: UUID,
    db: AsyncSession = Depends(get_db),
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
):
    doctor = (
        await db.execute(select(VolunteerDoctor).where(VolunteerDoctor.id == doctor_id, VolunteerDoctor.is_active))
    ).scalar_one_or_none()

    if doctor is None:
        return {"doctor_id": str(doctor_id), "is_liked": False, "detail": "Doctor not Found"}

    existing = (
        await db.execute(
            select(SavedVolunteerDoctor).where(
                SavedVolunteerDoctor.mother_id == mother.id, SavedVolunteerDoctor.volunteer_doctor_id == doctor_id
            )
        )
    ).scalar_one_or_none()

    if existing is None:
        db.add(SavedVolunteerDoctor(mother_id=mother.id, volunteer_doctor_id=doctor.id))
        await db.commit()
    return {"doctor_id": str(doctor_id), "is_liked": True}


@misc_router.delete("/doctors/{doctor_id}/like")
async def unlike_doctor(
    doctor_id: UUID,
    db: AsyncSession = Depends(get_db),
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
):
    stmt = delete(SavedVolunteerDoctor).where(
        SavedVolunteerDoctor.mother_id == mother.id,
        SavedVolunteerDoctor.volunteer_doctor_id == doctor_id,
    )
    await db.execute(stmt)
    await db.commit()

    return {"doctor_id": str(doctor_id), "is_liked": False}


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

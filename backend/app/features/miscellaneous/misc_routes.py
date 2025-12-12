from fastapi import APIRouter, Depends
from sqlalchemy import null, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.db_config import get_db
from app.db.db_schema import MCRNumber, VolunteerDoctor
from app.features.miscellaneous.misc_models import DoctorPreviewData
from app.shared.s3_storage_interface import S3StorageInterface

misc_router = APIRouter(tags=["Miscellaneous"])


@misc_router.get("/avail-mcr", response_model=list[str])
async def get_available_mcr_numbers(db: AsyncSession = Depends(get_db)) -> list[str]:
    stmt = select(MCRNumber).where(MCRNumber.doctor == null)
    all_mcr_obj = (await db.execute(stmt)).scalars().all()
    return [mcr_obj.value for mcr_obj in all_mcr_obj]


@misc_router.get("/doctors", response_model=list[DoctorPreviewData])
async def list_of_doctors(db: AsyncSession = Depends(get_db)) -> list[DoctorPreviewData]:
    stmt = select(VolunteerDoctor).where(VolunteerDoctor.is_active)  # type: ignore
    doctors = (await db.execute(stmt)).scalars().all()

    return [
        DoctorPreviewData(
            doctor_id=doctor.id,
            profile_img_url=(
                S3StorageInterface.get_presigned_url(doctor.profile_img_key, 30) if doctor.profile_img_key else None
            ),
            first_name=doctor.first_name,
            is_liked=False,  # TODO
        )
        for doctor in doctors
    ]


@misc_router.get("/")
async def index():
    return "Ping!"

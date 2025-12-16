from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import null, select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List, Any

from app.db.db_config import get_db
from app.db.db_schema import MCRNumber, VolunteerDoctor
from app.features.miscellaneous.misc_models import DoctorPreviewData
from app.shared.s3_storage_interface import S3StorageInterface
from app.shared.utils import get_s3_bucket_prefix

from app.db.db_schema import Page
from sqlalchemy.orm import Session

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
            # profile_img_url=(
            #     S3StorageInterface.get_presigned_url(doctor.profile_img_key, 30) if doctor.profile_img_key else None
            # ),
            profile_img_url=get_s3_bucket_prefix() + doctor.profile_img_key if doctor.profile_img_key else None,
            first_name=doctor.first_name,
            is_liked=False,  # TODO
        )
        for doctor in doctors
    ]


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
            page = Page(
                slug=slug,
                sections=data.sections,
                background_image=data.background_image
            )
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
            "message": "Page saved successfully"
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
        "page": {
            "id": page.id,
            "slug": page.slug,
            "sections": page.sections,
            "background_image": page.background_image
        }
    }

@router.get("/pages")
async def get_all_pages(db: AsyncSession = Depends(get_db)):
    """Get all pages"""
    result = await db.execute(select(Page))
    pages = result.scalars().all()
    return {
        "pages": [
            {
                "id": p.id,
                "slug": p.slug,
                "sections": p.sections
            }
            for p in pages
        ]
    }

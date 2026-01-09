from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from starlette import status

from app.core.security import require_role
from app.db.db_config import get_db
from app.db.db_schema import Admin
from app.features.admin.admin_models import (
    CreateDoctorSpecialisationRequest,
    DoctorModel,
    DoctorSpecialisationModel,
    MerchantModel,
    MotherModel,
    UpdateDoctorSpecialisationRequest,
    UserModel,
)
from app.features.admin.admin_service import AdminService

admin_router = APIRouter(prefix="/admin", tags=["Admin"])


def get_admin_service(db: AsyncSession = Depends(get_db)) -> AdminService:
    return AdminService(db)


@admin_router.get("/users/roles")
async def get_user_roles(_: Admin = Depends(require_role(Admin)), service: AdminService = Depends(get_admin_service)):
    return await service.get_user_roles()


@admin_router.get("/users/doctors", response_model=list[DoctorModel])
async def get_all_doctors(
    _: Admin = Depends(require_role(Admin)),
    service: AdminService = Depends(get_admin_service),
) -> list[DoctorModel]:
    return await service.get_all_doctors()


@admin_router.get("/users/mothers", response_model=list[MotherModel])
async def get_all_mothers(
    _: Admin = Depends(require_role(Admin)),
    service: AdminService = Depends(get_admin_service),
) -> list[MotherModel]:
    return await service.get_all_mothers()


@admin_router.get("/users/nutrionists", response_model=list[UserModel])
async def get_all_nutritionists(
    _: Admin = Depends(require_role(Admin)),
    service: AdminService = Depends(get_admin_service),
) -> list[UserModel]:
    return await service.get_all_nutritionists()


@admin_router.get("/users/merchants", response_model=list[MerchantModel])
async def get_all_merchants(
    _: Admin = Depends(require_role(Admin)),
    service: AdminService = Depends(get_admin_service),
) -> list[MerchantModel]:
    return await service.get_all_merchants()


@admin_router.post("/users/{user_id}/suspend", status_code=status.HTTP_204_NO_CONTENT)
async def suspend_user(
    user_id: UUID,
    _: Admin = Depends(require_role(Admin)),
    db: AsyncSession = Depends(get_db),
    service: AdminService = Depends(get_admin_service),
) -> None:
    try:
        await service.set_user_is_active(user_id, False)
        await db.commit()
    except Exception:
        await db.rollback()
        raise


@admin_router.post("/users/{user_id}/unsuspend", status_code=status.HTTP_204_NO_CONTENT)
async def unsuspend_user(
    user_id: UUID,
    _: Admin = Depends(require_role(Admin)),
    db: AsyncSession = Depends(get_db),
    service: AdminService = Depends(get_admin_service),
) -> None:
    try:
        await service.set_user_is_active(user_id, True)
        await db.commit()
    except Exception:
        await db.rollback()
        raise


@admin_router.get("/specialisations", response_model=list[DoctorSpecialisationModel])
async def get_all_specialisations(
    _: Admin = Depends(require_role(Admin)),
    service: AdminService = Depends(get_admin_service),
) -> list[DoctorSpecialisationModel]:
    return await service.get_all_specialisations()


@admin_router.post("/specialisations", response_model=DoctorSpecialisationModel, status_code=status.HTTP_201_CREATED)
async def create_specialisation(
    request: CreateDoctorSpecialisationRequest,
    _: Admin = Depends(require_role(Admin)),
    db: AsyncSession = Depends(get_db),
    service: AdminService = Depends(get_admin_service),
) -> DoctorSpecialisationModel:
    try:
        result = await service.create_specialisation(request.specialisation.strip())
        await db.commit()
        return result
    except Exception:
        await db.rollback()
        raise


@admin_router.patch("/specialisations/{specialisation_id}", response_model=DoctorSpecialisationModel)
async def update_specialisation(
    specialisation_id: int,
    request: UpdateDoctorSpecialisationRequest,
    _: Admin = Depends(require_role(Admin)),
    db: AsyncSession = Depends(get_db),
    service: AdminService = Depends(get_admin_service),
) -> DoctorSpecialisationModel:
    try:
        result = await service.update_specialisation(specialisation_id, request.specialisation.strip())
        await db.commit()
        return result
    except Exception:
        await db.rollback()
        raise


@admin_router.delete("/specialisations/{specialisation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_specialisation(
    specialisation_id: int,
    _: Admin = Depends(require_role(Admin)),
    db: AsyncSession = Depends(get_db),
    service: AdminService = Depends(get_admin_service),
) -> None:
    try:
        await service.delete_specialisation(specialisation_id)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

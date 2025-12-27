from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.db_config import get_db
from app.db.db_schema import Admin
from app.features.admin.admin_models import DoctorModel, MotherModel, UserModel
from app.features.admin.admin_service import AdminService

admin_router = APIRouter(prefix="/admin", tags=["Admin"])


def get_admin_service(db: AsyncSession = Depends(get_db)) -> AdminService:
    return AdminService(db)


@admin_router.get("/users/roles")
async def get_user_roles(
    _: Admin = Depends(require_role(Admin)), admin_service: AdminService = Depends(get_admin_service)
):
    return await admin_service.get_user_roles()


@admin_router.get("/users/doctors", response_model=list[DoctorModel])
async def get_all_doctors(
    _: Admin = Depends(require_role(Admin)),
    admin_service: AdminService = Depends(get_admin_service),
) -> list[DoctorModel]:
    return await admin_service.get_all_doctors()


@admin_router.get("/users/mothers", response_model=list[MotherModel])
async def get_all_mothers(
    _: Admin = Depends(require_role(Admin)),
    admin_service: AdminService = Depends(get_admin_service),
) -> list[MotherModel]:
    return await admin_service.get_all_mothers()


@admin_router.get("/users/nutrionists", response_model=list[UserModel])
async def get_all_nutritionists(
    _: Admin = Depends(require_role(Admin)),
    admin_service: AdminService = Depends(get_admin_service),
) -> list[UserModel]:
    return await admin_service.get_all_nutritionists()

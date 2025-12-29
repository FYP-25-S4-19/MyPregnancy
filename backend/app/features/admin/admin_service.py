from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.db_schema import Nutritionist, PregnantWoman, User, UserRole, VolunteerDoctor
from app.features.admin.admin_models import DoctorModel, MotherModel, UserModel
from app.shared.utils import format_user_fullname


class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_roles(self):
        return [entry.value for entry in UserRole]

    async def get_all_doctors(self) -> list[DoctorModel]:
        result = await self.db.execute(select(VolunteerDoctor).options(selectinload(VolunteerDoctor.mcr_no)))
        doctors = result.scalars().all()
        return [
            DoctorModel(
                id=doctor.id,
                name=format_user_fullname(doctor),
                created_at=doctor.created_at,
                is_active=doctor.is_active,
                mcr_no=doctor.mcr_no.value,
            )
            for doctor in doctors
        ]

    async def get_all_mothers(self) -> list[MotherModel]:
        result = await self.db.execute(select(PregnantWoman))
        mothers = result.scalars().all()
        return [
            MotherModel(
                id=mother.id,
                name=format_user_fullname(mother),
                created_at=mother.created_at,
                is_active=mother.is_active,
                due_date=mother.due_date,
                date_of_birth=mother.date_of_birth,
            )
            for mother in mothers
        ]

    async def get_all_nutritionists(self) -> list[UserModel]:
        result = await self.db.execute(select(Nutritionist))
        nutritionists = result.scalars().all()
        return [
            UserModel(
                id=nutritionist.id,
                name=format_user_fullname(nutritionist),
                created_at=nutritionist.created_at,
                is_active=nutritionist.is_active,
            )
            for nutritionist in nutritionists
        ]

    async def set_user_is_active(self, user_id: UUID, is_active: bool) -> None:
        result = await self.db.execute(select(User).filter_by(id=user_id))
        user = result.scalars().first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user.is_active = is_active

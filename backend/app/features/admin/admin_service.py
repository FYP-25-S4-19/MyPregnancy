from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.db_schema import (
    DoctorSpecialisation,
    Merchant,
    Nutritionist,
    PregnantWoman,
    User,
    UserRole,
    VolunteerDoctor,
)
from app.features.admin.admin_models import (
    DoctorModel,
    DoctorSpecialisationModel,
    MerchantModel,
    MotherModel,
    UserModel,
)
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

    async def get_all_merchants(self) -> list[MerchantModel]:
        result = await self.db.execute(select(Merchant))
        merchants = result.scalars().all()
        return [
            MerchantModel(
                id=merchant.id,
                name=format_user_fullname(merchant),
                created_at=merchant.created_at,
                is_active=merchant.is_active,
            )
            for merchant in merchants
        ]

    async def set_user_is_active(self, user_id: UUID, is_active: bool) -> None:
        result = await self.db.execute(select(User).filter_by(id=user_id))
        user = result.scalars().first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        user.is_active = is_active

    async def get_all_specialisations(self) -> list[DoctorSpecialisationModel]:
        result = await self.db.execute(select(DoctorSpecialisation).order_by(DoctorSpecialisation.specialisation))
        specialisations = result.scalars().all()
        return [
            DoctorSpecialisationModel(
                id=spec.id,
                specialisation=spec.specialisation,
            )
            for spec in specialisations
        ]

    async def create_specialisation(self, specialisation: str) -> DoctorSpecialisationModel:
        # Check if specialisation already exists
        result = await self.db.execute(
            select(DoctorSpecialisation).where(DoctorSpecialisation.specialisation == specialisation)
        )
        existing = result.scalars().first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Specialisation already exists",
            )

        new_spec = DoctorSpecialisation(specialisation=specialisation)
        self.db.add(new_spec)
        await self.db.flush()

        return DoctorSpecialisationModel(
            id=new_spec.id,
            specialisation=new_spec.specialisation,
        )

    async def update_specialisation(self, specialisation_id: int, specialisation: str) -> DoctorSpecialisationModel:
        result = await self.db.execute(select(DoctorSpecialisation).where(DoctorSpecialisation.id == specialisation_id))
        spec = result.scalars().first()
        if not spec:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Specialisation not found",
            )

        # Check if new name already exists (and it's not the same spec being updated)
        result = await self.db.execute(
            select(DoctorSpecialisation).where(DoctorSpecialisation.specialisation == specialisation)
        )
        existing = result.scalars().first()
        if existing and existing.id != specialisation_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Specialisation name already exists",
            )

        spec.specialisation = specialisation
        await self.db.flush()

        return DoctorSpecialisationModel(
            id=spec.id,
            specialisation=spec.specialisation,
        )

    async def delete_specialisation(self, specialisation_id: int) -> None:
        result = await self.db.execute(select(DoctorSpecialisation).where(DoctorSpecialisation.id == specialisation_id))
        spec = result.scalars().first()
        if not spec:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Specialisation not found",
            )

        # Check if any doctors have this specialisation
        doctor_count = await self.db.execute(
            select(VolunteerDoctor).where(VolunteerDoctor.specialisation_id == specialisation_id)
        )
        doctors = doctor_count.scalars().all()
        if doctors:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot delete specialisation. {len(doctors)} doctor(s) have this specialisation.",
            )

        await self.db.delete(spec)

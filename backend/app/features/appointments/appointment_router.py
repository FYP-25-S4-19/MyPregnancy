from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from stream_chat import StreamChat

from app.core.clients import get_stream_client
from app.core.security import require_role
from app.db.db_config import get_db
from app.db.db_schema import PregnantWoman, User, VolunteerDoctor
from app.features.appointments.appointment_models import (
    AcceptRejectAppointmentRequest,
    AppointmentResponse,
    CreateAppointmentRequest,
    CreateAppointmentResponse,
    EditAppointmentRequest,
)
from app.features.appointments.appointment_service import AppointmentService

appointments_router = APIRouter(prefix="/appointments", tags=["Appointments"])


def get_appointment_service(db: AsyncSession = Depends(get_db)) -> AppointmentService:
    return AppointmentService(db)


@appointments_router.post("/", status_code=status.HTTP_201_CREATED, response_model=CreateAppointmentResponse)
async def create_appointment(
    request: CreateAppointmentRequest,
    service: AppointmentService = Depends(get_appointment_service),
    db: AsyncSession = Depends(get_db),
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
) -> CreateAppointmentResponse:
    try:
        appt_id = await service.create_appointment_request(
            doctor_id=request.doctor_id,
            requester_id=mother.id,
            start_time=request.start_time,
        )
        await db.commit()
        return CreateAppointmentResponse(appointment_id=appt_id)
    except:
        await db.rollback()
        raise


@appointments_router.get("/", response_model=list[AppointmentResponse])
async def get_all_appointments(
    service: AppointmentService = Depends(get_appointment_service), user: User = Depends(require_role(User))
) -> list[AppointmentResponse]:
    return await service.get_all_appointments(user)


@appointments_router.patch("/", status_code=status.HTTP_204_NO_CONTENT)
async def edit_appointment_start_time(
    request: EditAppointmentRequest,
    service: AppointmentService = Depends(get_appointment_service),
    db: AsyncSession = Depends(get_db),
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
) -> None:
    try:
        await service.edit_appointment_start_time(request, mother.id)
        await db.commit()
    except:
        await db.rollback()
        raise


@appointments_router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_appointment(
    appointment_id: UUID,
    service: AppointmentService = Depends(get_appointment_service),
    db: AsyncSession = Depends(get_db),
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
) -> None:
    try:
        await service.delete_appointment(appointment_id, mother.id)
        await db.commit()
    except:
        await db.rollback()
        raise


@appointments_router.patch("/{appointment_id}/accept", status_code=status.HTTP_204_NO_CONTENT)
async def accept_appointment(
    appointment_id: UUID,
    request: AcceptRejectAppointmentRequest,
    service: AppointmentService = Depends(get_appointment_service),
    db: AsyncSession = Depends(get_db),
    stream_client: StreamChat = Depends(get_stream_client),
    doctor: VolunteerDoctor = Depends(require_role(VolunteerDoctor)),
) -> None:
    try:
        await service.accept_appointment(
            appointment_id=appointment_id,
            message_id=request.message_id,
            doctor_id=doctor.id,
            stream_client=stream_client,
        )
        await db.commit()
    except:
        await db.rollback()
        raise


@appointments_router.patch("/{appointment_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
async def reject_appointment(
    appointment_id: UUID,
    request: AcceptRejectAppointmentRequest,
    service: AppointmentService = Depends(get_appointment_service),
    db: AsyncSession = Depends(get_db),
    stream_client: StreamChat = Depends(get_stream_client),
    doctor: VolunteerDoctor = Depends(require_role(VolunteerDoctor)),
) -> None:
    try:
        await service.reject_appointment(
            appointment_id=appointment_id,
            message_id=request.message_id,
            doctor_id=doctor.id,
            stream_client=stream_client,
        )
        await db.commit()
    except:
        await db.rollback()
        raise

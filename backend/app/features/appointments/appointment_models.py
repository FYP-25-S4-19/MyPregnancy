from datetime import datetime
from uuid import UUID

from app.core.custom_base_model import CustomBaseModel


class CreateAppointmentRequest(CustomBaseModel):
    doctor_id: UUID
    start_time: datetime


class CreateAppointmentResponse(CustomBaseModel):
    appointment_id: UUID


class AppointmentPreviewData(CustomBaseModel):
    appointment_id: UUID
    date_time: datetime
    doctor_fname: str
    status: str


class AcceptRejectAppointmentRequest(CustomBaseModel):
    message_id: UUID


class AppointmentResponse(CustomBaseModel):
    appointment_id: UUID

    doctor_id: UUID
    doctor_name: str

    mother_id: UUID
    mother_name: str
    mother_due_date: datetime | None

    start_time: datetime
    status: str


class EditAppointmentRequest(CustomBaseModel):
    appointment_id: UUID
    new_start_time: datetime

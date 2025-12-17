from dataclasses import dataclass
from datetime import date

from app.core.custom_base_model import CustomBaseModel


@dataclass
class BloodPressureData:
    systolic: int
    diastolic: int


class ScalarMetricUpsert(CustomBaseModel):
    metric_id: int
    value: float


@dataclass
class BinaryMetricView:
    metric_id: int
    label: str
    category: str
    is_selected: bool


@dataclass
class BinaryMetricCategoryGroup:
    category: str
    binary_metric_logs: list[BinaryMetricView]


@dataclass
class ScalarMetricView:
    metric_id: int
    label: str
    value: float
    unit_of_measurement: str


class JournalPreviewData(CustomBaseModel):
    bp_systolic: int | None
    bp_diastolic: int | None
    sugar_level: int
    heart_rate: int
    weight: int
    kick_count: int | None


class GetJournalEntryResponse(CustomBaseModel):
    id: int
    logged_on: date
    content: str
    binary_metrics: list[BinaryMetricCategoryGroup]
    scalar_metrics: list[ScalarMetricView]
    blood_pressure: BloodPressureData


class UpsertJournalEntryRequest(CustomBaseModel):
    content: str | None = None
    binary_metric_ids: list[int] | None = None
    scalar_metrics: list[ScalarMetricUpsert] | None = None
    blood_pressure: BloodPressureData | None = None

"""Risk prediction API schemas."""

import re
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class RiskPredictionRequest(BaseModel):
    """Request model for risk prediction."""

    age: float = Field(..., gt=0, le=150, description="Age in years")
    systolic_bp: Optional[float] = Field(None, ge=0, le=300, description="Systolic blood pressure (mmHg)")
    diastolic_bp: Optional[float] = Field(None, ge=0, le=300, description="Diastolic blood pressure (mmHg)")
    blood_pressure: Optional[str] = Field(
        None,
        description="Optional combined blood pressure string, e.g. '116/73' (mmHg). If provided, it will be parsed into systolic_bp/diastolic_bp.",
    )
    bs: float = Field(..., ge=0, le=50, description="Blood sugar level (mmol/L)")
    heart_rate: float = Field(..., gt=0, le=250, description="Heart rate (bpm)")

    @model_validator(mode="after")
    def _populate_bp_from_string(self):
        # If client provides separate numbers, keep them.
        if self.systolic_bp is not None and self.diastolic_bp is not None:
            return self

        if not self.blood_pressure:
            raise ValueError("Provide either systolic_bp & diastolic_bp, or blood_pressure like '116/73'.")

        match = re.search(r"(?P<sbp>\d+(?:\.\d+)?)\s*/\s*(?P<dbp>\d+(?:\.\d+)?)", self.blood_pressure)
        if not match:
            raise ValueError("blood_pressure must look like '116/73'.")

        sbp = float(match.group("sbp"))
        dbp = float(match.group("dbp"))

        if not (0 <= sbp <= 300):
            raise ValueError("systolic_bp out of range (0-300).")
        if not (0 <= dbp <= 300):
            raise ValueError("diastolic_bp out of range (0-300).")

        self.systolic_bp = sbp
        self.diastolic_bp = dbp
        return self

    class Config:
        json_schema_extra = {
            "example": {
                "age": 28,
                "systolic_bp": 130,
                "diastolic_bp": 85,
                "bs": 5.6,
                "heart_rate": 78,
            }
        }


class RiskPredictionResponse(BaseModel):
    """Response model for risk prediction.

    - `risk_level`: one of 'low', 'mid', 'high'
    - `probabilities`: per-class probabilities (keys: 'low','mid','high')
    - `is_high_risk` and `risk_probability` are included for backward compatibility
    """

    risk_level: str = Field(..., description="One of: low, mid, high")
    probabilities: dict = Field(..., description="Per-class probabilities, e.g. {'low':0.7,'mid':0.2,'high':0.1}")
    message: str = Field(..., description="Human-readable risk assessment message")
    mean_bp: float = Field(..., description="Calculated mean blood pressure (mmHg)")

    # Backwards-compatible fields
    is_high_risk: Optional[bool] = Field(None, description="True if high risk detected")
    risk_probability: Optional[float] = Field(None, ge=0, le=1, description="Probability of high risk (0-1)")

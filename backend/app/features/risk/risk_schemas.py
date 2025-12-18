"""
Risk prediction API schemas.
"""

from typing import Optional

from pydantic import BaseModel, Field


class RiskPredictionRequest(BaseModel):
    """Request model for risk prediction."""

    age: float = Field(..., gt=0, le=150, description="Age in years")
    systolic_bp: float = Field(..., ge=0, le=300, description="Systolic blood pressure (mmHg)")
    diastolic_bp: float = Field(..., ge=0, le=300, description="Diastolic blood pressure (mmHg)")
    bs: float = Field(..., ge=0, le=50, description="Blood sugar level (mmol/L)")
    heart_rate: float = Field(..., gt=0, le=250, description="Heart rate (bpm)")

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

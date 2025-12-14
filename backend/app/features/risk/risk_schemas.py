"""
Risk prediction API schemas.
"""

from pydantic import BaseModel, Field
from typing import Optional


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
    """Response model for risk prediction."""
    is_high_risk: bool = Field(..., description="True if high risk detected")
    risk_probability: float = Field(..., ge=0, le=1, description="Probability of high risk (0-1)")
    message: str = Field(..., description="Human-readable risk assessment message")
    mean_bp: float = Field(..., description="Calculated mean blood pressure (mmHg)")

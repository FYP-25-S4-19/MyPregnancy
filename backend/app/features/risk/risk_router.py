"""
Risk prediction API endpoints.
Provides model inference for pregnancy health risk assessment.
"""

from fastapi import APIRouter, HTTPException, status
from loguru import logger
import numpy as np
import joblib
from pathlib import Path
from typing import Optional

from .risk_schemas import RiskPredictionRequest, RiskPredictionResponse

router = APIRouter(prefix="/risk", tags=["Risk Assessment"])

# Model and scaler cache
_MODEL = None
_SCALER = None
_LOAD_ERROR = None

# Paths
MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "ml" / "models"
MODEL_PATH = MODELS_DIR / "risk_model.joblib"
SCALER_PATH = MODELS_DIR / "risk_scaler.joblib"


def load_model_artifacts():
    """Load model and scaler from disk (once)."""
    global _MODEL, _SCALER, _LOAD_ERROR
    
    if _MODEL is not None and _SCALER is not None:
        return
    
    try:
        if not MODEL_PATH.exists():
            _LOAD_ERROR = f"Model file not found: {MODEL_PATH}. Please run train_risk_model.py first."
            logger.error(_LOAD_ERROR)
            return
        
        if not SCALER_PATH.exists():
            _LOAD_ERROR = f"Scaler file not found: {SCALER_PATH}. Please run train_risk_model.py first."
            logger.error(_LOAD_ERROR)
            return
        
        _MODEL = joblib.load(MODEL_PATH)
        _SCALER = joblib.load(SCALER_PATH)
        logger.info(f"✓ Risk model loaded from {MODEL_PATH}")
        logger.info(f"✓ Scaler loaded from {SCALER_PATH}")
    except Exception as e:
        _LOAD_ERROR = f"Failed to load model artifacts: {str(e)}"
        logger.error(_LOAD_ERROR)


@router.post(
    "/predict",
    response_model=RiskPredictionResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict pregnancy health risk",
    description="Predict high-risk pregnancy based on vital signs and health metrics"
)
async def predict_risk(request: RiskPredictionRequest) -> RiskPredictionResponse:
    """
    Predict pregnancy health risk based on vital signs.
    
    Returns:
        RiskPredictionResponse with risk assessment
        
    Raises:
        HTTPException: If model is not available or inference fails
    """
    # Load model on first call
    load_model_artifacts()
    
    if _MODEL is None or _SCALER is None:
        logger.error(f"Model not available: {_LOAD_ERROR}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_LOAD_ERROR or "Risk prediction model not available. Please train the model first."
        )
    
    try:
        # Calculate mean blood pressure
        mean_bp = (request.systolic_bp + request.diastolic_bp) / 2.0
        
        # Prepare features in the same order as training
        features = np.array(
            [[request.age, mean_bp, request.bs, request.heart_rate]],
            dtype=np.float64
        )
        
        # Scale features using the loaded scaler
        features_scaled = _SCALER.transform(features)
        
        # Get prediction and probability
        prediction = int(_MODEL.predict(features_scaled)[0])
        
        # Get probability for high risk class
        if hasattr(_MODEL, "predict_proba"):
            probabilities = _MODEL.predict_proba(features_scaled)[0]
            risk_probability = float(probabilities[1])  # Probability of class 1 (high risk)
        else:
            # Fallback: use decision function and sigmoid
            decision = _MODEL.decision_function(features_scaled)[0]
            risk_probability = float(1 / (1 + np.exp(-decision)))
        
        is_high_risk = bool(prediction == 1)
        
        # Generate human-readable message
        if is_high_risk:
            message = f"High risk detected (confidence: {risk_probability*100:.1f}%). Please consult with your healthcare provider."
        else:
            message = f"Low risk assessment (confidence: {(1-risk_probability)*100:.1f}%). Continue with regular monitoring."
        
        return RiskPredictionResponse(
            is_high_risk=is_high_risk,
            risk_probability=risk_probability,
            message=message,
            mean_bp=mean_bp
        )
        
    except Exception as e:
        logger.error(f"Risk prediction error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk prediction failed: {str(e)}"
        )


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Check risk model availability",
    description="Check if risk prediction model is loaded and available"
)
async def health_check():
    """Check if risk model is available."""
    load_model_artifacts()
    
    return {
        "status": "healthy" if _MODEL is not None and _SCALER is not None else "unavailable",
        "model_loaded": _MODEL is not None,
        "scaler_loaded": _SCALER is not None,
        "error": _LOAD_ERROR
    }

"""
Risk prediction API endpoints.

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


from fastapi.responses import JSONResponse

@router.post(
    "/predict",
    status_code=status.HTTP_200_OK,
    summary="Predict pregnancy health risk",
    description="Predict high-risk pregnancy based on vital signs and health metrics"
)
async def predict_risk(request: RiskPredictionRequest) -> JSONResponse:
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

        # Prepare features as DataFrame to preserve feature names
        import pandas as pd
        features_df = pd.DataFrame([
            {
                "Age": float(request.age),
                "MeanBP": float(mean_bp),
                "BS": float(request.bs),
                "HeartRate": float(request.heart_rate),
            }
        ])

        # Reindex to scaler feature order if available (prevents sklearn warnings)
        if hasattr(_SCALER, "feature_names_in_"):
            features_df = features_df.reindex(columns=list(getattr(_SCALER, "feature_names_in_")))

        logger.info(f"Input features for prediction: {features_df.to_dict(orient='records')[0]}")

        # Scale features using the loaded scaler
        features_scaled = _SCALER.transform(features_df)

        # Get raw prediction
        pred = int(_MODEL.predict(features_scaled)[0])

        # Map numeric classes to labels using label map if present
        label_map_path = MODELS_DIR / "risk_label_map.joblib"
        if label_map_path.exists():
            num_to_label = {v: k for k, v in joblib.load(label_map_path).items()}
        else:
            num_to_label = {0: "low", 1: "mid", 2: "high"}

        # Compute per-class probabilities
        class_probs = {"low": 0.0, "mid": 0.0, "high": 0.0}
        if hasattr(_MODEL, "predict_proba"):
            probs = _MODEL.predict_proba(features_scaled)[0]
            for class_idx, prob in zip(_MODEL.classes_, probs):
                label = num_to_label.get(int(class_idx), str(class_idx))
                class_probs[label] = float(prob)
        else:
            # Fallback: set predicted class probability to 1.0
            label = num_to_label.get(pred, str(pred))
            class_probs[label] = 1.0

        # Determine risk level and probability
        risk_level = max(class_probs, key=lambda k: class_probs[k])
        risk_probability = float(class_probs.get("high", 0.0))
        is_high_risk = risk_level == "high"

        # Message: exact text for high risk
        if risk_level == "high":
            message = "go to nearby hospital for checkup"
        else:
            message = f"{risk_level.capitalize()} risk assessment. Please follow up as needed."

        response_data = {
            "risk_level": risk_level,
            "probabilities": class_probs,
            "message": message,
            "mean_bp": float(mean_bp),
            "is_high_risk": is_high_risk,
            "risk_probability": risk_probability,
        }

        logger.info(f"Risk prediction response (pre-validate): {response_data}")

        return JSONResponse(status_code=status.HTTP_200_OK, content=response_data)
        
    except Exception as e:
        logger.exception(f"Risk prediction error: {str(e)}")
        safe = {
            "risk_level": "low",
            "probabilities": {"low": 1.0, "mid": 0.0, "high": 0.0},
            "message": "Assessment unavailable due to an internal error. Please try again.",
            "mean_bp": float(locals().get("mean_bp", 0.0)),
            "is_high_risk": False,
            "risk_probability": 0.0,
        }
        logger.info("Returning safe fallback after exception: %s", safe)
        return JSONResponse(status_code=status.HTTP_200_OK, content=safe)


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

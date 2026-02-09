"""Risk prediction API endpoints."""

from __future__ import annotations

from pathlib import Path

import joblib
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse
from loguru import logger

from .risk_schemas import RiskPredictionRequest

router = APIRouter(prefix="/risk", tags=["Risk Assessment"])

# Model and scaler cache
_MODEL = None
_SCALER = None
_LOAD_ERROR = None

# Paths
MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "ml" / "models"
MODEL_PATH = MODELS_DIR / "risk_model.joblib"
SCALER_PATH = MODELS_DIR / "risk_scaler.joblib"


def _rule_based_risk_override(*, systolic_bp: float, diastolic_bp: float, bs: float, heart_rate: float) -> str | None:
    """Clinical heuristics override.

    Mirrors the rules used during training label derivation in `app/ml/train_risk_model.py`.

    Returns: "high" | "mid" | None
    """

    # High-risk overrides
    if bs < 4.0:
        return "high"
    if heart_rate > 120:
        return "high"
    if systolic_bp > 160 or diastolic_bp > 100:
        return "high"
    if systolic_bp < 80 or diastolic_bp < 50:
        return "high"

    # Mid-risk overrides
    if 100 < heart_rate <= 120:
        return "mid"
    if systolic_bp > 140 or diastolic_bp > 90:
        return "mid"
    if systolic_bp < 90 or diastolic_bp < 60:
        return "mid"

    return None


def _more_severe_risk(a: str, b: str) -> str:
    order = {"low": 0, "mid": 1, "high": 2}
    return a if order.get(a, 0) >= order.get(b, 0) else b


def _build_features_df(request: RiskPredictionRequest):
    """Build a single-row DataFrame of features for model/scaler.

    Supports both:
    - newer artifacts trained on [Age,SystolicBP,DiastolicBP,BS,HeartRate]
    - older artifacts trained on [Age,MeanBP,BS,HeartRate]
    """

    import pandas as pd

    sbp = float(request.systolic_bp)
    dbp = float(request.diastolic_bp)
    mean_bp = (sbp + dbp) / 2.0

    df = pd.DataFrame(
        [
            {
                "Age": float(request.age),
                "SystolicBP": sbp,
                "DiastolicBP": dbp,
                "MeanBP": mean_bp,
                "BS": float(request.bs),
                "HeartRate": float(request.heart_rate),
            }
        ]
    )
    return df, mean_bp


def load_model_artifacts() -> None:
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
    status_code=status.HTTP_200_OK,
    summary="Predict pregnancy health risk",
    description="Predict high-risk pregnancy based on vital signs and health metrics",
)
async def predict_risk(request: RiskPredictionRequest) -> JSONResponse:
    load_model_artifacts()

    if _MODEL is None or _SCALER is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=_LOAD_ERROR or "Risk prediction model not available. Please train the model first.",
        )

    try:
        features_df, mean_bp = _build_features_df(request)

        # Align to scaler's expected feature order, if available.
        if hasattr(_SCALER, "feature_names_in_"):
            expected = list(getattr(_SCALER, "feature_names_in_"))
            features_df = features_df.reindex(columns=expected)

            # Backfill any NaNs introduced by reindexing.
            backfill = {
                "Age": float(request.age),
                "SystolicBP": float(request.systolic_bp),
                "DiastolicBP": float(request.diastolic_bp),
                "MeanBP": float(mean_bp),
                "BS": float(request.bs),
                "HeartRate": float(request.heart_rate),
            }
            for col, value in backfill.items():
                if col in features_df.columns and features_df[col].isna().any():
                    features_df[col] = value

        logger.info("Input features for prediction: {}", features_df.to_dict(orient="records")[0])

        # Scale features
        features_scaled = _SCALER.transform(features_df)

        # Predict
        pred = int(_MODEL.predict(features_scaled)[0])

        # Label mapping
        label_map_path = MODELS_DIR / "risk_label_map.joblib"
        if label_map_path.exists():
            num_to_label = {v: k for k, v in joblib.load(label_map_path).items()}
        else:
            num_to_label = {0: "low", 1: "mid", 2: "high"}

        # Probabilities (if available)
        model_probs = {"low": 0.0, "mid": 0.0, "high": 0.0}
        if hasattr(_MODEL, "predict_proba"):
            probs = _MODEL.predict_proba(features_scaled)[0]
            for class_idx, prob in zip(_MODEL.classes_, probs):
                label = num_to_label.get(int(class_idx), str(class_idx))
                model_probs[label] = float(prob)
        else:
            label = num_to_label.get(pred, str(pred))
            model_probs[label] = 1.0

        risk_level = max(model_probs, key=lambda k: model_probs[k])

        # Clinical override so extreme SBP/DBP can't be masked by MeanBP.
        override_level = _rule_based_risk_override(
            systolic_bp=float(request.systolic_bp),
            diastolic_bp=float(request.diastolic_bp),
            bs=float(request.bs),
            heart_rate=float(request.heart_rate),
        )
        if override_level is not None:
            risk_level = _more_severe_risk(risk_level, override_level)

        # Keep probabilities consistent with final risk level when overridden.
        if override_level is not None and risk_level in {"mid", "high"}:
            class_probs = {"low": 0.0, "mid": 0.0, "high": 0.0}
            class_probs[risk_level] = 1.0
        else:
            class_probs = model_probs

        risk_probability = float(class_probs.get("high", 0.0))
        is_high_risk = risk_level == "high"

        if risk_level == "high":
            message = "go to nearby hospital for checkup"
        else:
            message = f"{risk_level.capitalize()} risk assessment. Please follow up as needed."

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "risk_level": risk_level,
                "probabilities": class_probs,
                "model_probabilities": model_probs,
                "rule_override": override_level,
                "message": message,
                "mean_bp": float(mean_bp),
                "is_high_risk": is_high_risk,
                "risk_probability": risk_probability,
            },
        )

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
        logger.info("Returning safe fallback after exception: {}", safe)
        return JSONResponse(status_code=status.HTTP_200_OK, content=safe)


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Check risk model availability",
    description="Check if risk prediction model is loaded and available",
)
async def health_check():
    load_model_artifacts()
    return {
        "status": "healthy" if _MODEL is not None and _SCALER is not None else "unavailable",
        "model_loaded": _MODEL is not None,
        "scaler_loaded": _SCALER is not None,
        "error": _LOAD_ERROR,
    }

# Risk Model - Training & Deployment

This document explains how to train the risk prediction model and where artifacts are placed.

Files added:
- `app/ml/train_risk_model.py` - Trainer script (uses `health_v1.csv` dataset).
- `app/ml/health_v1.csv` - Training dataset (committed for convenience).
- `app/ml/models/` - Directory where `risk_model.joblib`, `risk_scaler.joblib` and `risk_label_map.joblib` will be saved.
- `app/features/risk/risk_router.py` - FastAPI route for `/risk/predict` and `/risk/health`.

Notes on behavior:
- The trainer now produces a 3-class model ("low", "mid", "high") and saves a label map (`risk_label_map.joblib`). The router applies runtime safety overrides from clinician-defined rules (e.g. extreme BP, BS, HR thresholds) and returns `risk_level` and per-class `probabilities`. If the result is "high", the returned message will be: `go to nearby hospital for checkup`. 

How to train (recommended: inside Docker):

1) Build the backend image (this will install scikit-learn, pandas, numpy, joblib from `pyproject.toml`):

```powershell
# From project root
docker-compose build backend
```

2) Run the training script inside the backend container (this will create model artifacts under `app/ml/models`):

```powershell
# From project root
docker-compose run --rm backend python app/ml/train_risk_model.py app/ml/health_v1.csv
```

3) After training, you should see the artifacts:

```
backend/app/ml/models/risk_model.joblib
backend/app/ml/models/risk_scaler.joblib
```

4) Start the backend normally and verify the model is loaded by visiting:

- `GET /risk/health` -> returns JSON indicating `model_loaded` and `scaler_loaded`.

- `POST /risk/predict` with JSON body like:
```json
{
  "age": 28,
  "systolic_bp": 130,
  "diastolic_bp": 85,
  "bs": 5.6,
  "heart_rate": 78
}
```

Notes & Tips:
- If your container build fails installing scikit-learn, ensure the builder stage has the necessary system packages (we already install `build-essential` and `python3-dev`). If needed, add `libatlas-base-dev` or `gfortran` depending on the OS/wheel availability.
- You can also run the training script locally if you prefer a local Python environment; install the dependencies via pip/poetry first:

```bash
python -m pip install scikit-learn pandas numpy joblib
python backend/app/ml/train_risk_model.py backend/app/ml/health_v1.csv
```

- Consider treating the model artifacts as part of your deployable image (so production containers already have the model), or place them on S3 and download at startup (there is already an S3 helper at `app/shared/s3_storage_interface.py`).

If you'd like, I can also add a CI job that trains the model and uploads artifacts to a storage location.

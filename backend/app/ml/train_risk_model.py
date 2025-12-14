"""
Risk prediction model trainer.
Trains logistic regression model on health metrics data.
Exports model and scaler to joblib files.
"""

import os
import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from pathlib import Path


# Paths
SCRIPT_DIR = Path(__file__).resolve().parent
MODEL_DIR = SCRIPT_DIR / "models"
MODEL_PATH = MODEL_DIR / "risk_model.joblib"
SCALER_PATH = MODEL_DIR / "risk_scaler.joblib"


def train_and_export(csv_path: str = "health_v1.csv") -> dict:
  
    # Ensure model directory exists
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    
    # Read dataset
    data = pd.read_csv(csv_path)
    
    # Trim whitespace from column names
    data.columns = [c.strip() for c in data.columns]
    
    # Check if required columns exist
    required = ["Age", "SystolicBP", "DiastolicBP", "BS", "HeartRate", "RiskLevel"]
    missing = [c for c in required if c not in data.columns]
    if missing:
        raise KeyError(f"Missing required columns in CSV: {missing}")
    
    # Drop rows with missing values
    data = data.dropna(subset=required)
    
    # Feature engineering: calculate mean blood pressure
    data["MeanBP"] = (data["SystolicBP"] + data["DiastolicBP"]) / 2.0
    
    # Prepare features
    X = data[["Age", "MeanBP", "BS", "HeartRate"]]
    
    # Prepare target: convert RiskLevel to binary (1 = high risk, 0 = low risk)
    rl = data["RiskLevel"].astype(str).str.lower().str.strip()
    y_numeric = pd.to_numeric(rl, errors="coerce")
    
    if y_numeric.notna().any():
        # If numeric values exist, convert to 0/1 (non-zero -> 1)
        y = (y_numeric.fillna(0) != 0).astype(int)
    else:
        # Otherwise, textual mapping: treat any value containing 'high' as 1
        y = rl.map(lambda v: 1 if "high" in v else 0).astype(int)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    predictions = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, predictions)
    report = classification_report(y_test, predictions)
    
    # Export model and scaler
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    
    print(f"✓ Model saved to {MODEL_PATH}")
    print(f"✓ Scaler saved to {SCALER_PATH}")
    print(f"\nAccuracy: {accuracy:.4f}")
    print(f"\n{report}")
    
    return {
        "accuracy": float(accuracy),
        "classification_report": report,
        "model_path": str(MODEL_PATH),
        "scaler_path": str(SCALER_PATH),
    }


if __name__ == "__main__":
    import sys
    csv_path = sys.argv[1] if len(sys.argv) > 1 else "health_v1.csv"
    try:
        train_and_export(csv_path)
    except Exception as e:
        print(f"Error training model: {e}")
        sys.exit(1)

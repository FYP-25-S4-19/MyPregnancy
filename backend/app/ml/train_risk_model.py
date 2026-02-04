"""
Risk prediction model trainer.
Trains logistic regression model on health metrics data.
Exports model and scaler to joblib files.
changes:
blood pressure lower than 90/60 is considered mid risk. any thing below this is high risk.
blood pressure above 140/90 is considered mid risk. anything above this is high risk.
sugar level below 4 is hish risk
for heart rate if above 40 is high risk.
for heart rate if anything above 120 is high risk. anything between 100-120 is mid risk.
for confidence replace it with (go to nearby hospital for checkup)
"""

from pathlib import Path

import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

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

    # Prepare features (use SBP/DBP directly instead of MeanBP so extremes aren't masked)
    X = data[["Age", "SystolicBP", "DiastolicBP", "BS", "HeartRate"]]

    # Prepare multi-class target (low=0, mid=1, high=2) with rule-based overrides
    data["RiskLevel"].astype(str).str.lower().str.strip()

    def derive_label(row):
        """Apply clinical heuristics (overrides) to derive a risk label for training.
        High-risk overrides take precedence, then mid-risk. Unknown falls back to CSV label or 'low'.
        Rules implemented:
        - High risk if: BS < 4.0 OR HR > 120 OR SBP > 160 OR DBP > 100 OR SBP < 80 OR DBP < 50
        - Mid risk if: HR in (100, 120] OR SBP > 140 OR DBP > 90 OR SBP < 90 OR DBP < 60
        (Note: the earlier 'HR > 40' rule is ignored as requested.)
        """
        sbp = float(row["SystolicBP"])
        dbp = float(row["DiastolicBP"])
        bs_val = float(row["BS"])
        hr = float(row["HeartRate"])

        # High-risk overrides
        if bs_val < 4.0:
            return "high"
        if hr > 120:
            return "high"
        if sbp > 160 or dbp > 100:
            return "high"
        if sbp < 80 or dbp < 50:
            return "high"

        # Mid-risk overrides
        if 100 < hr <= 120:
            return "mid"
        if sbp > 140 or dbp > 90:
            return "mid"
        if sbp < 90 or dbp < 60:
            return "mid"

        # Fallback to CSV label if available
        txt = str(row.get("RiskLevel", "")).lower()
        if "high" in txt:
            return "high"
        if "mid" in txt:
            return "mid"
        return "low"

    data["derived_label"] = data.apply(derive_label, axis=1)

    label_to_num = {"low": 0, "mid": 1, "high": 2}
    y = data["derived_label"].map(label_to_num).astype(int)

    # Show class distribution
    class_counts = y.value_counts().to_dict()
    print(f"Class distribution (derived labels): {class_counts}")

    # Split data with stratify to keep class ratios in train/test when possible
    try:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    except ValueError:
        # If stratify fails (e.g., too few samples in a class), fall back to non-stratified split
        print("Warning: stratify split failed (not enough samples per class). Falling back to unstratified split.")
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train multi-class model (attempt multinomial solver; fallback to default if unsupported)
    # Use class_weight to help with imbalanced classes
    try:
        model = LogisticRegression(
            max_iter=1000, random_state=42, multi_class="multinomial", solver="lbfgs", class_weight="balanced"
        )
    except TypeError:
        # Older scikit-learn versions may not support some params; fall back but keep class_weight if available
        print(
            "Warning: installed scikit-learn does not support one or more parameters; falling back to a simpler LogisticRegression constructor with class_weight if available."
        )
        try:
            model = LogisticRegression(max_iter=1000, random_state=42, class_weight="balanced")
        except TypeError:
            model = LogisticRegression(max_iter=1000, random_state=42)

    model.fit(X_train_scaled, y_train)

    # Evaluate
    predictions = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, predictions)
    report = classification_report(y_test, predictions, target_names=["low", "mid", "high"])

    # Print model classes and some diagnostics to help debugging (e.g., missing 'mid')
    try:
        print(f"model.classes_: {getattr(model, 'classes_', None)}")
    except Exception:
        pass

    # Show confusion matrix counts for further insight
    try:
        from sklearn.metrics import confusion_matrix

        cm = confusion_matrix(y_test, predictions, labels=[0, 1, 2])
        print("Confusion matrix (rows=true, cols=pred) for [low,mid,high]:")
        print(cm)
    except Exception:
        pass

    # Export label map as well for consistent runtime mapping
    LABEL_MAP_PATH = MODEL_DIR / "risk_label_map.joblib"
    joblib.dump(label_to_num, LABEL_MAP_PATH)

    # Export model and scaler
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    print(f"✓ Model saved to {MODEL_PATH}")
    print(f"✓ Scaler saved to {SCALER_PATH}")
    print(f"✓ Label map saved to {LABEL_MAP_PATH}")
    print(f"\nAccuracy: {accuracy:.4f}")
    print(f"\n{report}")

    return {
        "accuracy": float(accuracy),
        "classification_report": report,
        "model_path": str(MODEL_PATH),
        "scaler_path": str(SCALER_PATH),
        "label_map_path": str(LABEL_MAP_PATH),
    }


if __name__ == "__main__":
    import sys

    csv_path = sys.argv[1] if len(sys.argv) > 1 else "health_v1.csv"
    try:
        train_and_export(csv_path)
    except Exception as e:
        print(f"Error training model: {e}")
        sys.exit(1)

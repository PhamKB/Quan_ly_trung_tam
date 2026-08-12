"""
CLI Inference Script for Trained Student Score Prediction Model (V1).
Uses the 11 UCI Student Performance features to perform inference on student_score_model-1.joblib.
"""
import sys
import json
import os
import warnings
warnings.filterwarnings('ignore')

import joblib
import pandas as pd
import numpy as np

REQUIRED_FEATURES = [
    "studytime",
    "failures",
    "absences",
    "G1",
    "school",
    "sex",
    "age",
    "internet",
    "higher",
    "goout",
    "health"
]

def load_model():
    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../models/student_score_model-1.joblib"))
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model artifact not found at {model_path}")
    return joblib.load(model_path)

def predict_from_dict(input_dict):
    # Validate missing features
    missing = [f for f in REQUIRED_FEATURES if f not in input_dict]
    if missing:
        raise ValueError(f"Missing required features: {missing}")

    # Coerce types and validate ranges
    try:
        studytime = int(input_dict["studytime"])
        failures = int(input_dict["failures"])
        absences = int(input_dict["absences"])
        G1 = float(input_dict["G1"])
        school = str(input_dict["school"]).strip()
        sex = str(input_dict["sex"]).strip()
        age = int(input_dict["age"])
        internet = str(input_dict["internet"]).strip()
        higher = str(input_dict["higher"]).strip()
        goout = int(input_dict["goout"])
        health = int(input_dict["health"])
    except Exception as e:
        raise ValueError(f"Invalid feature data type: {e}")

    if not (1 <= studytime <= 4):
        raise ValueError("studytime must be between 1 and 4")
    if not (0 <= failures <= 4):
        raise ValueError("failures must be between 0 and 4")
    if not (0 <= absences <= 100):
        raise ValueError("absences must be between 0 and 100")
    if not (0 <= G1 <= 20):
        raise ValueError("G1 must be between 0 and 20")
    if school not in ["GP", "MS"]:
        raise ValueError("school must be 'GP' or 'MS'")
    if sex not in ["F", "M"]:
        raise ValueError("sex must be 'F' or 'M'")
    if not (10 <= age <= 30):
        raise ValueError("age must be between 10 and 30")
    if internet not in ["yes", "no"]:
        raise ValueError("internet must be 'yes' or 'no'")
    if higher not in ["yes", "no"]:
        raise ValueError("higher must be 'yes' or 'no'")
    if not (1 <= goout <= 5):
        raise ValueError("goout must be between 1 and 5")
    if not (1 <= health <= 5):
        raise ValueError("health must be between 1 and 5")

    df = pd.DataFrame([{
        "studytime": studytime,
        "failures": failures,
        "absences": absences,
        "G1": G1,
        "school": school,
        "sex": sex,
        "age": age,
        "internet": internet,
        "higher": higher,
        "goout": goout,
        "health": health
    }])

    model = load_model()
    raw_pred = model.predict(df)[0]
    clipped_pred = float(np.clip(raw_pred, 0.0, 20.0))
    return round(clipped_pred, 2)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            raw_input = sys.argv[1]
            input_dict = json.loads(raw_input)
            score = predict_from_dict(input_dict)
            output = {
                "success": True,
                "predictedScore": score,
                "modelVersion": "1.0.0",
                "modelName": "Random Forest Regressor"
            }
            print(json.dumps(output))
        except Exception as err:
            output = {
                "success": False,
                "error": str(err)
            }
            print(json.dumps(output))
            sys.exit(1)
    else:
        print("Usage: python predict.py '<json_input>'")
        sys.exit(1)

"""
Predictor Module for ML Inference Service V1.
Runs pipeline.predict() on valid input features.
"""

import math
import warnings
warnings.filterwarnings('ignore')
import pandas as pd
from model_loader import model_loader

def predict(feature_data: dict) -> dict:
    model = model_loader.get_model()
    metadata = model_loader.get_metadata()

    input_df = pd.DataFrame([feature_data])
    raw_pred = model.predict(input_df)[0]

    # Validate output numerical integrity
    if math.isnan(raw_pred) or math.isinf(raw_pred):
        raise ValueError("Kết quả dự đoán mô hình không hợp lệ (NaN hoặc Infinity).")

    predicted_score = round(float(raw_pred), 2)
    # Clip to valid 0-20 scale
    predicted_score = max(0.0, min(20.0, predicted_score))

    return {
        "prediction": predicted_score,
        "model_name": metadata.get("model_name", "Random Forest"),
        "model_version": metadata.get("version", "v1.0.0"),
        "target": metadata.get("target", "G3")
    }

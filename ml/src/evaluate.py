"""
Model Evaluation and Metrics Audit Script.
"""
import os
import json
import joblib
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

def evaluate_saved_model():
    model_path = os.path.join(os.path.dirname(__file__), "../models/student_score_model.joblib")
    if not os.path.exists(model_path):
        print("Model file not found. Please run train.py first.")
        return
    
    pipeline = joblib.load(model_path)
    print(f"Loaded trained model version: {pipeline.get('version')}")
    print("Features used:", pipeline.get('feature_names'))

if __name__ == "__main__":
    evaluate_saved_model()

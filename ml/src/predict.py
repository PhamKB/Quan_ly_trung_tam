"""
CLI Inference Script for Trained Student Score Prediction Model.
"""
import sys
import json
import os
import joblib
import pandas as pd

def predict_score(hours_study, attendance, homework_completion, midterm_score):
    model_path = os.path.join(os.path.dirname(__file__), "../models/student_score_model.joblib")
    pipeline = joblib.load(model_path)
    
    input_df = pd.DataFrame([{
        "hours_study": float(hours_study),
        "attendance": float(attendance),
        "homework_completion": float(homework_completion),
        "midterm_score": float(midterm_score)
    }])
    
    X_scaled = pipeline["preprocessor"].transform(input_df)
    pred = pipeline["model"].predict(X_scaled)[0]
    return round(float(pred), 2)

if __name__ == "__main__":
    if len(sys.argv) == 5:
        score = predict_score(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
        print(json.dumps({"predicted_final_score": score, "model_version": "1.0.0"}))
    else:
        print("Usage: python predict.py <hours_study> <attendance> <homework_completion> <midterm_score>")

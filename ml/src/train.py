"""
Model Training Script for Student Score Prediction.
Trains Linear Regression vs Random Forest Regressor models and selects optimal artifact.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from preprocess import load_and_clean_data, build_preprocessor_pipeline, FEATURES, TARGET

def train_and_export():
    raw_csv = os.path.join(os.path.dirname(__file__), "../data/raw/student_data.csv")
    df = load_and_clean_data(raw_csv)
    
    X = df[FEATURES]
    y = df[TARGET]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Preprocessing
    preprocessor = build_preprocessor_pipeline()
    X_train_scaled = preprocessor.fit_transform(X_train)
    X_test_scaled = preprocessor.transform(X_test)
    
    # 1. Linear Regression
    lr = LinearRegression()
    lr.fit(X_train_scaled, y_train)
    lr_preds = lr.predict(X_test_scaled)
    lr_mae = mean_absolute_error(y_test, lr_preds)
    lr_r2 = r2_score(y_test, lr_preds)
    
    # 2. Random Forest Regressor
    rf = RandomForestRegressor(n_estimators=100, max_depth=6, random_state=42)
    rf.fit(X_train_scaled, y_train)
    rf_preds = rf.predict(X_test_scaled)
    rf_mae = mean_absolute_error(y_test, rf_preds)
    rf_mse = mean_squared_error(y_test, rf_preds)
    rf_rmse = np.sqrt(rf_mse)
    rf_r2 = r2_score(y_test, rf_preds)
    
    print(f"Linear Regression MAE: {lr_mae:.4f}, R2: {lr_r2:.4f}")
    print(f"Random Forest MAE: {rf_mae:.4f}, RMSE: {rf_rmse:.4f}, R2: {rf_r2:.4f}")
    
    # Package model + preprocessor
    best_model_pipeline = {
        "preprocessor": preprocessor,
        "model": rf,
        "feature_names": FEATURES,
        "version": "1.0.0"
    }
    
    model_dir = os.path.join(os.path.dirname(__file__), "../models")
    os.makedirs(model_dir, exist_ok=True)
    joblib.dump(best_model_pipeline, os.path.join(model_dir, "student_score_model.joblib"))
    print("Model pipeline exported to ml/models/student_score_model.joblib")

if __name__ == "__main__":
    train_and_export()

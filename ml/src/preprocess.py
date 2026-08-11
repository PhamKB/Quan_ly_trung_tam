"""
Data Preprocessing Pipeline for Student Score Prediction ML Model.
Handles feature scaling, missing value imputation, and feature matrix preparation.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer

FEATURES = ["hours_study", "attendance", "homework_completion", "midterm_score"]
TARGET = "final_score"

def build_preprocessor_pipeline():
    """Builds and returns standard scikit-learn preprocessing pipeline."""
    pipeline = Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    return pipeline

def load_and_clean_data(file_path):
    """Loads CSV raw student dataset and validates data ranges."""
    df = pd.read_csv(file_path)
    # Clip values to realistic ranges
    df['hours_study'] = df['hours_study'].clip(0, 30)
    df['attendance'] = df['attendance'].clip(0, 100)
    df['homework_completion'] = df['homework_completion'].clip(0, 100)
    df['midterm_score'] = df['midterm_score'].clip(0, 10)
    if TARGET in df.columns:
        df['final_score'] = df['final_score'].clip(0, 10)
    return df

"""
Model Loader Module for Machine Learning Inference Service.
Loads joblib model artifact and metadata from disk.
"""

import os
import json
import joblib

MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../models/student_score_model-1.joblib"))
METADATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../models/model_metadata.json"))

class ModelLoader:
    def __init__(self):
        self.model = None
        self.metadata = None
        self.load_artifacts()

    def load_artifacts(self):
        if not os.path.exists(MODEL_PATH):
            print(f"[ERROR] SERVICE STARTUP FAIL: Model artifact missing at {MODEL_PATH}")
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

        if not os.path.exists(METADATA_PATH):
            print(f"[ERROR] SERVICE STARTUP FAIL: Metadata missing at {METADATA_PATH}")
            raise FileNotFoundError(f"Metadata file not found at {METADATA_PATH}")

        try:
            self.model = joblib.load(MODEL_PATH)
            with open(METADATA_PATH, 'r', encoding='utf-8') as f:
                self.metadata = json.load(f)

            print("========================================")
            print("AI MODEL READY")
            print(f"Model: {self.metadata.get('model_name', 'Random Forest')}")
            print(f"Version: {self.metadata.get('version', 'v1.0.0')}")
            print(f"Target: {self.metadata.get('target', 'G3')}")
            print("========================================")
        except Exception as e:
            print(f"[ERROR] SERVICE STARTUP FAIL: Failed to load model artifact: {str(e)}")
            raise e

    def get_model(self):
        return self.model

    def get_metadata(self):
        return self.metadata

model_loader = ModelLoader()

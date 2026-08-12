"""
Automated Test Suite for ML Model Inference & Schema Governance (Python).
Runs tests on student_score_model-1.joblib and model_metadata.json.
"""
import os
import sys
import json
import unittest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))
from predict import load_model, predict_from_dict, REQUIRED_FEATURES

class TestMLModelInference(unittest.TestCase):

    def setUp(self):
        self.model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../models/student_score_model-1.joblib"))
        self.metadata_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../models/model_metadata.json"))
        self.valid_input = {
            "studytime": 3,
            "failures": 0,
            "absences": 2,
            "G1": 14,
            "school": "GP",
            "sex": "F",
            "age": 15,
            "internet": "yes",
            "higher": "yes",
            "goout": 3,
            "health": 4
        }

    def test_01_artifact_exists(self):
        """Test if the production model artifact file exists."""
        self.assertTrue(os.path.exists(self.model_path), f"Artifact missing: {self.model_path}")

    def test_02_metadata_exists_and_valid(self):
        """Test if model metadata exists and matches version and feature schema."""
        self.assertTrue(os.path.exists(self.metadata_path), f"Metadata missing: {self.metadata_path}")
        with open(self.metadata_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)
        self.assertEqual(metadata.get("version"), "v1.0.0")
        self.assertEqual(metadata.get("model_name"), "Random Forest")
        self.assertEqual(len(metadata.get("features")), 11)
        self.assertEqual(sorted(metadata.get("features")), sorted(REQUIRED_FEATURES))

    def test_03_model_loading(self):
        """Test loading model artifact without error."""
        model = load_model()
        self.assertIsNotNone(model)

    def test_04_prediction_valid_range(self):
        """Test prediction output is numeric and bounded in [0, 20]."""
        score = predict_from_dict(self.valid_input)
        self.assertIsInstance(score, float)
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 20.0)

    def test_05_prediction_repeatability(self):
        """Test prediction repeatability across multiple calls with same input."""
        res1 = predict_from_dict(self.valid_input)
        res2 = predict_from_dict(self.valid_input)
        res3 = predict_from_dict(self.valid_input)
        self.assertEqual(res1, res2)
        self.assertEqual(res2, res3)

    def test_06_invalid_input_missing_feature(self):
        """Test missing feature raises ValueError."""
        invalid = self.valid_input.copy()
        del invalid["G1"]
        with self.assertRaises(ValueError):
            predict_from_dict(invalid)

    def test_07_invalid_input_out_of_range(self):
        """Test out of range value raises ValueError."""
        invalid = self.valid_input.copy()
        invalid["G1"] = 25  # G1 must be 0-20
        with self.assertRaises(ValueError):
            predict_from_dict(invalid)

    def test_08_invalid_input_wrong_type(self):
        """Test wrong category raises ValueError."""
        invalid = self.valid_input.copy()
        invalid["school"] = "INVALID_SCHOOL"
        with self.assertRaises(ValueError):
            predict_from_dict(invalid)

if __name__ == "__main__":
    unittest.main()

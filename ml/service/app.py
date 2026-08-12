"""
Flask Application for Python ML Inference Service V1.
Exposes POST /predict and GET /model-info endpoints on port 5001.
"""

import sys
import json
import warnings
warnings.filterwarnings('ignore')

from flask import Flask, request, jsonify
from model_loader import model_loader
from schemas import validate_features
from predictor import predict

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    meta = model_loader.get_metadata()
    return jsonify({
        "status": "ok",
        "service": "Smart Education ML Inference Service",
        "model_name": meta.get("model_name", "Random Forest"),
        "version": meta.get("version", "v1.0.0")
    })

@app.route('/model-info', methods=['GET'])
def model_info():
    return jsonify(model_loader.get_metadata())

@app.route('/predict', methods=['POST'])
def handle_predict():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Dữ liệu JSON không hợp lệ hoặc rỗng."}), 400

    is_valid, result = validate_features(data)
    if not is_valid:
        return jsonify({"error": result}), 400

    try:
        pred_result = predict(result)
        return jsonify(pred_result), 200
    except Exception as e:
        return jsonify({"error": f"Lỗi dự đoán từ mô hình Machine Learning: {str(e)}"}), 500

if __name__ == '__main__':
    # CLI mode fallback execution
    if len(sys.argv) > 1 and sys.argv[1] == '--cli':
        if len(sys.argv) > 2:
            try:
                raw_input = json.loads(sys.argv[2])
                valid, cleaned = validate_features(raw_input)
                if not valid:
                    print(json.dumps({"error": cleaned}))
                    sys.exit(1)
                res = predict(cleaned)
                print(json.dumps(res))
                sys.exit(0)
            except Exception as ex:
                print(json.dumps({"error": str(ex)}))
                sys.exit(1)
        else:
            print(json.dumps({"error": "Thiếu tham số dữ liệu JSON cho CLI."}))
            sys.exit(1)

    print("Starting ML Inference Service on http://127.0.0.1:5001 ...")
    app.run(host='127.0.0.1', port=5001, debug=False)

# BÁO CÁO KIỂM TOÁN HỆ THỐNG & TRẠNG THÁI TRIỂN KHAI
## SMART EDUCATION CENTER MANAGEMENT SYSTEM (HỆ THỐNG QUẢN LÝ TRUNG TÂM GIÁO DỤC THCS)

---

## 1. TRẠNG THÁI CÁC CHECKPOINT HIỆN TẠI

```text
CHECKPOINT 0 — System Audit & Scope
PASS

CHECKPOINT 1 — Firebase Firestore + Seed THCS
PASS

CHECKPOINT 1.5 — Security & Data Integrity Verification
PASS

CHECKPOINT 2 — Firebase Authentication + RBAC
PASS

CHECKPOINT 2.5 — Build & Runtime Verification
PASS

CHECKPOINT 3 — Machine Learning Integration (V1 Model Artifact Inference)
PASS

CHECKPOINT 3.5 — ML Verification, Monitoring & Model Governance
PASS
```

---

## 2. KẾT QUẢ TRIỂN KHAI CHECKPOINT 3 & 3.5

### 2.1. Machine Learning Inference Engine V1
- **Artifact**: `ml/models/student_score_model-1.joblib` (Random Forest Regressor, `scikit-learn==1.6.1`).
- **Metadata**: `ml/models/model_metadata.json` (v1.0.0).
- **UCI Feature Schema**: 11 đặc trưng bắt buộc (`studytime`, `failures`, `absences`, `G1`, `school`, `sex`, `age`, `internet`, `higher`, `goout`, `health`).
- **Elimination of Legacy Code**: Xóa bỏ hoàn toàn phụ thuộc runtime vào `student_score_model.json`. Engine Node.js thực thi trực tiếp qua Python CLI bridge `ml/src/predict.py`.

### 2.2. Kiểm Thử Tự Động (Automated Testing Suite)
- **TypeScript Vitest (`npm test`)**: 9/9 tests PASS (`src/ai/tests/model_verification.test.ts`).
  - Nạp artifact & metadata.
  - Schema 11 đặc trưng UCI.
  - Tính lặp lại kết quả (Repeatability 100%).
  - Kiểm tra xả lỗi dữ liệu đầu vào không hợp lệ (Bad range, missing field, bad category -> HTTP 400).
  - Kiểm tra tính toán sai số tuyệt đối (Absolute Error).
- **Python Unittest (`python3 ml/tests/test_inference.py`)**: 8/8 tests PASS.

### 2.3. Model Monitoring & Actual Score Evaluation
- **REST APIs**:
  - `POST /api/ai/predict-score` (Dự đoán từ 11 đặc trưng).
  - `POST /api/ai/predictions/:id/evaluate` (Nhập điểm thực tế & tính `absoluteError`).
  - `GET /api/ai/predictions-history` (Lịch sử dự đoán).
  - `GET /api/ai/model-info` (Metadata mô hình).
  - `GET /api/ai/model-registry` (Danh sách registry & governance).
  - `GET /api/ai/monitoring` (Thống kê real-time MAE, median error, evaluated count).
- **RBAC Security**: Vai trò `ACCOUNTANT` bị chặn 100% (`403 Forbidden`). Học sinh chỉ được xem kết quả của chính mình (IDOR Protection).

### 2.4. Giao Diện Người Dùng (Frontend UI - `AiPlanner.tsx`)
- Biểu mẫu nhập 11 chỉ số UCI dự đoán ML V1.
- Dashboard Giám Sát Mô Hình & Tracking với các thẻ KPI: Tổng số dự đoán, Số lượt đã đánh giá, Real MAE, Phiên bản V1.
- Bảng lịch sử so sánh điểm dự đoán vs điểm thực tế kèm Modal "Nhập điểm thực tế".
- Banner minh bạch Disclaimer cho dữ liệu V1 UCI Student Performance Dataset.

---

## 3. TÀI LIỆU KIẾN TRÚC & NOTEBOOKS
- `docs/ML_INTEGRATION.md`: Tài liệu tích hợp ML & REST APIs.
- `docs/ML_MODEL_GOVERNANCE.md`: Quy trình quản trị mô hình, monitoring & rollback.
- `docs/notebooks/04_ML_Inference_V1.ipynb`: Notebook thực thi suy luận V1.
- `docs/notebooks/05_ML_Verification_Monitoring.ipynb`: Notebook kiểm định & giám sát mô hình.

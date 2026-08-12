# TÀI LIỆU TÍCH HỢP MACHINE LEARNING (ML INTEGRATION & MONITORING DOCS)

## 1. TỔNG QUAN KIẾN TRÚC MÔ HÌNH ML V1 (CHECKPOINT 3.5)

Hệ thống quản lý trung tâm đào tạo tích hợp mô hình Machine Learning V1 thực tế để dự đoán điểm thi cuối kỳ (G3) của học viên dựa trên 11 chỉ số chuẩn hóa từ tập dữ liệu chuẩn UCI Student Performance Dataset, đồng thời bổ sung toàn bộ quy trình kiểm định, giám sát thực tế (Model Monitoring) và quản trị phiên bản (Model Governance).

### Luồng xử lý Inference & Monitoring Pipeline:
```
[React Frontend (AiPlanner.tsx)]
        ↓ REST API (POST /api/ai/predict-score)
[Backend Express (server.ts)]
        ↓ RBAC Check (Blocked for ACCOUNTANT)
[StudentScoreService (src/ai/service/student_score_service.ts)]
        ↓ child_process.execSync (Python CLI Mode)
[Python Inference Engine (ml/src/predict.py)]
        ↓ Model Loader (student_score_model-1.joblib & model_metadata.json)
[Prediction Record Storage: ai_predictions collection]
        ↓ Actual Score Evaluation (POST /api/ai/predictions/:id/evaluate)
[Real MAE & Monitoring Metrics Generation (GET /api/ai/monitoring)]
```

---

## 2. THÔNG TIN MODEL & ARTIFACTS

- **Model File**: `ml/models/student_score_model-1.joblib`
- **Metadata File**: `ml/models/model_metadata.json`
- **Thuật toán**: Random Forest Regressor (`scikit-learn==1.6.1`)
- **Tập dữ liệu**: UCI Student Performance Dataset (`student-mat.csv`)
- **Metrics độ chính xác Huấn luyện**:
  - MAE (Mean Absolute Error): 1.53
  - RMSE (Root Mean Squared Error): 2.05
  - R² Score: 0.795

---

## 3. FEATURE SCHEMA BẮT BUỘC (11 ĐẶC TRƯNG UCI)

| STT | Tên đặc trưng | Kiểu dữ liệu | Miền giá trị | Mô tả |
|-----|---------------|--------------|--------------|-------|
| 1 | `studytime` | int | 1 - 4 | Thời gian tự học / tuần (1: <2h, 2: 2-5h, 3: 5-10h, 4: >10h) |
| 2 | `failures` | int | 0 - 4 | Số lần học phần/môn học không đạt trước đây |
| 3 | `absences` | int | 0 - 100 | Số buổi nghỉ học / vắng mặt |
| 4 | `G1` | float/int | 0 - 20 | Điểm đợt 1 / Điểm giữa kỳ (scale 0-20) |
| 5 | `school` | string | 'GP' \| 'MS' | Trường học (GP: Gabriel Pereira, MS: Mousinho da Silveira) |
| 6 | `sex` | string | 'F' \| 'M' | Giới tính (F: Nữ, M: Nam) |
| 7 | `age` | int | 10 - 30 | Tuổi của học sinh |
| 8 | `internet` | string | 'yes' \| 'no' | Có kết nối Internet tại nhà hay không |
| 9 | `higher` | string | 'yes' \| 'no' | Có nguyện vọng học tiếp Đại học/Cao đẳng |
| 10 | `goout` | int | 1 - 5 | Mức độ đi chơi với bạn bè (1: Rất ít -> 5: Rất nhiều) |
| 11 | `health` | int | 1 - 5 | Tình trạng sức khỏe hiện tại (1: Rất kém -> 5: Rất tốt) |

---

## 4. QUY TRÌNH KIỂM ĐỊNH TỰ ĐỘNG (AUTOMATED TEST SUITE)

Hệ thống bổ sung bộ kiểm thử tự động hai lớp (Vitest TypeScript + Python Unittest):

1. **Vitest Suite (`npm test`)**:
   - `src/ai/tests/model_verification.test.ts`:
     - Kiểm tra sự tồn tại của file artifact `.joblib` và metadata.
     - Xác minh feature schema đúng 11 đặc trưng UCI.
     - Kiểm tra khả năng thực thi và miền giá trị đầu ra [0, 20].
     - Kiểm tra tính lặp lại (Repeatability): cùng đầu vào ra cùng kết quả 100%.
     - Kiểm tra bắt lỗi đầu vào không hợp lệ (Missing field, Out of range, Wrong categorical).
     - Kiểm tra tính toán sai số tuyệt đối (Absolute Error = |predicted - actual|).

2. **Python Unittest (`python3 ml/tests/test_inference.py`)**:
   - Chạy 8 bài kiểm thử trực tiếp trên engine Python với artifact `student_score_model-1.joblib`.

---

## 5. CÁC API REST HOÀN CHỈNH (CHECKPOINT 3.5)

| Endpoint | Method | Mô tả | Phân quyền RBAC |
|----------|--------|-------|-----------------|
| `/api/ai/predict-score` | POST | Thực thi dự đoán từ 11 đặc trưng | ngoại trừ ACCOUNTANT |
| `/api/ai/predictions/:id/evaluate` | POST | Nhập điểm thực tế & tính MAE thực tế | ADMIN, ACADEMIC_STAFF, TEACHER |
| `/api/ai/predictions-history` | GET | Xem nhật ký lịch sử dự đoán | ngoại trừ ACCOUNTANT |
| `/api/ai/model-info` | GET | Thông tin metadata mô hình V1 | ngoại trừ ACCOUNTANT |
| `/api/ai/model-registry` | GET | Quản trị registry phiên bản V1 | ngoại trừ ACCOUNTANT |
| `/api/ai/monitoring` | GET | Thống kê real-time MAE & monitoring | ngoại trừ ACCOUNTANT |

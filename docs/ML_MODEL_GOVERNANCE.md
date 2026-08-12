# CHÍNH SÁCH QUẢN TRỊ MÔ HÌNH MACHINE LEARNING (MODEL GOVERNANCE & POLICY)

## 1. TỔNG QUAN VỀ QUẢN TRỊ MÔ HÌNH V1

Tài liệu này quy định các tiêu chuẩn quản trị, kiểm soát phiên bản và giám sát chất lượng cho mô hình Machine Learning **Random Forest Regressor V1** được sử dụng trong Hệ Thống Quản Lý Trung Tâm Đào Tạo.

- **Tên mô hình**: Random Forest Regressor (Dự đoán điểm thi)
- **Phiên bản hiện tại**: `v1.0.0`
- **Đường dẫn Artifact**: `ml/models/student_score_model-1.joblib`
- **Metadata**: `ml/models/model_metadata.json`
- **Tập dữ liệu chuẩn**: UCI Student Performance Dataset (`student-mat.csv`)
- **Ngày phát hành**: 2026-08-12

---

## 2. NGUYÊN TẮC QUẢN TRỊ VÀ BẢO MẬT (GOVERNANCE PRINCIPLES)

1. **Phân quyền vai trò (RBAC Security)**:
   - Vai trò **Kế toán (ACCOUNTANT)** bị nghiêm cấm hoàn toàn truy cập vào các tính năng dự đoán AI và dữ liệu kiểm toán ML.
   - Vai trò **Giáo viên (TEACHER)** và **Cán bộ Giáo vụ (ACADEMIC_STAFF)** được phép chạy dự đoán và nhập điểm thi thực tế để phục vụ theo dõi học tập.
   - Vai trò **Học sinh (STUDENT)** chỉ được phép xem kết quả dự đoán của chính mình.

2. **Ghi nhật ký và kiểm toán (Audit Trail)**:
   - Tất cả các lượt thực thi suy luận (`predict-score`) đều phải ghi lại bản ghi kiểm toán chứa: mã lượt dự đoán, mã học viên, 11 tham số đầu vào, điểm số dự đoán, phiên bản mô hình, người thực hiện và thời điểm thực thi.

3. **Theo dõi điểm thực tế & Tính toán sai số (Prediction vs Actual Tracking)**:
   - Khi kết thúc kỳ thi, giáo viên hoặc giáo vụ nhập điểm thực tế thông qua API `POST /api/ai/predictions/:id/evaluate`.
   - Hệ thống tự động tính toán sai số tuyệt đối `absoluteError = |predictedScore - actualScore|`.

---

## 3. CHỈ SỐ GIÁM SÁT REAL-TIME (MONITORING METRICS)

Hệ thống cung cấp API `GET /api/ai/monitoring` tính toán real-time các chỉ số sau:

- **Total Predictions**: Tổng số lượt thực thi mô hình.
- **Evaluated Predictions**: Số lượt dự đoán đã có điểm thi thực tế.
- **Real MAE (Mean Absolute Error)**: Sai số tuyệt đối trung bình giữa điểm dự đoán và điểm thực tế.
- **Median Error**: Trung vị của các sai số tuyệt đối.
- **Average Predicted vs Actual Score**: So sánh điểm số trung bình dự đoán với điểm số thực tế.

---

## 4. KỊCH BẢN PHỤC HỒI / ROLLBACK MÔ HÌNH

Trong trường hợp phát hiện sai số thực tế (Real MAE) vượt quá ngưỡng an toàn (> 3.0 điểm):
1. Quản trị viên (ADMIN) truy cập giao diện Model Registry.
2. Kiểm tra trạng thái phiên bản và chuyển đổi mô hình về phiên bản an toàn trước đó nếu có.
3. Trong phiên bản V1 hiện tại, phiên bản `v1.0.0` là phiên bản gốc chính thức được hỗ trợ rollback và gắn cờ disclaimer minh bạch.

---

## 5. THÔNG BÁO MINH BẠCH V1 (DISCLAIMER)

> **Thông báo**: Mô hình Machine Learning V1 được huấn luyện từ dữ liệu học tập UCI Student Performance. Các dự đoán do mô hình đưa ra chỉ mang tính chất tham khảo chuyên môn hỗ trợ giảng dạy và tư vấn học tập, không dùng làm căn cứ duy nhất để xếp loại hoặc kỷ luật học viên.

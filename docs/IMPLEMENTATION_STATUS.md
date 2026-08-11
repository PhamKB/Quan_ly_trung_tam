# BÁO CÁO KIỂM TOÁN HỆ THỐNG & TRẠNG THÁI TRIỂN KHAI
## SMART EDUCATION CENTER MANAGEMENT SYSTEM (HỆ THỐNG QUẢN LÝ TRUNG TÂM GIÁO DỤC THCS)

---

## 1. TỔNG QUAN CẤU TRÚC CODEBASE HIỆN TẠI

Hệ thống đang được xây dựng dưới dạng ứng dụng Full-Stack tích hợp:
* **Frontend:** React (v19) + TypeScript + Vite. Sử dụng Tailwind CSS v4 để định hình giao diện và Lucide React cho hệ thống icon.
* **Backend:** Node.js + Express + TypeScript, chạy trực tiếp thông qua `tsx server.ts`.
* **Machine Learning:** Thư mục `/ml` chứa các mã nguồn Python (`train.py`, `evaluate.py`, `preprocess.py`, `predict.py`) dùng để huấn luyện mô hình dự đoán điểm học viên và xuất ra file artifact mô hình dưới dạng `.joblib` và `.json`.
* **Cơ chế Inference:** Sử dụng file `student_score_model.json` được nạp trực tiếp qua `student_score_service.ts` ở phía máy chủ Express để thực hiện dự đoán thực tế thay vì gọi mô hình Python trực tiếp hoặc giả lập số ngẫu nhiên.

---

## 2. KẾT QUẢ KIỂM TOÁN CHI TIẾT (AUDIT)

### 2.1. Tìm kiếm và rà soát Dữ liệu cũ (IELTS / THPT / Đại học)
Trong toàn bộ codebase hiện tại, có nhiều dữ liệu mẫu cũ thuộc khối THPT và IELTS không phù hợp với trung tâm THCS (lớp 6-9):
* **Học sinh:** Các lớp có tên `12A - Chuyên Toán`, `11B - Ngữ Văn`, `10C - IELTS Foundation`, `12C - Vật Lý AP` xuất hiện ở `src/data.ts` và `src/App.tsx`.
* **Khóa học:** `IELTS Foundation`, `IELTS Advanced`, `TOEIC Preparation`, `English Communication`, `AP Physics` trong `src/data.ts`.
* **Môn học:** Chứa nội dung nâng cao đại học hoặc ôn thi IELTS, AP.
* **Chương trình học thử & AI Planner:** Chứa dữ liệu lập kế hoạch cho kỳ thi IELTS, điểm thi AP, luyện thi đại học quốc gia.

> **Giải pháp khắc phục ở Checkpoint 1:** Chuyển đổi toàn bộ dữ liệu này thành khối THCS từ lớp 6 đến lớp 9, thống nhất 6 môn học (Toán học, Ngữ văn, Tiếng Anh, Vật lý, Hóa học, Sinh học) và gán 18 giáo viên thực tế (mỗi môn 3 giáo viên dạy chéo lớp).

### 2.2. Kiểm tra Mock và Hardcode dữ liệu
* **Quản lý dữ liệu:** Frontend đang nạp dữ liệu từ hằng số ở `src/data.ts` vào các React states cục bộ ở `src/App.tsx` (`students`, `classes`, `invoices`, `payments`, v.v.). Khi tải lại trang (reload), mọi dữ liệu thêm/sửa/xóa sẽ biến mất hoàn toàn.
* **Số liệu tài chính:** Doanh thu tháng (1.28 Tỷ ₫), chi phí vận hành (760 Triệu ₫), lợi nhuận ròng (520 Triệu ₫), và nợ quá hạn (186.5 Triệu ₫) đang bị hardcode tĩnh bên trong `src/components/FinanceView.tsx` và `src/components/DashboardView.tsx`.
* **Sổ điểm và Chuyên cần:** Đang được cập nhật trực tiếp trên bộ nhớ RAM của trình duyệt, chưa lưu xuống bất kỳ database hay gọi API nào để đồng bộ.

### 2.3. Hệ thống Authentication & Authorization (Đăng nhập & Phân quyền)
* **Hiện tại:** Chưa có màn hình Đăng nhập (Login/Logout) thực tế. Hệ thống sử dụng một Role Switcher (select box chọn vai trò) ở góc trên bên phải màn hình để mô phỏng sự thay đổi giao diện theo vai trò (`OWNER`, `ACADEMIC_STAFF`, `ACCOUNTANT`, `TEACHER`, `STUDENT`, `PARENT`).
* **Menu điều hướng:** Được lọc tĩnh bằng `ALLOWED_TABS_BY_ROLE` ở frontend.
* **An ninh API:** Các API backend như `/api/ai/predict-score` và `/api/ai/predictions-history` hoàn toàn không có bất kỳ rào cản bảo mật nào. Bất kỳ ai cũng có thể gửi request để truy vấn.

### 2.4. Đánh giá Machine Learning Pipeline
* Mô hình được thiết kế tốt: Sử dụng `RandomForestRegressor` kết hợp với trọng số của `Linear Regression` để đưa ra các dự đoán về điểm số cuối kỳ (`predicted_final_score`) và phân tích mức rủi ro (`risk_level`).
* Bộ scaler chuẩn hóa dữ liệu (`mean` và `scale` z-score) đã được lưu vào artifact JSON để phục vụ tính toán thời gian thực chính xác.
* **Technical Debt:** File backend `server.ts` chứa mảng predictions ảo lưu trên bộ nhớ RAM (`aiPredictionsStore`). Chưa có cơ sở dữ liệu thật để ghi nhận lịch sử dự đoán này phục vụ kiểm tra chéo (audit log).

---

## 3. LỘ TRÌNH TRIỂN KHAI CHI TIẾT (10 CHECKPOINTS)

### **CHECKPOINT 0 — AUDIT (HIỆN TẠI)**
* [x] Đọc toàn bộ cấu trúc thư mục frontend, backend, và ML.
* [x] Xác định các vị trí còn hardcode, dữ liệu THPT/IELTS cũ.
* [x] Phân tích thiếu sót trong cơ chế bảo mật và cơ sở dữ liệu.
* [x] Tạo tài liệu kiến trúc hệ thống và báo cáo trạng thái triển khai.

### **CHECKPOINT 1 — DATABASE + SEED DATA THCS**
* [x] Thiết lập lưu trữ bền vững (Durable Persistence). Sử dụng **Firebase/Firestore** làm nền tảng lưu trữ dữ liệu thật cho hệ thống.
* [x] Định nghĩa cấu trúc lưu trữ cho các collection: `users`, `students`, `classes`, `courses`, `invoices`, `payments`, `refunds`, `homeworks`, `scores`, `audit_logs`, `ai_predictions`.
* [x] Viết bộ seed sinh dữ liệu thật cho khối THCS (Khối 6-9, 6 môn học bao gồm Sinh học, 18 giáo viên thực tế với quy tắc 1 GV dạy 1 môn duy nhất, học sinh, hóa đơn, thanh toán chéo nhất quán).

### **CHECKPOINT 1.5 — FIRESTORE SECURITY & DATA INTEGRITY VERIFICATION**
* [x] Kiểm tra và tái cấu trúc `firestore.rules` đảm bảo quy định rõ ràng các chính sách tạm thời (Temporary Development Rules) hỗ trợ quy trình seed và phân tích, tránh các lỗ hổng rò rỉ hoặc tiêm nhiễm dữ liệu tùy tiện mà không có chiến lược.
* [x] Tích hợp chi tiết các thực thể còn lại (`homeworks`, `employees`, `notifications`, `auditLogs`, `reports`) vào sơ đồ dữ liệu master `firebase-blueprint.json` làm Single Source of Truth (SSoT).
* [x] Đánh giá tính toàn vẹn dữ liệu tài chính (Financial Invariants): remainingAmount = finalAmount - paidAmount, đảm bảo không đóng thừa vượt mức và không có số âm.
* [x] Kiểm định tính bất biến (Idempotency) của Seeding: Đảm bảo chạy lại Seed 2 lần không bị trùng lặp hay gia tăng dữ liệu tĩnh (giữ nguyên 18 giáo viên, 6 môn học, 12 lớp, 80 học sinh).
* [x] Hoàn thiện hệ thống tài liệu kiến trúc bảo mật (`docs/SECURITY.md`), cơ sở dữ liệu (`docs/DATABASE.md`), quy tắc nghiệp vụ (`docs/BUSINESS_RULES.md`) và notebook kiểm thử (`docs/notebooks/02_database_firestore_seed.ipynb`).

### **CHECKPOINT 2 — ĐĂNG NHẬP & PHÂN QUYỀN THẬT**
* [ ] Triển khai Firebase Authentication cho 5 nhóm tài khoản kiểm thử chính với email và mật khẩu cụ thể.
* [ ] Thay thế Role Switcher bằng màn hình đăng nhập thật và quản lý session/JWT bảo mật.
* [ ] Xây dựng Middleware kiểm tra quyền truy cập (Authorization) ở backend, chặn truy cập trái phép đối với các tài nguyên nhạy cảm (Tài chính, Lương, Doanh thu) và trả về lỗi `403 Forbidden` thay vì chỉ ẩn menu ở client-side.

### **CHECKPOINT 3 — PHÂN HỆ GIÁO VỤ (ACADEMIC STAFF)**
* [ ] Hoàn thiện luồng tạo học sinh mới, gán phụ huynh, xếp lớp và gán giáo viên môn học.
* [ ] Quản lý thời khóa biểu động, cảnh báo xung đột phòng học hoặc xung đột lịch dạy của giáo viên.
* [ ] Đồng bộ hóa tất cả các thao tác này trực tiếp xuống Firestore.

### **CHECKPOINT 4 — PHÂN HỆ GIÁO VIÊN (TEACHER)**
* [ ] Thiết lập giao diện giáo viên chỉ hiển thị các lớp học, thời khóa biểu và danh sách học sinh thuộc phạm vi được phân công phụ trách.
* [ ] Chức năng điểm danh từng buổi học với cơ chế Audit Log nếu có sự điều chỉnh điểm danh sau khi đã chốt.
* [ ] Quản lý bài tập về nhà và nhập điểm số định kỳ (thường xuyên, giữa kỳ, cuối kỳ) có tính toán GPA trung bình thực tế.

### **CHECKPOINT 5 — PHÂN HỆ TÀI CHÍNH & THU PHÍ (ACCOUNTANT)**
* [ ] Xây dựng công cụ lập hóa đơn học phí tự động theo tháng dựa trên khóa học và mức phí của khối lớp.
* [ ] Ghi nhận lịch sử thanh toán hóa đơn (đầy đủ hoặc một phần), tự động cập nhật công nợ học phí của học sinh.
* [ ] Quản lý dòng chi phí trung tâm (Lương giáo viên, tiền điện nước, thuê mặt bằng, marketing) và lập cơ chế hoàn phí khi học sinh xin thôi học.

### **CHECKPOINT 6 — DASHBOARD CHỦ TRUNG TÂM (OWNER)**
* [ ] Tổng hợp báo cáo kinh doanh thời gian thực: Doanh thu thực thu (tiền đã nhận thật) trừ đi Tổng chi phí vận hành để tính toán Lợi nhuận ròng chính xác.
* [ ] Hiển thị biểu đồ phân tích xu hướng tài chính, tăng trưởng học viên và biểu đồ tròn phân bổ công nợ quá hạn.
* [ ] Khu vực đặc biệt "CẦN CHÚ Ý" (Học sinh rủi ro cao, lớp có chuyên cần dưới 80%, công nợ quá hạn dài).

### **CHECKPOINT 7 — LẬP VÀ GỬI BÁO CÁO VẬN HÀNH**
* [ ] Giáo vụ lập báo cáo định kỳ về doanh thu, học sinh và chuyên cần, sau đó lưu trữ trực tiếp trên hệ thống và gửi thông báo cho Chủ trung tâm.
* [ ] Chủ trung tâm nhận thông báo, đọc báo cáo vận hành trực quan và đánh dấu "Đã xem".

### **CHECKPOINT 8 — TÍCH HỢP MÔ HÌNH MACHINE LEARNING THẬT**
* [ ] Đảm bảo backend Express gọi trực tiếp dịch vụ ML thực để dự đoán điểm thi cuối kỳ dựa trên dữ liệu học tập thực tế từ cơ sở dữ liệu thay vì nhập thủ công hoặc giả lập.
* [ ] Đồng bộ lịch sử dự đoán điểm số vào collection `ai_predictions` để theo dõi và đối chiếu độ chính xác.

### **CHECKPOINT 9 — AI RISK & RECOMMENDATION**
* [ ] Xây dựng thuật toán phân tích rủi ro kết hợp điểm dự đoán học tập, mức độ chuyên cần, và tỷ lệ hoàn thành bài tập về nhà.
* [ ] Tạo hệ thống đưa ra các khuyến nghị học tập tự động hóa dựa trên kết quả phân tích rủi ro của AI.

### **CHECKPOINT 10 — END-TO-END QA (KIỂM THỬ TOÀN DIỆN)**
* [ ] Thực hiện kịch bản chạy thử từ lúc Chủ trung tâm tạo tài khoản nhân viên, giáo vụ nhập học sinh mới, giáo viên điểm danh & chấm điểm, giáo vụ xuất hóa đơn & thu phí, cập nhật lợi nhuận lên Dashboard chủ trung tâm, và AI chạy phân tích rủi ro. Đạt chỉ tiêu linter sạch và ứng dụng chạy mượt mà không lỗi.

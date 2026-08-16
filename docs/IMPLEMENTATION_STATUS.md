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

CHECKPOINT 2.6 — Login & Role Routing Diagnostic
PASS

CHECKPOINT 2.6.1 — Firebase Auth Provider Configuration & Runtime Login Verification
PASS

CHECKPOINT 3 — Machine Learning Integration (V1 Model Artifact Inference)
PASS

CHECKPOINT 3.5 — ML Verification, Monitoring & Model Governance
PASS

CHECKPOINT 2.8.1 — Auth Documentation & Legacy Cleanup
PASS

CHECKPOINT 2.8.2 — Real Login & Workspace Verification
PASS

CHECKPOINT 4.1 — Student & Parent Management (Quản lý Học sinh + Phụ huynh)
PASS

CHECKPOINT 4.1.2 — Account Provisioning & First Login Password Change
PASS
```

---

## 2. TRẠNG THÁI TRIỂN KHAI CẬP NHẬT

### 2.0. Phân Hệ Cấp Tài Khoản & Đổi Mật Khẩu Lần Đầu (Checkpoint 4.1.2)
- **Tạo Username Tự Động Theo Chuẩn Trung Tâm**:
  - Học sinh: `hs_0001`, `hs_0002`... (`hs_` + 4 chữ số ID định danh).
  - Phụ huynh: `ph_0001`, `ph_0002`... (`ph_` + 4 chữ số ID định danh).
  - Chuẩn hóa chữ thường, loại bỏ dấu và khoảng trắng, chống trùng lặp tuyệt đối.
- **Tạo Mật Khẩu Tạm Thời & Mã Hóa Bcrypt**:
  - Mật khẩu ngẫu nhiên 8 ký tự alphanumeric (`A-Za-z0-9`).
  - Sử dụng `bcryptjs` mã hóa `passwordHash` lưu trữ vào Firestore `users/{uid}`.
  - Tuyệt đối KHÔNG lưu trữ mật khẩu thô (plaintext password) trong cơ sở dữ liệu.
- **Cấu Trúc Tài Khoản Phân Hệ (`users`) & Ánh Xạ Hai Chiều**:
  - Ghi nhận `mustChangePassword: true`, `studentId` hoặc `parentId`, `username`, `passwordHash`.
  - Cập nhật hai chiều: `students/{id}.userId` và `parents/{id}.userId` bằng `writeBatch` đảm bảo tính nguyên tử.
- **Giao Diện Hiển Thị Thông Tin Đăng Nhập Một Lần**:
  - Hiển thị Username và Mật khẩu tạm thời cho Giáo vụ sao chép và chuyển cho người dùng.
  - Cảnh báo bảo mật: Mật khẩu chỉ hiển thị một lần duy nhất.
- **Bắt Buộc Đổi Mật Khẩu Lần Đầu (First Login Enforcement)**:
  - Khi người dùng đăng nhập bằng tài khoản tạm thời (`mustChangePassword === true`), hệ thống kích hoạt Modal Đổi Mật Khẩu Bắt Buộc.
  - Yêu cầu mật khẩu mới từ 6 ký tự trở lên, khớp với xác nhận và không trùng với mật khẩu tạm thời.
  - Sau khi đổi thành công: cập nhật `passwordHash` mới, set `mustChangePassword: false` và chuyển thẳng vào đúng Workspace phân hệ tương ứng (`STUDENT` hoặc `PARENT`).
- **Đặt Lại Mật Khẩu (Password Reset)**:
  - Giáo vụ bấm "Đặt lại mật khẩu" trên bảng danh sách, hệ thống sinh mật khẩu tạm thời mới, mã hóa bcrypt và kích hoạt lại cờ `mustChangePassword: true`.
- **Bảo Mật Audit Log**:
  - Nhật ký truy vết `CREATE_USER`, `RESET_USER_PASSWORD`, `CHANGE_PASSWORD` tuyệt đối không ghi lại mật khẩu thô hoặc chuỗi hash.
- **Kiểm Thử Tự Động**:
  - 13/13 unit tests trong `src/tests/account_provisioning.test.ts` đã vượt qua 100%.
  - 27/27 toàn bộ hệ thống test suite (`npm test`) đều đạt kết quả PASS 100%.

### 2.0. Phân Hệ Quản Lý Học Sinh & Phụ Huynh (Checkpoint 4.1)
- **Hồ sơ Học sinh cấp THCS (Khối 6, 7, 8, 9)**:
  - Mã định danh nghiệp vụ `STU-2026-XXX`.
  - Quản lý đầy đủ họ tên, ngày sinh, giới tính, khối lớp, lớp học, thông tin phụ huynh, GPA, điểm rủi ro, trạng thái học phí.
- **Hồ sơ Phụ huynh**:
  - Mã định danh nghiệp vụ `PAR-2026-XXX`.
  - Quản lý họ tên, mối quan hệ (Cha, Mẹ, Người giám hộ), SĐT, Email, Nghề nghiệp, Địa chỉ.
- **Mối quan hệ hai chiều (Bidirectional Linking)**:
  - Đồng bộ tự động liên kết Phụ huynh ↔ Học sinh bằng Firestore `writeBatch` giữa `students.parentIds` và `parents.studentIds` / `childIds`.
- **Nguyên tắc Soft Delete**:
  - Không xóa hẳn (Hard Delete) hồ sơ; chuyển trạng thái `status: 'INACTIVE'`. Lọc hiển thị mặc định các hồ sơ `ACTIVE`.
- **Cấp tài khoản hệ thống (Account Granting)**:
  - Hỗ trợ gán tài khoản đăng nhập ERP cho Học sinh và Phụ huynh theo đúng vai trò `STUDENT` hoặc `PARENT`.
- **Kiểm thử tự động**:
  - 5/5 unit tests trong `src/tests/students_parents.test.ts` đã vượt qua 100%.
- **Notebook hướng dẫn**:
  - Khởi tạo thành công `docs/notebooks/06_students_parents.ipynb`.

### 2.1. Authentication & Workspace Verification (Checkpoint 2.8.1 & 2.8.2)
- **Current Auth Runtime**: Username/Email + Password via Firebase Auth / System User Resolver.
- **Login UI**: Preserved clean single-screen UI showing strictly `Tên đăng nhập`, `Mật khẩu`, `[ Đăng nhập ]`, and `Quên mật khẩu?`.
- **Verified Role Workspaces**:
  - `ADMIN` (`admin`, `admin@smartedu.vn`, `vietdung.owner@smartedu.com`) → Workspace `Chủ trung tâm` (`dashboard`)
  - `ACADEMIC_STAFF` (`giaovu01`, `giaovu`, `giaovu@smartedu.vn`, `hoanganh.staff@smartedu.com`) → Workspace `Giáo vụ` (`dashboard`)
  - `TEACHER` (`gv_toan_01`, `teacher`, `giaovien`, `gv.viettoan@smartedu.vn`, `viet.tran@smartedu.com`) → Workspace `Giáo viên` (`classes`)
  - `STUDENT` (`hs_0001`, `student`, `hocsinh`, `hs.1@smartedu.vn`) → Workspace `Học sinh` (`dashboard`)
  - `PARENT` (`ph_0001`, `parent`, `phuhuynh`, `ph.1@smartedu.vn`) → Workspace `Phụ huynh` (`dashboard`)
  - `ACCOUNTANT` (`ketoan01`, `accountant`, `ketoan`, `ketoan@smartedu.vn`) → Workspace `Kế toán` (`finance`)
- **Error Handling & Security Enforcements**:
  - Invalid Username / Password → Reject cleanly with `"Tên đăng nhập hoặc mật khẩu không chính xác."` No fallback user created.
  - Inactive account (`status != ACTIVE`) → Reject with `"Tài khoản hiện không hoạt động."`
  - Missing profile (`users/{uid}` missing) → Log `AUTH_PROFILE_NOT_FOUND` audit event, trigger `signOut()`, reject with `"Tài khoản chưa được cấp hồ sơ hệ thống..."`
  - Session Restore → Preserves logged in state on reload.
  - Logout → Firebase `signOut()` completely clears state and returns to Login screen.
  - Role Isolation & Direct Access → Tab permissions governed by `ALLOWED_TABS_BY_ROLE` and auto-reset on illegal navigation.
- **Sandbox Auth**: Controlled via `VITE_ENABLE_SANDBOX_AUTH=true` for local development testing only; separated from real auth.

### 2.2. Machine Learning Inference Engine V1
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

### 2.5. Diagnostic & Refactoring Login & Role Routing (Checkpoint 2.6)
- **Elimination of Auto-Registration**: Completely removed client-side account creation and fallback role assignments upon login failures.
- **Strict Zero-Trust RBAC**: System role and privileges are strictly derived from the Firestore document `/users/{uid}`.
- **Handling Inactive & Missing Profiles**: Users without a valid active profile document in `/users/{uid}` are immediately rejected (`AUTH_PROFILE_NOT_FOUND` / `AUTH_PROFILE_INACTIVE`), signed out automatically, and logged to audit trails.
- **THCS Scale Data Alignment**: Cleanly verified data consistency across 12 THCS classes, 216 students, 15 teachers, and 5 standard subjects across all initial data structures.

---

## 3. TÀI LIỆU KIẾN TRÚC & NOTEBOOKS
- `docs/ML_INTEGRATION.md`: Tài liệu tích hợp ML & REST APIs.
- `docs/ML_MODEL_GOVERNANCE.md`: Quy trình quản trị mô hình, monitoring & rollback.
- `docs/notebooks/04_ML_Inference_V1.ipynb`: Notebook thực thi suy luận V1.
- `docs/notebooks/05_ML_Verification_Monitoring.ipynb`: Notebook kiểm định & giám sát mô hình.

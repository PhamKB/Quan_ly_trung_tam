# TÀI LIỆU CƠ SỞ DỮ LIỆU & KIẾN TRÚC LƯU TRỮ CHUYÊN BIỆT FIRESTORE (CHECKPOINT 1.5)

Tài liệu này cung cấp mô hình thực thể liên kết, cấu trúc các Collection trong Cloud Firestore và các ràng buộc dữ liệu toàn vẹn (Data Invariants) của hệ thống **SmartEdu**.

---

## 1. MÔ HÌNH LƯU TRỮ SINGLE SOURCE OF TRUTH (SSoT)

Hệ thống đã di cư hoàn toàn khỏi dữ liệu tĩnh ở client (`src/data.ts`) sang Cloud Firestore để đồng bộ hóa thời gian thực (Real-time Sync) tới tất cả các phiên làm việc của người dùng. Mỗi thực thể đều có một mã định danh duy nhất (Deterministic ID), đảm bảo tính nhất quán kể cả khi chạy Seeding nhiều lần (Idempotency).

---

## 2. KIẾN TRÚC MỐI QUAN HỆ THỰC THỂ (RELATIONAL MAPPING)

Dù Firestore là cơ sở dữ liệu NoSQL, chúng ta thiết kế các tham chiếu định danh (Foreign Key Equivalents) chặt chẽ để ánh xạ thông tin giữa các Collection:

```text
 [users] ───────── (id <=> user_owner / user_STU-xxx / user_PAR-xxx)
    │
    ├─► [teachers] ─── (id <=> user_teacher_xxx) ──► [classes] (teachers map)
    │
    ├─► [parents] ──── (id <=> PAR-xxx, childIds: [STU-xxx])
    │                     │
    └─► [students] ◄──────┘ (id <=> STU-xxx, parentId: PAR-xxx)
           │
           ├─► [classEnrollments] (studentId <=> classId)
           ├─► [scores]           (studentId, subjectId, classId)
           ├─► [invoices]         (studentId, invoiceId) ──► [payments] (invoiceId)
           └─► [homeworks]        (classId)
```

---

## 3. THIẾT KẾ CHI TIẾT CÁC COLLECTIONS CHỦ CHỐT

### 3.1. `users`
* **Mục đích:** Danh sách tài khoản đăng nhập ERP của toàn trung tâm.
* **Cấu trúc:**
  * `id`: `string` (Mã định danh, ví dụ: `user_owner`, `user_STU-2026-001`, `user_PAR-2026-001`)
  * `email`: `string` (Email định danh chứng thực)
  * `displayName`: `string` (Họ tên đầy đủ)
  * `role`: `'OWNER' | 'ACADEMIC_STAFF' | 'ACCOUNTANT' | 'TEACHER' | 'STUDENT' | 'PARENT'`
  * `phone`: `string`
  * `status`: `'Đang hoạt động' | 'Bị khóa'`
  * `department`: `string` (Phòng ban chuyên trách, ví dụ: `Phòng Tài Chính`, `Học sinh`)
  * `createdAt`: `string` (ISO timestamp)
  * `updatedAt`: `string` (ISO timestamp)

### 3.2. `students`
* **Mục đích:** Hồ sơ học lực và chuyên cần thực tế của học sinh.
* **Cấu trúc:**
  * `id`: `string` (`STU-2026-XXX`)
  * `name`: `string`
  * `classId`: `string` (`class_6A1`)
  * `className`: `string` (`6A1`)
  * `course`: `string` (`Khối 6 Toàn diện`)
  * `grade`: `number` (Khối lớp từ 6-9)
  * `email`: `string`
  * `phone`: `string`
  * `parentId`: `string` (`PAR-2026-XXX`)
  * `parentName`: `string`
  * `gpa`: `number` (Điểm GPA trung bình hiện tại)
  * `attendanceRate`: `number` (Tỷ lệ chuyên cần %)
  * `homeworkCompletion`: `number` (Tỷ lệ hoàn thành bài tập %)
  * `riskScore`: `number` (Điểm số rủi ro tính toán từ 0-100)
  * `riskLevel`: `'Low' | 'Medium' | 'High'`
  * `tuitionPaid`: `number` (Tổng học phí đã đóng thực tế)
  * `tuitionOwed`: `number` (Tổng học phí còn nợ)
  * `status`: `'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE'`
  * `financials`: `object` (Chi tiết tài chính của tháng hiện tại)

### 3.3. `invoices` (Hóa đơn học phí)
* **Mục đích:** Quản lý hóa đơn đóng phí hàng tháng khớp với từng khối lớp.
* **Cấu trúc:**
  * `id`: `string` (`INV-2026-XXX`)
  * `studentId`: `string` (`STU-2026-XXX`)
  * `studentName`: `string`
  * `className`: `string`
  * `dateIssued`: `string` (YYYY-MM-DD)
  * `dueDate`: `string` (YYYY-MM-DD)
  * `amount`: `number` (Học phí gốc)
  * `discount`: `number` (Miễn giảm học bổng/khuyến mãi)
  * `finalAmount`: `number` (Học phí sau miễn giảm)
  * `paidAmount`: `number` (Số tiền thực tế học sinh đã nộp cho hóa đơn này)
  * `status`: `'Draft' | 'Issued' | 'Paid' | 'Partially Paid' | 'Overdue' | 'Cancelled' | 'Refunded'`

---

## 4. CÁC RÀNG BUỘC TOÀN VẸN DỮ LIỆU TÀI CHÍNH (FINANCIAL INVARIANTS)

Để đảm bảo tính minh bạch, chính xác và không có lỗ hổng kiểm toán (Audit Gaps), hệ thống tuân thủ nghiêm ngặt 3 quy tắc bất biến sau:

1. **Bất biến số dư hóa đơn (Remaining Balance Invariant):**
   $$\text{Học phí còn nợ (tuitionOwed / remainingAmount)} = \text{Số tiền phải nộp (finalAmount)} - \text{Số tiền đã nộp (paidAmount)}$$
   * Quy tắc này được thực thi đồng bộ cả ở `students.tuitionOwed` và `invoices` (được tính bằng `finalAmount - paidAmount`).
   
2. **Ngăn chặn quá hạn nộp (Boundary Constraint):**
   * $\text{paidAmount} \le \text{finalAmount}$ (Không chấp nhận nộp thừa vượt quá trị giá hóa đơn, ngoại trừ nghiệp vụ hoàn phí có phiếu riêng).
   * $\text{tuitionOwed} \ge 0$ (Học phí còn nợ tuyệt đối không được âm).
   
3. **Giá trị dương tuyệt đối (Absolute Positive Invariant):**
   * $\text{amount} \ge 0$, $\text{finalAmount} \ge 0$, $\text{paidAmount} \ge 0$.
   * Không có bất kỳ giá trị tài chính nào được lưu số âm dưới dạng thô. Trường hợp hoàn trả phí (refunds) sẽ được hạch toán thông qua một collection riêng mang tên `refunds` với trạng thái `'Đã hoàn'` và lượng tiền dương cụ thể.

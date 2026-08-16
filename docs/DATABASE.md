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
  * `id`: `string` (Mã định danh, ví dụ: `USR-STUDENT-STU-2026-001`, `USR-PARENT-PAR-2026-001`)
  * `username`: `string` (Tên đăng nhập hệ thống, ví dụ: `hs_0001`, `ph_0001` - chuẩn hóa, viết thường, không có khoảng trắng)
  * `passwordHash`: `string` (Chuỗi hash bcrypt mã hóa mật khẩu, không lưu mật khẩu thô)
  * `mustChangePassword`: `boolean` (`true` khi cấp tài khoản hoặc đặt lại mật khẩu, buộc đổi mật khẩu ở lần đăng nhập đầu tiên)
  * `studentId`: `string` (Mã liên kết hồ sơ học sinh `STU-2026-XXX` nếu role là `STUDENT`)
  * `parentId`: `string` (Mã liên kết hồ sơ phụ huynh `PAR-2026-XXX` nếu role là `PARENT`)
  * `email`: `string` (Email định danh chứng thực)
  * `name`: `string` (Họ tên đầy đủ)
  * `role`: `'OWNER' | 'ADMIN' | 'ACADEMIC_STAFF' | 'ACCOUNTANT' | 'TEACHER' | 'STUDENT' | 'PARENT'`
  * `department`: `string` (Phòng ban chuyên trách)
  * `school`: `string` (`Trụ sở chính`)
  * `status`: `'Đang hoạt động' | 'Tạm khóa'`
  * `createdAt`: `string` (ISO timestamp)
  * `updatedAt`: `string` (ISO timestamp)

### 3.2. `students`
* **Mục đích:** Hồ sơ học sinh cấp THCS (Khối 6, 7, 8, 9).
* **Cấu trúc:**
  * `id`: `string` (`STU-2026-XXX`) - ID nghiệp vụ định danh duy nhất
  * `studentId`: `string` (`STU-2026-XXX`)
  * `userId`: `string` (Mã ID liên kết tài khoản `users` tương ứng)
  * `name`: `string` (Họ tên đầy đủ)
  * `fullName`: `string`
  * `dateOfBirth`: `string` (YYYY-MM-DD)
  * `gender`: `'Nam' | 'Nữ'`
  * `grade`: `number` (Khối lớp từ 6-9)
  * `classId`: `string` (`class_6A1`)
  * `className`: `string` (`6A1`)
  * `course`: `string` (`Khối 6 Toàn diện`)
  * `email`: `string`
  * `phone`: `string`
  * `address`: `string`
  * `parentId`: `string` (`PAR-2026-XXX` - ID phụ huynh chính)
  * `parentIds`: `array` (`['PAR-2026-XXX']` - Danh sách ID phụ huynh liên kết)
  * `parentName`: `string`
  * `gpa`: `number` (Điểm GPA trung bình)
  * `attendanceRate`: `number` (Tỷ lệ chuyên cần %)
  * `homeworkCompletion`: `number` (Tỷ lệ hoàn thành bài tập %)
  * `riskScore`: `number` (Điểm số rủi ro)
  * `riskLevel`: `'Low' | 'Medium' | 'High'`
  * `status`: `'ACTIVE' | 'INACTIVE'` (Soft-delete status)
  * `createdAt`: `string` (ISO timestamp)
  * `updatedAt`: `string` (ISO timestamp)

### 3.2.1. `parents`
* **Mục đích:** Hồ sơ phụ huynh liên kết hai chiều với danh sách học sinh.
* **Cấu trúc:**
  * `id`: `string` (`PAR-2026-XXX`) - ID nghiệp vụ phụ huynh duy nhất
  * `parentId`: `string` (`PAR-2026-XXX`)
  * `userId`: `string` (Mã ID liên kết tài khoản `users` tương ứng)
  * `name`: `string` (Họ tên phụ huynh)
  * `fullName`: `string`
  * `relationship`: `'Cha' | 'Mẹ' | 'Người giám hộ'`
  * `email`: `string`
  * `phone`: `string`
  * `address`: `string`
  * `job`: `string` (Nghề nghiệp)
  * `studentIds`: `array` (`['STU-2026-XXX']` - Danh sách học sinh thuộc quản lý)
  * `childIds`: `array` (`['STU-2026-XXX']` - Danh sách con cái)
  * `status`: `'ACTIVE' | 'INACTIVE'` (Soft-delete status)
  * `createdAt`: `string` (ISO timestamp)
  * `updatedAt`: `string` (ISO timestamp)

### 3.2.2. `classes` (Lớp học)
* **Mục đích:** Danh mục lớp học THCS quy chuẩn (Khối 6-9, sĩ số 18 học sinh/lớp).
* **Cấu trúc:**
  * `id`: `string` (`class_6A1`, `class_6A2`,...)
  * `classId`: `string` (`class_6A1`)
  * `classCode`: `string` (`6A1`)
  * `className`: `string` (`Lớp 6A1`)
  * `name`: `string` (`Lớp 6A1`)
  * `grade`: `number` (6, 7, 8, 9)
  * `academicYear`: `string` (`2026-2027`)
  * `capacity`: `number` (18 - Mặc định tối đa 18 học sinh)
  * `room`: `string` (`Phòng 101`)
  * `schedule`: `string` (`Thứ 2 - Thứ 4 - Thứ 6 · 08:00`)
  * `teacher`: `string` (`Trần Quốc Việt`)
  * `status`: `'ACTIVE' | 'INACTIVE' | 'Đang hoạt động' | 'Tạm ngừng' | 'Đã kết thúc'`
  * `course`: `string` (`Khối 6 Toàn diện`)
  * `studentsCount`: `number` (Cache sĩ số, tính động từ `classEnrollments`)
  * `createdAt`: `string` (ISO timestamp)
  * `updatedAt`: `string` (ISO timestamp)

### 3.2.3. `classEnrollments` (Ghi danh & Lịch sử chuyển lớp)
* **Mục đích:** **Source of Truth** chính thức về lịch sử học tập, phân lớp và chuyển lớp của học sinh.
* **Cấu trúc:**
  * `id`: `string` (`ENR-001`, `ENR-YYYYMMDD-XXXX`)
  * `enrollmentId`: `string`
  * `studentId`: `string` (`STU-2026-XXX`)
  * `studentName`: `string`
  * `classId`: `string` (`class_6A1`)
  * `className`: `string` (`Lớp 6A1`)
  * `grade`: `number` (6, 7, 8, 9)
  * `academicYear`: `string` (`2026-2027`)
  * `startDate`: `string` (ISO timestamp / YYYY-MM-DD)
  * `endDate`: `string` (ISO timestamp / YYYY-MM-DD - có khi chuyển lớp hoặc hoàn thành)
  * `status`: `'ACTIVE' | 'TRANSFERRED' | 'COMPLETED' | 'CANCELLED'`
  * `reason`: `string` (Lý do chuyển lớp / điều chỉnh)
  * `fromClassId`: `string` (Lớp nguồn khi chuyển lớp)
  * `toClassId`: `string` (Lớp đích khi chuyển lớp)
  * `createdAt`: `string` (ISO timestamp)
  * `updatedAt`: `string` (ISO timestamp)

### 3.2.4. `teachers` (Hồ sơ Giáo viên & Chuyên môn)
* **Mục đích:** Danh sách 15 giáo viên cơ hữu THCS, mỗi giáo viên phụ trách đúng 1 môn học.
* **Cấu trúc:**
  * `id`: `string` (`TCH-2026-XXX`) - ID nghiệp vụ định danh duy nhất
  * `teacherId`: `string` (`TCH-2026-XXX`)
  * `employeeCode`: `string` (`GV001`)
  * `name`: `string` (Họ và tên giáo viên)
  * `fullName`: `string`
  * `email`: `string` (Email liên hệ)
  * `phone`: `string` (Số điện thoại)
  * `subjectId`: `string` (`toan` | `van` | `anh` | `ly` | `hoa`) - Bắt buộc duy nhất 1 môn
  * `subjectCode`: `string` (`TOAN` | `NGU_VAN` | `TIENG_ANH` | `VAT_LY` | `HOA_HOC`)
  * `subjectName`: `string` (Tên hiển thị môn học)
  * `department`: `string` (`Tổ Tự Nhiên` | `Tổ Xã Hội` | `Tổ Ngoại Ngữ`)
  * `status`: `'ACTIVE' | 'INACTIVE'` (Trạng thái công tác)
  * `createdAt`: `string` (ISO timestamp)
  * `updatedAt`: `string` (ISO timestamp)

### 3.2.5. `teacherAssignments` (Phân công Môn/Lớp & Lịch sử)
* **Mục đích:** **Source of Truth** về phân công giảng dạy: 1 Giáo viên → 1 Môn → Nhiều Lớp.
* **Cấu trúc:**
  * `id`: `string` (`asn_6A1_toan`, `asn_YYYYMMDD_XXXX`)
  * `assignmentId`: `string`
  * `teacherId`: `string` (`TCH-2026-XXX`)
  * `teacherName`: `string`
  * `classId`: `string` (`class_6A1`)
  * `className`: `string` (`Lớp 6A1`)
  * `subjectId`: `string` (`toan`) - Trùng khớp với chuyên môn giáo viên
  * `subjectName`: `string` (`Toán học`)
  * `academicYear`: `string` (`2026-2027`)
  * `status`: `'ACTIVE' | 'INACTIVE'`
  * `startDate`: `string` (ISO timestamp)
  * `endDate`: `string` (ISO timestamp - có khi gỡ phân công)
  * `reason`: `string` (Ghi chú phân công / thay đổi)
  * `createdAt`: `string` (ISO timestamp)
  * `updatedAt`: `string` (ISO timestamp)

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

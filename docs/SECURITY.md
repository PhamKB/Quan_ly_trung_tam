# TÀI LIỆU KIẾN TRÚC BẢO MẬT HỆ THỐNG & ĐỊNH HƯỚNG RBAC (CHECKPOINT 1.5)

Tài liệu này chi tiết hóa thiết kế bảo mật của hệ thống **Smart Education Center Management System (SmartEdu)** ở Checkpoint 1.5 và định hướng hoàn thiện cơ chế Authentication & Role-Based Access Control (RBAC) ở Checkpoint 2.

---

## 1. NGUYÊN TẮC BẢO MẬT KHÔNG TIN CẬY (ZERO TRUST PRINCIPLES)

1. **Không bảo mật bằng giao diện (No UI-only Authorization):** Việc ẩn/hiện sidebar, menu hoặc các button chỉ tăng trải nghiệm người dùng (UX), hoàn toàn **không** có giá trị bảo mật. Mọi API endpoint, truy vấn Firestore, và các thao tác ghi dữ liệu đều phải được chứng thực và phân quyền nghiêm ngặt ở lớp Backend / Security Rules.
2. **Xác thực trước, Truy vấn sau (Auth-First Execution):** Mọi thao tác truy cập dữ liệu phải kiểm tra tính hợp lệ của token trước khi tốn tài nguyên tìm kiếm hay so khớp dữ liệu.
3. **Phân quyền tối thiểu (Principle of Least Privilege):** Mỗi chủ thể (Actor) chỉ được phép xem và thao tác trên đúng tập hợp dữ liệu được phân công.

---

## 2. MA TRẬN PHÂN QUYỀN HỆ THỐNG (RBAC PRIVILEGE MATRIX)

| Phân hệ / Vai trò | OWNER (Chủ trung tâm) | ACADEMIC_STAFF (Giáo vụ) | TEACHER (Giáo viên) | STUDENT (Học sinh) | PARENT (Phụ huynh) | ACCOUNTANT (Kế toán) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Xem toàn bộ hệ thống** | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Xem Tài chính & Doanh thu** | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Xem Chi phí vận hành** | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Quản lý Học sinh & Lớp học**| ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Quản lý Lịch học & Giáo viên**| ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Nhập điểm số học sinh** | ✗ | ✗ | ✓ (môn đảm nhận) | ✗ | ✗ | ✗ |
| **Điểm danh học sinh** | ✗ | ✓ | ✓ (lớp phụ trách) | ✗ | ✗ | ✗ |
| **Giao bài tập về nhà** | ✗ | ✗ | ✓ (lớp phụ trách) | ✗ | ✗ | ✗ |
| **Xem điểm & Chuyên cần** | ✓ | ✓ | ✓ | ✓ (bản thân) | ✓ (con mình) | ✗ |
| **Xem Hóa đơn & Học phí** | ✓ | ✓ | ✗ | ✓ (bản thân) | ✓ (con mình) | ✓ |
| **Ghi nhận phiếu thu/hoàn tiền**| ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |

---

## 3. FIRESTORE SECURITY RULES - TRẠNG THÁI HIỆN TẠI (SANDBOX)

Trong Checkpoint 1 (Database & Seed), để hệ thống có thể khởi tạo tự động toàn diện từ backend mà không bị chặn bởi các quy trình chưa có Auth (bởi vì Auth chưa được cài đặt - sẽ được thực hiện ở Checkpoint 2), các rules hiện tại đang ở chế độ **Temporary Development Sandbox Rules**:

* **Mã nguồn:** `/firestore.rules`
* **Cơ chế:** Cho phép đọc/ghi tạm thời (`allow read, write: if true;`) kèm theo cảnh báo bảo mật và chú thích chi tiết kiến trúc khóa ở đầu file.
* **Mục đích:** Hỗ trợ quy trình Seed dữ liệu từ Server, khởi tạo 216 học sinh, 15 giáo viên, 12 lớp học, hóa đơn, và điểm số.

---

## 5. XÁC MINH KIẾN TRÚC BẢO MẬT KHÔNG TIN CẬY (CHECKPOINT 2.6 VERIFICATION)

Đã hoàn thành nâng cấp và chẩn đoán bảo mật toàn diện cho phân hệ Đăng Nhập & Phân Quyền Workspace ở Checkpoint 2.6:

1. **Strict Firestore Profile Verification (`users/{uid}`):**
   - Không còn logic tự động đăng ký hoặc cấp vai trò tạm thời ở phía Client.
   - Vai trò (`role`) và quyền hạn được lấy trực tiếp và duy nhất từ document `/users/{uid}`.
2. **Xử lý tài khoản Thiếu Hồ sơ (`AUTH_PROFILE_NOT_FOUND`):**
   - Khi tài khoản đăng nhập thành công qua Firebase Auth nhưng không tìm thấy document `users/{uid}`, hệ thống từ chối truy cập ngay lập tức, đăng xuất tài khoản và ghi nhận nhật ký kiểm toán.
3. **Xử lý tài khoản Không Hoạt động (`AUTH_PROFILE_INACTIVE`):**
   - Khi `status !== 'Đang hoạt động'` và `status !== 'ACTIVE'`, hệ thống chặn truy cập hoàn toàn.
4. **Mô hình Phân quyền Không Tin Cận Phía Client:**
   - URL hoặc state cục bộ không thể vượt qua RBAC. Nếu `activeTab` không nằm trong danh sách được phép của `profile.role`, hệ thống tự động điều hướng về `dashboard`.

Khi triển khai Authentication và phân quyền thực tế ở Checkpoint 2, các rules sẽ được siết chặt như sau:

### A. Định danh người dùng bảo mật thông qua Firestore Lookup
Chúng ta không tin tưởng vào claims gửi từ Client. Thay vào đó, mỗi khi có yêu cầu ghi/đọc, Security Rules sẽ thực hiện một truy vấn nội bộ (get) vào collection `/users/` để xác định vai trò thực tế của người dùng:
```javascript
function getUserData() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
}
function hasRole(role) {
  return request.auth != null && getUserData().role == role;
}
```

### B. Siết chặt bảo mật theo từng Collection cụ thể

1. **Collection `expenses` (Chi phí vận hành):**
   ```javascript
   match /expenses/{id} {
     allow read, write: if hasRole('OWNER') || hasRole('ACCOUNTANT');
   }
   ```
2. **Collection `scores` (Sổ điểm học bạ):**
   ```javascript
   match /scores/{id} {
     allow read: if hasRole('OWNER') || hasRole('ACADEMIC_STAFF') || 
                  (hasRole('TEACHER') && isTeacherOfClass(resource.data.classId)) || 
                  (hasRole('STUDENT') && resource.data.studentId == request.auth.uid) || 
                  (hasRole('PARENT') && isParentOf(resource.data.studentId));
     allow write: if hasRole('TEACHER') && isTeacherOfClass(incoming().classId) && isSubjectTeacher(incoming().subjectId);
   }
   ```
3. **Collection `students` (Thông tin học sinh & PII):**
   ```javascript
   match /students/{id} {
     allow read: if hasRole('OWNER') || hasRole('ACADEMIC_STAFF') || 
                  (hasRole('STUDENT') && id == request.auth.uid) || 
                  (hasRole('PARENT') && resource.data.parentId == request.auth.uid);
     allow write: if hasRole('ACADEMIC_STAFF') || hasRole('OWNER');
   }
   ```

Tất cả các collection khác (`homeworks`, `auditLogs`, `invoices`, `payments`) cũng sẽ áp dụng mô hình phân quyền chặt chẽ tương tự để chặn đứng mọi khả năng rò rỉ dữ liệu (Data Leak) hoặc can thiệp dữ liệu trái phép (Unauthorized Tampering).

---

## 6. XÁC MINH PHÂN QUYỀN VÀ BẢO MẬT CỦA PHÂN HỆ HỌC SINH & PHỤ HUYNH (CHECKPOINT 4.1)

1. **Rule Đọc/Ghi Hai Collection `students` & `parents`:**
   - **Quyền Tạo/Sửa/Thao tác (Write):** Chỉ cho phép người dùng có vai trò `ADMIN`, `OWNER`, hoặc `ACADEMIC_STAFF`.
   - **Quyền Xem (Read):**
     - `ADMIN`, `OWNER`, `ACADEMIC_STAFF`, `ACCOUNTANT`, `TEACHER`: Có quyền xem danh sách học sinh & phụ huynh.
     - `STUDENT`: Chỉ xem được thông tin cá nhân của chính mình.
     - `PARENT`: Chỉ xem được thông tin của con cái thuộc danh sách `childIds`/`studentIds` được liên kết.
2. **Khóa liên kết dữ liệu nhạy cảm:**
   - Liên kết tài khoản `userId` cho Học sinh/Phụ huynh được bảo mật tuyệt đối qua Security Rules và Audit Logging.
3. **Toàn vẹn thao tác ghi hàng loạt (Atomic Batch Updates):**
   - Mọi thao tác cập nhật liên kết Phụ huynh ↔ Học sinh đều phải dùng `writeBatch` hoặc `runTransaction` để đảm bảo không bị xung đột hay mất tính nhất quán giữa hai collection.


# QUY TẮC NGHIỆP VỤ TRUNG TÂM & TIÊU CHÍ AI PHÂN TÍCH RỦI RO (CHECKPOINT 1.5)

Tài liệu này tổng hợp toàn bộ các quy tắc vận hành (Business Rules) và tiêu chí thuật toán phân tích học viên rủi ro trong phân hệ **THCS (Trung học cơ sở)** của hệ thống **SmartEdu**.

---

## 1. PHẠM VI CHƯƠNG TRÌNH ĐÀO TẠO KHỐI THCS

SmartEdu tập trung toàn bộ nguồn lực và cấu trúc dữ liệu cho khối lớp Trung học cơ sở:
* **Khối lớp:** Lớp 6, Lớp 7, Lớp 8, Lớp 9.
* **Danh mục 6 môn học cốt lõi:**
  1. **Toán học** (Mã: `TOAN`)
  2. **Ngữ văn** (Mã: `NGU_VAN`)
  3. **Tiếng Anh** (Mã: `TIENG_ANH`)
  4. **Vật lý** (Mã: `VAT_LY`)
  5. **Hóa học** (Mã: `HOA_HOC` - Giảng dạy từ lớp 8, 9)
  6. **Sinh học** (Mã: `SINH_HOC`)

---

## 2. QUY TẮC PHÂN BỔ GIÁO VIÊN VÀ TRÁNH XUNG ĐỘT LỊCH DAY (SCHEDULING RULES)

1. **Giáo viên Chuyên Trách:** Hệ thống có **18 giáo viên cơ hữu** (3 giáo viên chuyên trách cho mỗi môn học trong số 6 môn học cốt lõi). Mỗi giáo viên chỉ giảng dạy đúng chuyên môn của mình, được chia về các tổ chuyên môn:
   * **Tổ Tự Nhiên:** Toán học, Vật lý, Hóa học, Sinh học.
   * **Tổ Xã Hội:** Ngữ văn.
   * **Tổ Ngoại Ngữ:** Tiếng Anh.
2. **Xếp Lớp & Tránh Trùng Lịch:** Mỗi lớp học (6A1-9A3) có một Thời khóa biểu cố định. Hệ thống kiểm tra trùng lặp lịch dạy của giáo viên và phòng học thời gian thực:
   * Một giáo viên không thể đứng lớp ở 2 phòng học khác nhau trong cùng một khung giờ.
   * Một phòng học không thể xếp 2 lớp cùng học một lúc.

---

## 3. QUY TRÌNH HẠCH TOÁN TÀI CHÍNH & THU HỌC PHÍ

1. **Mức học phí cơ bản:** Áp dụng mức phí đồng giá tiêu chuẩn **4,500,000 ₫ / tháng** cho chương trình toàn diện khối THCS.
2. **Cơ chế miễn giảm (Discounts):** 
   * Học bổng xuất sắc hoặc ưu đãi đăng ký sớm: Áp dụng mức giảm cố định **500,000 ₫** hoặc **1,000,000 ₫**.
   * Số tiền thực tế học viên phải nộp (Final Amount):
     $$\text{finalAmount} = \text{baseFee (4,500,000)} - \text{discount}$$
3. **Thanh toán một phần (Partial Payments):** Hệ thống cho phép phụ huynh đóng học phí làm nhiều đợt. Trạng thái hóa đơn sẽ tự động chuyển đổi:
   * `Paid`: Đã đóng đủ ($\text{paidAmount} == \text{finalAmount}$).
   * `Partially Paid`: Đã đóng một phần ($0 < \text{paidAmount} < \text{finalAmount}$).
   * `Unpaid` hoặc `Overdue`: Chưa đóng đồng nào ($\text{paidAmount} == 0$).
4. **Nghiệp vụ hoàn phí (Refunds):** Khi học viên xin rút học bạ hoặc trút học phí vì lý do khách quan, giáo vụ lập yêu cầu hoàn phí. Kế toán phê duyệt hoàn phí sẽ hạch toán ghi nhận số tiền hoàn vào hệ thống chi phí trung tâm.

---

## 4. TIÊU CHÍ AI PHÂN TÍCH RỦI RO HỌC TẬP (AI RISK & RECOMMENDATION MATRIX)

Hệ thống tích hợp công cụ đánh giá mức độ rủi ro học tập của học viên dựa trên 3 thông số đầu vào thu thập từ Firestore:
1. **Điểm trung bình (GPA):** Thang điểm 10.
2. **Tỷ lệ chuyên cần (Attendance Rate):** Tỷ lệ buổi học có mặt %.
3. **Tỷ lệ bài tập về nhà hoàn thành (Homework Completion):** Tỷ lệ nộp bài tập về nhà %.

### A. Công thức tính toán Điểm Rủi Ro (Risk Score)
Điểm rủi ro nằm trong khoảng $[0, 100]$ được tính theo công thức trọng số nghịch đảo:
$$\text{Risk Score} = 100 - \left( \text{GPA} \times 6 + \text{Attendance Rate} \times 0.2 + \text{Homework Completion} \times 0.2 \right)$$

### B. Phân loại Cấp độ Rủi Ro (Risk Level)
Hệ thống phân chia học sinh làm 3 nhóm hành động cụ thể:

* **RỦI RO CAO (High Risk):** 
  * *Điều kiện:* $\text{GPA} < 5.0$ hoặc $\text{Attendance Rate} < 70\%$.
  * *Hành động đề xuất:* AI tự động phát tín hiệu cảnh báo tới Giáo vụ và Giáo viên chủ nhiệm để lên phương án dạy phụ đạo, liên hệ trực tiếp với phụ huynh họp khẩn cấp.
* **RỦI RO TRUNG BÌNH (Medium Risk):** 
  * *Điều kiện:* $5.0 \le \text{GPA} < 6.5$ hoặc $70\% \le \text{Attendance Rate} < 85\%$.
  * *Hành động đề xuất:* Gửi thông báo nhắc nhở làm bài tập, giáo viên theo sát trên lớp.
* **RỦI RO THẤP (Low Risk):**
  * *Điều kiện:* $\text{GPA} \ge 6.5$ và $\text{Attendance Rate} \ge 85\%$.
  * *Hành động đề xuất:* Tiếp tục duy trì phong độ và tuyên dương thành tích xuất sắc định kỳ.

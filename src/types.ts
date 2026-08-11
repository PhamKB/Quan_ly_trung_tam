export type Role = 'OWNER' | 'ACADEMIC_STAFF' | 'ACCOUNTANT' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface Student {
  id: string;
  name: string;
  classId: string;
  className: string;
  course: string;
  gpa: number;
  attendanceRate: number;
  homeworkCompletion: number;
  riskScore: number; // 0-100
  riskLevel: 'Low' | 'Medium' | 'High';
  avatar?: string;
  email: string;
  phone: string;
  tuitionOwed: number;
  tuitionPaid: number;
  parentId?: string;
  parentName?: string;
  status?: string;
  financials?: {
    baseFee: number;
    discount: number;
    finalAmount: number;
    paidAmount: number;
    tuitionOwed: number;
    status: string;
  };
}

export interface Class {
  id: string;
  name: string;
  course: string;
  teacher: string;
  room: string;
  schedule: string;
  studentsCount: number;
  capacity: number;
  status: 'Đang hoạt động' | 'Sắp khai giảng' | 'Đã hoàn thành';
  averageGpa: number;
  subject: string;
}

export interface Course {
  id: string;
  name: string;
  category: string;
  level: string;
  duration: string;
  classesCount: number;
  studentsCount: number;
  fee: number;
  status: 'Đang hoạt động' | 'Tạm dừng';
}

export interface Invoice {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  dateIssued: string;
  dueDate: string;
  amount: number;
  discount?: number;
  finalAmount?: number;
  paidAmount: number;
  status: 'Draft' | 'Issued' | 'Paid' | 'Partially Paid' | 'Overdue' | 'Cancelled' | 'Refunded';
}

export interface Payment {
  id: string;
  invoiceId: string;
  studentName: string;
  amount: number;
  method: 'Chuyển khoản' | 'Tiền mặt' | 'Ví điện tử';
  date: string;
  processor: string;
  status: 'Thành công' | 'Chờ xử lý' | 'Thất bại';
}

export interface Refund {
  id: string;
  studentName: string;
  invoiceId: string;
  amount: number;
  reason: string;
  requester: string;
  date: string;
  status: 'Chờ duyệt' | 'Đã duyệt' | 'Đã hoàn' | 'Từ chối';
}

export interface Homework {
  id: string;
  title: string;
  classId: string;
  className: string;
  subject: string;
  dateAssigned: string;
  dueDate: string;
  submittedCount: number;
  totalStudents: number;
  status: 'Đang mở' | 'Đã đóng';
  description?: string;
}

export interface Score {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  scoreRegular: number; // Điểm thường xuyên
  scoreMid: number;     // Giữa kỳ
  scoreFinal: number;   // Cuối kỳ
  average: number;      // Điểm tổng
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'Đã đạt' | 'Chưa đạt';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  school: string;
  status: 'Đang hoạt động' | 'Tạm khóa';
  avatar?: string;
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  role: string;
  joinDate: string;
  status: 'Đang làm việc' | 'Nghỉ phép' | 'Đã nghỉ việc';
  salary: number;
  email: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  ip: string;
  status: 'Success' | 'Warning' | 'Critical';
  details: string;
  metadata?: {
    requestId: string;
    before: string;
    after: string;
    userAgent: string;
  };
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  category: 'Học vụ' | 'Tài chính' | 'Ghi danh' | 'Hệ thống' | 'AI' | 'Quản trị';
  unread: boolean;
}

export interface ReportItem {
  id: string;
  title: string;
  category: 'Học vụ' | 'Tài chính' | 'Vận hành' | 'AI Analytics' | 'Điều hành';
  rowsCount: number;
  author: string;
  dateCreated: string;
  description: string;
}

export type Role = 'ADMIN' | 'OWNER' | 'ACADEMIC_STAFF' | 'ACCOUNTANT' | 'TEACHER' | 'STUDENT' | 'PARENT';

export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED' | 'GRADUATED' | 'Đang học' | 'Tạm ngừng' | 'Chuyển trường' | 'Đã tốt nghiệp';
export type ParentRelationship = 'Cha' | 'Mẹ' | 'Người giám hộ' | 'CHA' | 'ME' | 'NGUOI_GIAM_HO';

export interface Student {
  id: string; // e.g. STU-2026-001
  studentId?: string;
  userId?: string | null;
  username?: string;
  name: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: 'Nam' | 'Nữ' | 'Khác' | string;
  phone?: string;
  email?: string;
  address?: string;
  grade: number; // strictly 6, 7, 8, 9
  status: StudentStatus | string;
  parentIds?: string[];
  parentId?: string;
  parentName?: string;
  classId?: string;
  className?: string;
  course?: string;
  gpa?: number;
  attendanceRate?: number;
  homeworkCompletion?: number;
  riskScore?: number; // 0-100
  riskLevel?: 'Low' | 'Medium' | 'High';
  avatar?: string;
  tuitionOwed?: number;
  tuitionPaid?: number;
  financials?: {
    baseFee: number;
    discount: number;
    finalAmount: number;
    paidAmount: number;
    tuitionOwed: number;
    status: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Parent {
  id: string; // e.g. PAR-2026-001
  parentId?: string;
  userId?: string | null;
  username?: string;
  name: string;
  fullName?: string;
  relationship: ParentRelationship | string;
  phone: string;
  email: string;
  address?: string;
  job?: string;
  studentIds?: string[];
  childIds?: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'Đang hoạt động' | 'Tạm ngừng' | string;
  createdAt?: string;
  updatedAt?: string;
}

export type ClassStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'Đang hoạt động' | 'Tạm ngừng' | 'Đã kết thúc' | 'Sắp khai giảng';
export type EnrollmentStatus = 'ACTIVE' | 'TRANSFERRED' | 'COMPLETED' | 'CANCELLED' | 'Đang học' | 'Đã chuyển lớp' | 'Đã hoàn thành' | 'Đã hủy';

export interface Class {
  id: string;
  classId?: string;
  classCode?: string;
  className?: string;
  name: string;
  grade: number; // strictly 6, 7, 8, 9
  academicYear: string; // e.g. 2026-2027
  capacity: number; // default 18
  studentsCount?: number;
  status: ClassStatus;
  course?: string;
  teacher?: string;
  room?: string;
  schedule?: string;
  averageGpa?: number;
  subject?: string;
  teachers?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassEnrollment {
  id: string;
  enrollmentId?: string;
  studentId: string;
  studentName?: string;
  classId: string;
  className?: string;
  grade?: number;
  academicYear: string;
  startDate: string;
  endDate?: string;
  status: EnrollmentStatus;
  reason?: string;
  fromClassId?: string;
  toClassId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SubjectId = 'toan' | 'van' | 'anh' | 'ly' | 'hoa';
export type SubjectCode = 'TOAN' | 'NGU_VAN' | 'TIENG_ANH' | 'VAT_LY' | 'HOA_HOC';

export interface Subject {
  id: string;
  subjectId?: string;
  name: string;
  code: string;
  category?: string;
  description?: string;
}

export type TeacherStatus = 'ACTIVE' | 'INACTIVE' | 'Đang làm việc' | 'Tạm nghỉ' | 'Đã nghỉ';

export interface Teacher {
  id: string;
  teacherId?: string;
  userId?: string | null;
  employeeCode?: string;
  name: string;
  fullName?: string;
  phone?: string;
  email: string;
  subjectId: string; // Invariant: Exactly 1 subject
  subjectCode?: string;
  subjectName?: string;
  department?: string;
  status: TeacherStatus | string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type AssignmentStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'Đang dạy' | 'Tạm ngừng' | 'Đã kết thúc';

export interface TeacherAssignment {
  id: string;
  assignmentId?: string;
  teacherId: string;
  teacherName?: string;
  classId: string;
  className?: string;
  subjectId: string;
  subjectName?: string;
  academicYear: string;
  status: AssignmentStatus | string;
  startDate: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
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
  username?: string;
  passwordHash?: string;
  mustChangePassword?: boolean;
  studentId?: string;
  parentId?: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  school: string;
  status: 'Đang hoạt động' | 'Tạm khóa' | 'ACTIVE' | 'INACTIVE' | string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
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
  metadata?: Record<string, any>;
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

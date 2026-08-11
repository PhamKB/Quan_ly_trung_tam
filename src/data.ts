import { 
  Role,
  Student, 
  Class, 
  Course, 
  Invoice, 
  Payment, 
  Refund, 
  Homework, 
  Score, 
  User, 
  Employee, 
  AuditLog, 
  AppNotification,
  ReportItem
} from './types';

// Currency Formatter
export const formatVND = (amount: number): string => {
  return amount.toLocaleString('vi-VN') + ' ₫';
};

// Realistic Vietnamese Sample Data
export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'STU-2026-001',
    name: 'Nguyễn Minh Anh',
    classId: 'MATH-12A',
    className: '12A - Chuyên Toán',
    course: 'Toán nâng cao',
    gpa: 8.9,
    attendanceRate: 96,
    homeworkCompletion: 92,
    riskScore: 12,
    riskLevel: 'Low',
    email: 'minhanh.nguyen@gmail.com',
    phone: '0912345678',
    tuitionOwed: 3500000,
    tuitionPaid: 5000000,
  },
  {
    id: 'STU-2026-002',
    name: 'Trần Hoàng Nam',
    classId: 'MATH-12A',
    className: '12A - Chuyên Toán',
    course: 'Toán nâng cao',
    gpa: 7.2,
    attendanceRate: 91,
    homeworkCompletion: 80,
    riskScore: 28,
    riskLevel: 'Low',
    email: 'hoangnam.tran@gmail.com',
    phone: '0987654321',
    tuitionOwed: 0,
    tuitionPaid: 8500000,
  },
  {
    id: 'STU-2026-003',
    name: 'Lê Thu Hà',
    classId: 'IELTS-10C',
    className: '10C - IELTS Foundation',
    course: 'IELTS Foundation',
    gpa: 8.5,
    attendanceRate: 98,
    homeworkCompletion: 95,
    riskScore: 8,
    riskLevel: 'Low',
    email: 'thuha.le@gmail.com',
    phone: '0901234567',
    tuitionOwed: 0,
    tuitionPaid: 8500000,
  },
  {
    id: 'STU-2026-004',
    name: 'Phạm Gia Huy',
    classId: 'PHYS-12C',
    className: '12C - Vật Lý AP',
    course: 'AP Physics',
    gpa: 5.4,
    attendanceRate: 82,
    homeworkCompletion: 68,
    riskScore: 78,
    riskLevel: 'High',
    email: 'giahuy.pham@gmail.com',
    phone: '0934567890',
    tuitionOwed: 8500000,
    tuitionPaid: 0,
  },
  {
    id: 'STU-2026-005',
    name: 'Đỗ Minh Khang',
    classId: 'LIT-11B',
    className: '11B - Ngữ Văn',
    course: 'English Communication',
    gpa: 6.8,
    attendanceRate: 88,
    homeworkCompletion: 74,
    riskScore: 45,
    riskLevel: 'Medium',
    email: 'minhkhang.do@gmail.com',
    phone: '0976543210',
    tuitionOwed: 2500000,
    tuitionPaid: 6000000,
  },
  // Special candidates for AI Risk Predictions (Section 37)
  {
    id: 'STU-2026-006',
    name: 'Lancelot DuLac',
    classId: 'MATH-12A',
    className: '12A - Chuyên Toán',
    course: 'Toán nâng cao',
    gpa: 4.8,
    attendanceRate: 75,
    homeworkCompletion: 52,
    riskScore: 82,
    riskLevel: 'High',
    email: 'lancelot.dulac@smartedu.com',
    phone: '0912111222',
    tuitionOwed: 6000000,
    tuitionPaid: 2500000,
  },
  {
    id: 'STU-2026-007',
    name: 'Galahad Pure',
    classId: 'MATH-12A',
    className: '12A - Chuyên Toán',
    course: 'Toán nâng cao',
    gpa: 9.6,
    attendanceRate: 100,
    homeworkCompletion: 100,
    riskScore: 2,
    riskLevel: 'Low',
    email: 'galahad.pure@smartedu.com',
    phone: '0912333444',
    tuitionOwed: 0,
    tuitionPaid: 8500000,
  },
  {
    id: 'STU-2026-008',
    name: 'Percival Vale',
    classId: 'LIT-11B',
    className: '11B - Ngữ Văn',
    course: 'English Communication',
    gpa: 6.1,
    attendanceRate: 80,
    homeworkCompletion: 65,
    riskScore: 61,
    riskLevel: 'Medium',
    email: 'percival.vale@smartedu.com',
    phone: '0912555666',
    tuitionOwed: 4500000,
    tuitionPaid: 4000000,
  }
];

export const INITIAL_CLASSES: Class[] = [
  {
    id: 'MATH-12A',
    name: '12A - Chuyên Toán',
    course: 'Toán nâng cao',
    teacher: 'Trần Quốc Việt',
    room: 'P.302',
    schedule: 'T2/T4/T6 · 18:00',
    studentsCount: 28,
    capacity: 32,
    status: 'Đang hoạt động',
    averageGpa: 8.1,
    subject: 'Toán học'
  },
  {
    id: 'LIT-11B',
    name: '11B - Ngữ Văn',
    course: 'English Communication',
    teacher: 'Nguyễn Thu Hà',
    room: 'P.205',
    schedule: 'T3/T5 · 19:45',
    studentsCount: 24,
    capacity: 30,
    status: 'Đang hoạt động',
    averageGpa: 7.4,
    subject: 'Ngữ văn'
  },
  {
    id: 'IELTS-10C',
    name: '10C - IELTS Foundation',
    course: 'IELTS Foundation',
    teacher: 'Lê Hoàng Anh',
    room: 'P.201',
    schedule: 'T2/T4/T6 · 19:45',
    studentsCount: 18,
    capacity: 25,
    status: 'Đang hoạt động',
    averageGpa: 8.3,
    subject: 'Tiếng Anh'
  },
  {
    id: 'PHYS-12C',
    name: '12C - Vật Lý AP',
    course: 'AP Physics',
    teacher: 'Phạm Minh Đức',
    room: 'P.104',
    schedule: 'T7/CN · 09:00',
    studentsCount: 15,
    capacity: 20,
    status: 'Sắp khai giảng',
    averageGpa: 6.9,
    subject: 'Vật lý'
  },
  {
    id: 'ENG-11A',
    name: '11A - Tiếng Anh Advanced',
    course: 'IELTS Advanced',
    teacher: 'Nguyễn Thu Hà',
    room: 'P.301',
    schedule: 'T3/T5 · 18:00',
    studentsCount: 22,
    capacity: 25,
    status: 'Đang hoạt động',
    averageGpa: 7.9,
    subject: 'Tiếng Anh'
  }
];

export const INITIAL_COURSES: Course[] = [
  {
    id: 'IELTS-FND',
    name: 'IELTS Foundation',
    category: 'English',
    level: 'Cơ bản',
    duration: '12 tuần',
    classesCount: 4,
    studentsCount: 96,
    fee: 8500000,
    status: 'Đang hoạt động'
  },
  {
    id: 'IELTS-ADV',
    name: 'IELTS Advanced',
    category: 'English',
    level: 'Nâng cao',
    duration: '16 tuần',
    classesCount: 2,
    studentsCount: 45,
    fee: 12500000,
    status: 'Đang hoạt động'
  },
  {
    id: 'TOEIC-PREP',
    name: 'TOEIC Preparation',
    category: 'English',
    level: 'Trung cấp',
    duration: '10 tuần',
    classesCount: 3,
    studentsCount: 60,
    fee: 6500000,
    status: 'Đang hoạt động'
  },
  {
    id: 'ENG-COMM',
    name: 'English Communication',
    category: 'English',
    level: 'Giao tiếp',
    duration: '8 tuần',
    classesCount: 5,
    studentsCount: 110,
    fee: 5500000,
    status: 'Đang hoạt động'
  },
  {
    id: 'MATH-G8',
    name: 'Mathematics Grade 8',
    category: 'Mathematics',
    level: 'Cơ bản',
    duration: '20 tuần',
    classesCount: 2,
    studentsCount: 38,
    fee: 7200000,
    status: 'Đang hoạt động'
  },
  {
    id: 'AP-PHYS',
    name: 'AP Physics',
    category: 'Science',
    level: 'Chuyên sâu',
    duration: '24 tuần',
    classesCount: 1,
    studentsCount: 15,
    fee: 15000000,
    status: 'Đang hoạt động'
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-001',
    studentId: 'STU-2026-001',
    studentName: 'Nguyễn Minh Anh',
    className: '12A - Chuyên Toán',
    dateIssued: '2026-07-05',
    dueDate: '2026-08-15',
    amount: 8500000,
    paidAmount: 5000000,
    status: 'Partially Paid'
  },
  {
    id: 'INV-2026-002',
    studentId: 'STU-2026-002',
    studentName: 'Trần Hoàng Nam',
    className: '12A - Chuyên Toán',
    dateIssued: '2026-07-05',
    dueDate: '2026-08-05',
    amount: 8500000,
    paidAmount: 8500000,
    status: 'Paid'
  },
  {
    id: 'INV-2026-003',
    studentId: 'STU-2026-003',
    studentName: 'Lê Thu Hà',
    className: '10C - IELTS Foundation',
    dateIssued: '2026-07-10',
    dueDate: '2026-08-10',
    amount: 8500000,
    paidAmount: 8500000,
    status: 'Paid'
  },
  {
    id: 'INV-2026-004',
    studentId: 'STU-2026-004',
    studentName: 'Phạm Gia Huy',
    className: '12C - Vật Lý AP',
    dateIssued: '2026-07-12',
    dueDate: '2026-08-12',
    amount: 8500000,
    paidAmount: 0,
    status: 'Overdue'
  },
  {
    id: 'INV-2026-005',
    studentId: 'STU-2026-005',
    studentName: 'Đỗ Minh Khang',
    className: '11B - Ngữ Văn',
    dateIssued: '2026-07-15',
    dueDate: '2026-08-15',
    amount: 8500000,
    paidAmount: 6000000,
    status: 'Partially Paid'
  }
];

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'PAY-2026-001',
    invoiceId: 'INV-2026-001',
    studentName: 'Nguyễn Minh Anh',
    amount: 5000000,
    method: 'Chuyển khoản',
    date: '2026-07-06 14:32',
    processor: 'Nguyễn Thu Hương',
    status: 'Thành công'
  },
  {
    id: 'PAY-2026-002',
    invoiceId: 'INV-2026-002',
    studentName: 'Trần Hoàng Nam',
    amount: 8500000,
    method: 'Tiền mặt',
    date: '2026-07-05 09:15',
    processor: 'Nguyễn Thu Hương',
    status: 'Thành công'
  },
  {
    id: 'PAY-2026-003',
    invoiceId: 'INV-2026-003',
    studentName: 'Lê Thu Hà',
    amount: 8500000,
    method: 'Chuyển khoản',
    date: '2026-07-11 11:45',
    processor: 'Phạm Thị Thúy',
    status: 'Thành công'
  }
];

export const INITIAL_REFUNDS: Refund[] = [
  {
    id: 'REF-2026-001',
    studentName: 'Vũ Đức Thành',
    invoiceId: 'INV-2026-909',
    amount: 3200000,
    reason: 'Xin thôi học do gia đình chuyển nơi sinh sống sang tỉnh khác',
    requester: 'Lê Hoàng Anh',
    date: '2026-08-01',
    status: 'Chờ duyệt'
  },
  {
    id: 'REF-2026-002',
    studentName: 'Hoàng Văn Minh',
    invoiceId: 'INV-2026-788',
    amount: 1500000,
    reason: 'Hoàn trả phần học phí ưu đãi nộp thừa đợt tuyển sinh',
    requester: 'Phạm Thị Thúy',
    date: '2026-07-20',
    status: 'Đã hoàn'
  }
];

export const INITIAL_HOMEWORKS: Homework[] = [
  {
    id: 'HW-12A-001',
    title: 'Bài tập Hàm số bậc hai',
    classId: 'MATH-12A',
    className: '12A - Chuyên Toán',
    subject: 'Toán nâng cao',
    dateAssigned: '2026-08-05',
    dueDate: '2026-08-10',
    submittedCount: 24,
    totalStudents: 28,
    status: 'Đang mở',
    description: 'Yêu cầu hoàn thành các bài tập từ trang 45 đến trang 48 sách bài tập Toán nâng cao 12. Chú ý các bài toán biện luận tham số m của đồ thị.'
  },
  {
    id: 'HW-12A-002',
    title: 'Bài tập Giới hạn dãy số',
    classId: 'MATH-12A',
    className: '12A - Chuyên Toán',
    subject: 'Toán nâng cao',
    dateAssigned: '2026-08-01',
    dueDate: '2026-08-07',
    submittedCount: 28,
    totalStudents: 28,
    status: 'Đã đóng',
    description: 'Tính giới hạn các dãy số vô hạn. Trình bày chi tiết phương pháp kẹp và sử dụng định lý Weierstrass.'
  },
  {
    id: 'HW-11B-001',
    title: 'Phân tích văn học Hiện thực',
    classId: 'LIT-11B',
    className: '11B - Ngữ Văn',
    subject: 'Ngữ văn',
    dateAssigned: '2026-08-06',
    dueDate: '2026-08-12',
    submittedCount: 18,
    totalStudents: 24,
    status: 'Đang mở',
    description: 'Viết bài luận ngắn (800-1000 từ) phân tích giá trị hiện thực và nhân đạo trong tác phẩm Chí Phèo của nhà văn Nam Cao.'
  }
];

export const INITIAL_SCORES: Score[] = [
  {
    id: 'SCR-001',
    studentId: 'STU-2026-001',
    studentName: 'Nguyễn Minh Anh',
    classId: 'MATH-12A',
    className: '12A - Chuyên Toán',
    scoreRegular: 8.5,
    scoreMid: 8.8,
    scoreFinal: 9.2,
    average: 8.9,
    grade: 'A',
    status: 'Đã đạt'
  },
  {
    id: 'SCR-002',
    studentId: 'STU-2026-002',
    studentName: 'Trần Hoàng Nam',
    classId: 'MATH-12A',
    className: '12A - Chuyên Toán',
    scoreRegular: 7.0,
    scoreMid: 6.8,
    scoreFinal: 7.5,
    average: 7.2,
    grade: 'B',
    status: 'Đã đạt'
  },
  {
    id: 'SCR-004',
    studentId: 'STU-2026-004',
    studentName: 'Phạm Gia Huy',
    classId: 'PHYS-12C',
    className: '12C - Vật Lý AP',
    scoreRegular: 5.5,
    scoreMid: 5.0,
    scoreFinal: 5.6,
    average: 5.4,
    grade: 'D',
    status: 'Chưa đạt'
  },
  {
    id: 'SCR-005',
    studentId: 'STU-2026-005',
    studentName: 'Đỗ Minh Khang',
    classId: 'LIT-11B',
    className: '11B - Ngữ Văn',
    scoreRegular: 6.5,
    scoreMid: 6.8,
    scoreFinal: 7.0,
    average: 6.8,
    grade: 'C',
    status: 'Đã đạt'
  },
  {
    id: 'SCR-006',
    studentId: 'STU-2026-006',
    studentName: 'Lancelot DuLac',
    classId: 'MATH-12A',
    className: '12A - Chuyên Toán',
    scoreRegular: 5.0,
    scoreMid: 4.5,
    scoreFinal: 4.8,
    average: 4.8,
    grade: 'F',
    status: 'Chưa đạt'
  },
  {
    id: 'SCR-007',
    studentId: 'STU-2026-007',
    studentName: 'Galahad Pure',
    classId: 'MATH-12A',
    className: '12A - Chuyên Toán',
    scoreRegular: 9.5,
    scoreMid: 9.6,
    scoreFinal: 9.8,
    average: 9.6,
    grade: 'A',
    status: 'Đã đạt'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-001',
    name: 'Trần Việt Dũng',
    email: 'vietdung.owner@smartedu.com',
    role: 'OWNER',
    department: 'Ban Điều Hành',
    school: 'Trụ sở chính',
    status: 'Đang hoạt động',
  },
  {
    id: 'USR-002',
    name: 'Nguyễn Thu Hà',
    email: 'thuha.teacher@smartedu.com',
    role: 'TEACHER',
    department: 'Tổ Tiếng Anh',
    school: 'Trụ sở chính',
    status: 'Đang hoạt động',
  },
  {
    id: 'USR-003',
    name: 'Trần Quốc Việt',
    email: 'viet.tran@smartedu.com',
    role: 'TEACHER',
    department: 'Tổ Tự Nhiên',
    school: 'Trụ sở chính',
    status: 'Đang hoạt động',
  },
  {
    id: 'USR-004',
    name: 'Phạm Thị Thúy',
    email: 'thuyfinance@smartedu.com',
    role: 'ACCOUNTANT',
    department: 'Phòng Tài Chính',
    school: 'Trụ sở chính',
    status: 'Đang hoạt động',
  },
  {
    id: 'USR-005',
    name: 'Lê Hoàng Anh',
    email: 'hoanganh.staff@smartedu.com',
    role: 'ACADEMIC_STAFF',
    department: 'Phòng Học Vụ',
    school: 'Trụ sở chính',
    status: 'Đang hoạt động',
  },
  {
    id: 'USR-006',
    name: 'Nguyễn Minh Anh',
    email: 'minhanh.nguyen@gmail.com',
    role: 'STUDENT',
    department: 'Lớp 12A',
    school: 'Trụ sở chính',
    status: 'Đang hoạt động',
  },
  {
    id: 'USR-007',
    name: 'Trần Văn Hùng',
    email: 'hungparent@gmail.com',
    role: 'PARENT',
    department: 'Phụ huynh Minh Anh',
    school: 'Trụ sở chính',
    status: 'Đang hoạt động',
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'EMP-001',
    name: 'Trần Quốc Việt',
    department: 'Tổ Tự Nhiên',
    role: 'Giảng viên Toán cao cấp',
    joinDate: '2024-03-15',
    status: 'Đang làm việc',
    salary: 22000000,
    email: 'viet.tran@smartedu.com'
  },
  {
    id: 'EMP-002',
    name: 'Nguyễn Thu Hà',
    department: 'Tổ Tiếng Anh',
    role: 'Trưởng bộ môn Tiếng Anh',
    joinDate: '2023-09-01',
    status: 'Đang làm việc',
    salary: 25000000,
    email: 'thuha.teacher@smartedu.com'
  },
  {
    id: 'EMP-003',
    name: 'Phạm Thị Thúy',
    department: 'Phòng Tài Chính',
    role: 'Kế toán trưởng',
    joinDate: '2024-01-10',
    status: 'Đang làm việc',
    salary: 18000000,
    email: 'thuyfinance@smartedu.com'
  },
  {
    id: 'EMP-004',
    name: 'Lê Hoàng Anh',
    department: 'Phòng Học Vụ',
    role: 'Chuyên viên quản lý đào tạo',
    joinDate: '2025-02-20',
    status: 'Đang làm việc',
    salary: 14500000,
    email: 'hoanganh.staff@smartedu.com'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'NTF-001',
    title: 'Bài tập mới được nộp',
    message: 'Nguyễn Minh Anh đã nộp bài tập "Hàm số bậc hai" trễ 5 phút.',
    time: '5 phút trước',
    category: 'Học vụ',
    unread: true
  },
  {
    id: 'NTF-002',
    title: 'Thanh toán học phí thành công',
    message: 'Học viên Lê Thu Hà đã đóng học phí IELTS Foundation (8,500,000 ₫).',
    time: '20 phút trước',
    category: 'Tài chính',
    unread: true
  },
  {
    id: 'NTF-003',
    title: 'Hồ sơ ghi danh mới',
    message: 'Học viên Đỗ Minh Khang vừa ghi danh khóa học English Communication.',
    time: '2 giờ trước',
    category: 'Ghi danh',
    unread: false
  },
  {
    id: 'NTF-004',
    title: 'AI Cảnh báo Rủi ro',
    message: 'Học viên Phạm Gia Huy có rủi ro tụt lại học tập ở mức Cao (78%).',
    time: '1 ngày trước',
    category: 'AI',
    unread: true
  },
  {
    id: 'NTF-005',
    title: 'Yêu cầu hoàn phí chờ duyệt',
    message: 'Lê Hoàng Anh gửi yêu cầu hoàn phí cho học viên Vũ Đức Thành.',
    time: '2 ngày trước',
    category: 'Tài chính',
    unread: false
  }
];

export const INITIAL_REPORTS: ReportItem[] = [
  {
    id: 'REPV-2026-001',
    title: 'Báo cáo doanh thu khóa Toán nâng cao Q2',
    category: 'Tài chính',
    rowsCount: 124,
    author: 'Phạm Thị Thúy',
    dateCreated: '2026-07-30',
    description: 'Tổng hợp số liệu kinh doanh, học phí phải thu, đã thu và công nợ tồn đọng của các lớp thuộc tổ Toán học.'
  },
  {
    id: 'REPV-2026-002',
    title: 'Báo cáo chuyên cần tháng 7 khối trung học',
    category: 'Học vụ',
    rowsCount: 88,
    author: 'Lê Hoàng Anh',
    dateCreated: '2026-08-01',
    description: 'Thống kê tỷ lệ chuyên cần, số buổi vắng có phép/không phép và các lớp có tỷ lệ chuyên cần dưới 90%.'
  },
  {
    id: 'REPV-2026-004',
    title: 'Sổ cái dòng tiền học viện & các khoản chi phụ trợ',
    category: 'Tài chính',
    rowsCount: 256,
    author: 'Phạm Thị Thúy',
    dateCreated: '2026-07-28',
    description: 'Ghi chép các luồng thu chi nội bộ, chi phí vận hành, tiền điện nước mặt bằng và lương nhân viên.'
  },
  {
    id: 'REPV-2026-005',
    title: 'Báo cáo bài tập & điểm số lớp Vật Lý AP',
    category: 'Học vụ',
    rowsCount: 15,
    author: 'Phạm Minh Đức',
    dateCreated: '2026-08-02',
    description: 'Bảng điểm chi tiết các đầu điểm thường xuyên, giữa kỳ, tỷ lệ hoàn thành bài tự học tại nhà lớp Vật Lý.'
  },
  {
    id: 'REPV-2026-006',
    title: 'Thống kê giờ dạy & đánh giá giáo viên học kỳ hè',
    category: 'Điều hành',
    rowsCount: 34,
    author: 'Trần Việt Dũng',
    dateCreated: '2026-08-05',
    description: 'Tổng hợp số giờ đứng lớp thực tế, điểm đánh giá GPA trung bình lớp và mức độ hài lòng phản hồi của phụ huynh.'
  },
  {
    id: 'REPV-2026-007',
    title: 'Báo cáo rà soát rủi ro hổng kiến thức định kỳ',
    category: 'AI Analytics',
    rowsCount: 112,
    author: 'AI SmartEngine',
    dateCreated: '2026-08-06',
    description: 'Phân tích từ AI về phân vị điểm học viên, phát hiện các nhóm kiến thức bị rỗng và đề xuất điều chỉnh giáo án.'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-001',
    timestamp: '2026-08-10 13:42:15',
    actor: 'Trần Việt Dũng',
    role: 'OWNER',
    action: 'ĐĂNG NHẬP',
    target: 'Hệ thống ERP',
    ip: '14.226.45.10',
    status: 'Success',
    details: 'Đăng nhập hệ thống thành công qua trình duyệt Chrome trên macOS.',
    metadata: {
      requestId: 'req_8f12a3bc',
      before: '-',
      after: 'Phiên hoạt động active',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/115.0'
    }
  },
  {
    id: 'AUD-002',
    timestamp: '2026-08-10 11:20:04',
    actor: 'Phạm Thị Thúy',
    role: 'ACCOUNTANT',
    action: 'CẬP NHẬT HÓA ĐƠN',
    target: 'INV-2026-001',
    ip: '115.79.138.52',
    status: 'Success',
    details: 'Thay đổi trạng thái hóa đơn Nguyễn Minh Anh từ Issued sang Partially Paid sau khi nhận 5.000.000đ chuyển khoản.',
    metadata: {
      requestId: 'req_7a3bc5de',
      before: 'status: "Issued", paid: 0',
      after: 'status: "Partially Paid", paid: 5000000',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/114.0'
    }
  },
  {
    id: 'AUD-003',
    timestamp: '2026-08-10 09:15:33',
    actor: 'Lê Hoàng Anh',
    role: 'ACADEMIC_STAFF',
    action: 'DUYỆT GHI DANH',
    target: 'ENR-2026-005',
    ip: '14.161.8.214',
    status: 'Success',
    details: 'Duyệt hồ sơ ghi danh của Đỗ Minh Khang vào lớp 11B - Ngữ Văn.',
    metadata: {
      requestId: 'req_9ef512ab',
      before: 'status: "Chờ xử lý"',
      after: 'status: "Đang học"',
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X)'
    }
  },
  {
    id: 'AUD-004',
    timestamp: '2026-08-09 16:50:11',
    actor: 'Nguyễn Thu Hà',
    role: 'TEACHER',
    action: 'CẬP NHẬT ĐIỂM SỐ',
    target: 'MATH-12A Bảng điểm',
    ip: '42.113.120.44',
    status: 'Success',
    details: 'Nhập điểm giữa kỳ môn Toán nâng cao cho học viên Trần Hoàng Nam (6.8).',
    metadata: {
      requestId: 'req_1a2b3c4d',
      before: 'scoreMid: null',
      after: 'scoreMid: 6.8',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/16.5'
    }
  },
  {
    id: 'AUD-005',
    timestamp: '2026-08-09 10:05:00',
    actor: 'Hệ thống AI',
    role: 'OWNER',
    action: 'QUÉT RỦI RO',
    target: 'Học viên Phạm Gia Huy',
    ip: '127.0.0.1',
    status: 'Warning',
    details: 'Phát hiện điểm chuyên cần giảm mạnh xuống 82% kèm bài tập nộp thiếu 3 tuần liên tiếp. Đẩy mức rủi ro lên 78% (HIGH).',
    metadata: {
      requestId: 'req_auto_ai_90',
      before: 'risk: 42% (Medium)',
      after: 'risk: 78% (High)',
      userAgent: 'AI SmartEngine v1.0'
    }
  }
];

export const ALLOWED_TABS_BY_ROLE: Record<Role, string[]> = {
  ADMIN: [
    'dashboard', 'enrollment', 'contracts', 'classes', 'subjects', 'schedule', 
    'attendance', 'homework', 'scores', 'academic_reports', 'tuition', 'invoices', 
    'payments', 'refunds', 'ai_study', 'ai_analytics', 'ai_risk', 'ai_exam', 
    'hr', 'users', 'roles', 'settings', 'notifications', 'observability', 'reports_hub'
  ],
  OWNER: [
    'dashboard', 'enrollment', 'contracts', 'classes', 'subjects', 'schedule', 
    'attendance', 'homework', 'scores', 'academic_reports', 'tuition', 'invoices', 
    'payments', 'refunds', 'ai_study', 'ai_analytics', 'ai_risk', 'ai_exam', 
    'hr', 'users', 'roles', 'settings', 'notifications', 'observability', 'reports_hub'
  ],
  ACADEMIC_STAFF: [
    'dashboard', 'enrollment', 'contracts', 'classes', 'subjects', 'schedule', 
    'attendance', 'homework', 'scores', 'academic_reports', 'tuition', 'reports_hub'
  ],
  ACCOUNTANT: [
    'dashboard', 'tuition', 'invoices', 'payments', 'refunds', 'reports_hub'
  ],
  TEACHER: [
    'dashboard', 'classes', 'subjects', 'schedule', 'attendance', 'homework', 'scores'
  ],
  STUDENT: [
    'dashboard', 'subjects', 'schedule', 'homework', 'scores', 'ai_study', 'ai_analytics'
  ],
  PARENT: [
    'dashboard', 'classes', 'subjects', 'schedule', 'homework', 'scores', 'tuition'
  ]
};

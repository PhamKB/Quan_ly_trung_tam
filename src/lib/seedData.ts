import { doc, writeBatch, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

// Subjects (Exactly 5 subjects: Toán, Ngữ văn, Tiếng Anh, Vật lý, Hóa học - NO Sinh học)
export const SUBJECTS = [
  { id: 'toan', name: 'Toán học', code: 'TOAN' },
  { id: 'van', name: 'Ngữ văn', code: 'NGU_VAN' },
  { id: 'anh', name: 'Tiếng Anh', code: 'TIENG_ANH' },
  { id: 'ly', name: 'Vật lý', code: 'VAT_LY' },
  { id: 'hoa', name: 'Hóa học', code: 'HOA_HOC' },
];

// Teachers (Exactly 15 teachers, 3 per subject)
export const TEACHERS = [
  // Toán học
  { id: 'teacher_toan_1', teacherId: 'TCH-2026-001', employeeCode: 'TCH-2026-001', name: 'Trần Quốc Việt', fullName: 'Trần Quốc Việt', email: 'gv.viettoan@smartedu.vn', phone: '0913000101', subjectId: 'toan', subjectCode: 'TOAN', subjectName: 'Toán học', department: 'Tổ Tự Nhiên', status: 'ACTIVE' },
  { id: 'teacher_toan_2', teacherId: 'TCH-2026-002', employeeCode: 'TCH-2026-002', name: 'Nguyễn Chí Thanh', fullName: 'Nguyễn Chí Thanh', email: 'gv.thanhtoan@smartedu.vn', phone: '0913000102', subjectId: 'toan', subjectCode: 'TOAN', subjectName: 'Toán học', department: 'Tổ Tự Nhiên', status: 'ACTIVE' },
  { id: 'teacher_toan_3', teacherId: 'TCH-2026-003', employeeCode: 'TCH-2026-003', name: 'Vũ Đình Long', fullName: 'Vũ Đình Long', email: 'gv.longtoan@smartedu.vn', phone: '0913000103', subjectId: 'toan', subjectCode: 'TOAN', subjectName: 'Toán học', department: 'Tổ Tự Nhiên', status: 'ACTIVE' },
  // Ngữ văn
  { id: 'teacher_van_1', teacherId: 'TCH-2026-004', employeeCode: 'TCH-2026-004', name: 'Nguyễn Thu Hà', fullName: 'Nguyễn Thu Hà', email: 'gv.havan@smartedu.vn', phone: '0913000104', subjectId: 'van', subjectCode: 'NGU_VAN', subjectName: 'Ngữ văn', department: 'Tổ Xã Hội', status: 'ACTIVE' },
  { id: 'teacher_van_2', teacherId: 'TCH-2026-005', employeeCode: 'TCH-2026-005', name: 'Phạm Ngọc Lan', fullName: 'Phạm Ngọc Lan', email: 'gv.lanvan@smartedu.vn', phone: '0913000105', subjectId: 'van', subjectCode: 'NGU_VAN', subjectName: 'Ngữ văn', department: 'Tổ Xã Hội', status: 'ACTIVE' },
  { id: 'teacher_van_3', teacherId: 'TCH-2026-006', employeeCode: 'TCH-2026-006', name: 'Lê Khánh Huyền', fullName: 'Lê Khánh Huyền', email: 'gv.huyenvan@smartedu.vn', phone: '0913000106', subjectId: 'van', subjectCode: 'NGU_VAN', subjectName: 'Ngữ văn', department: 'Tổ Xã Hội', status: 'ACTIVE' },
  // Tiếng Anh
  { id: 'teacher_anh_1', teacherId: 'TCH-2026-007', employeeCode: 'TCH-2026-007', name: 'Lê Hoàng Anh', fullName: 'Lê Hoàng Anh', email: 'gv.anhenglish@smartedu.vn', phone: '0913000107', subjectId: 'anh', subjectCode: 'TIENG_ANH', subjectName: 'Tiếng Anh', department: 'Tổ Ngoại Ngữ', status: 'ACTIVE' },
  { id: 'teacher_anh_2', teacherId: 'TCH-2026-008', employeeCode: 'TCH-2026-008', name: 'Đỗ Quỳnh Chi', fullName: 'Đỗ Quỳnh Chi', email: 'gv.chienglish@smartedu.vn', phone: '0913000108', subjectId: 'anh', subjectCode: 'TIENG_ANH', subjectName: 'Tiếng Anh', department: 'Tổ Ngoại Ngữ', status: 'ACTIVE' },
  { id: 'teacher_anh_3', teacherId: 'TCH-2026-009', employeeCode: 'TCH-2026-009', name: 'Trịnh Minh Trí', fullName: 'Trịnh Minh Trí', email: 'gv.trienglish@smartedu.vn', phone: '0913000109', subjectId: 'anh', subjectCode: 'TIENG_ANH', subjectName: 'Tiếng Anh', department: 'Tổ Ngoại Ngữ', status: 'ACTIVE' },
  // Vật lý
  { id: 'teacher_ly_1', teacherId: 'TCH-2026-010', employeeCode: 'TCH-2026-010', name: 'Phạm Minh Đức', fullName: 'Phạm Minh Đức', email: 'gv.ducly@smartedu.vn', phone: '0913000110', subjectId: 'ly', subjectCode: 'VAT_LY', subjectName: 'Vật lý', department: 'Tổ Tự Nhiên', status: 'ACTIVE' },
  { id: 'teacher_ly_2', teacherId: 'TCH-2026-011', employeeCode: 'TCH-2026-011', name: 'Hoàng Thế Anh', fullName: 'Hoàng Thế Anh', email: 'gv.anhly@smartedu.vn', phone: '0913000111', subjectId: 'ly', subjectCode: 'VAT_LY', subjectName: 'Vật lý', department: 'Tổ Tự Nhiên', status: 'ACTIVE' },
  { id: 'teacher_ly_3', teacherId: 'TCH-2026-012', employeeCode: 'TCH-2026-012', name: 'Vũ Việt Hoàng', fullName: 'Vũ Việt Hoàng', email: 'gv.hoangly@smartedu.vn', phone: '0913000112', subjectId: 'ly', subjectCode: 'VAT_LY', subjectName: 'Vật lý', department: 'Tổ Tự Nhiên', status: 'ACTIVE' },
  // Hóa học
  { id: 'teacher_hoa_1', teacherId: 'TCH-2026-013', employeeCode: 'TCH-2026-013', name: 'Ngô Quốc Bảo', fullName: 'Ngô Quốc Bảo', email: 'gv.baohoa@smartedu.vn', phone: '0913000113', subjectId: 'hoa', subjectCode: 'HOA_HOC', subjectName: 'Hóa học', department: 'Tổ Tự Nhiên', status: 'ACTIVE' },
  { id: 'teacher_hoa_2', teacherId: 'TCH-2026-014', employeeCode: 'TCH-2026-014', name: 'Nguyễn Mai Anh', fullName: 'Nguyễn Mai Anh', email: 'gv.maianhhoa@smartedu.vn', phone: '0913000114', subjectId: 'hoa', subjectCode: 'HOA_HOC', subjectName: 'Hóa học', department: 'Tổ Tự Nhiên', status: 'ACTIVE' },
  { id: 'teacher_hoa_3', teacherId: 'TCH-2026-015', employeeCode: 'TCH-2026-015', name: 'Dương Đức Duy', fullName: 'Dương Đức Duy', email: 'gv.duyhoa@smartedu.vn', phone: '0913000115', subjectId: 'hoa', subjectCode: 'HOA_HOC', subjectName: 'Hóa học', department: 'Tổ Tự Nhiên', status: 'ACTIVE' },
];

// Classes (12 classes: 6, 7, 8, 9)
export const CLASSES = [
  { id: 'class_6A1', classId: 'class_6A1', classCode: '6A1', className: 'Lớp 6A1', name: 'Lớp 6A1', grade: 6, room: 'Phòng 101', capacity: 18, academicYear: '2026-2027', schedule: 'Thứ 2 - Thứ 4 - Thứ 6 · 08:00' },
  { id: 'class_6A2', classId: 'class_6A2', classCode: '6A2', className: 'Lớp 6A2', name: 'Lớp 6A2', grade: 6, room: 'Phòng 102', capacity: 18, academicYear: '2026-2027', schedule: 'Thứ 3 - Thứ 5 - Thứ 7 · 08:00' },
  { id: 'class_6A3', classId: 'class_6A3', classCode: '6A3', className: 'Lớp 6A3', name: 'Lớp 6A3', grade: 6, room: 'Phòng 103', capacity: 18, academicYear: '2026-2027', schedule: 'Thứ 2 - Thứ 4 - Thứ 6 · 14:00' },

  { id: 'class_7A1', classId: 'class_7A1', classCode: '7A1', className: 'Lớp 7A1', name: 'Lớp 7A1', grade: 7, room: 'Phòng 201', capacity: 18, academicYear: '2026-2027', schedule: 'Thứ 3 - Thứ 5 - Thứ 7 · 14:00' },
  { id: 'class_7A2', classId: 'class_7A2', classCode: '7A2', className: 'Lớp 7A2', name: 'Lớp 7A2', grade: 7, room: 'Phòng 202', capacity: 18, academicYear: '2026-2027', schedule: 'Thứ 2 - Thứ 4 - Thứ 6 · 10:00' },
  { id: 'class_7A3', classId: 'class_7A3', classCode: '7A3', className: 'Lớp 7A3', name: 'Lớp 7A3', grade: 7, room: 'Phòng 203', capacity: 18, academicYear: '2026-2027', schedule: 'Thứ 3 - Thứ 5 - Thứ 7 · 10:00' },

  { id: 'class_8A1', classId: 'class_8A1', classCode: '8A1', className: 'Lớp 8A1', name: 'Lớp 8A1', grade: 8, room: 'Phòng 301', capacity: 18, academicYear: '2026-2027', schedule: 'Thứ 2 - Thứ 4 - Thứ 6 · 15:30' },
  { id: 'class_8A2', classId: 'class_8A2', classCode: '8A2', className: 'Lớp 8A2', name: 'Lớp 8A2', grade: 8, room: 'Phòng 302', capacity: 18, academicYear: '2026-2027', schedule: 'Thứ 3 - Thứ 5 - Thứ 7 · 15:30' },
  { id: 'class_8A3', classId: 'class_8A3', classCode: '8A3', className: 'Lớp 8A3', name: 'Lớp 8A3', grade: 8, room: 'Phòng 303', capacity: 18, academicYear: '2026-2027', schedule: 'Thứ 2 - Thứ 4 - Thứ 6 · 19:30' },

  { id: 'class_9A1', classId: 'class_9A1', classCode: '9A1', className: 'Lớp 9A1', name: 'Lớp 9A1', grade: 9, room: 'Phòng 401', capacity: 18, academicYear: '2026-2027', schedule: 'Thứ 3 - Thứ 5 - Thứ 7 · 19:30' },
  { id: 'class_9A2', classId: 'class_9A2', classCode: '9A2', className: 'Lớp 9A2', name: 'Lớp 9A2', grade: 9, room: 'Phòng 402', capacity: 18, academicYear: '2026-2027', schedule: 'Thứ 2 - Thứ 4 - Thứ 6 · 17:30' },
  { id: 'class_9A3', classId: 'class_9A3', classCode: '9A3', className: 'Lớp 9A3', name: 'Lớp 9A3', grade: 9, room: 'Phòng 403', capacity: 18, academicYear: '2026-2027', schedule: 'Thứ 3 - Thứ 5 - Thứ 7 · 17:30' },
];

// Helper to generate deterministic students and parents (Vietnamese names)
const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const middleNames = ['Văn', 'Thị', 'Minh', 'Thanh', 'Hữu', 'Đức', 'Hoàng', 'Khánh', 'Ngọc', 'Thu', 'Thùy', 'Hải', 'Xuân', 'Kim', 'Quốc'];
const lastNames = ['Anh', 'Bình', 'Chương', 'Dũng', 'Em', 'Giang', 'Hải', 'Hùng', 'Hòa', 'Hà', 'Khánh', 'Linh', 'Long', 'Lan', 'Mai', 'Nam', 'Nhân', 'Phúc', 'Phương', 'Quân', 'Sơn', 'Tú', 'Thảo', 'Trang', 'Vinh', 'Yến'];

const parentJobs = ['Kỹ sư', 'Giáo viên', 'Kinh doanh tự do', 'Bác sĩ', 'Nhân viên văn phòng', 'Kế toán', 'Buôn bán', 'Dược sĩ'];

export function generateSeedData() {
  const students: any[] = [];
  const parents: any[] = [];
  const users: any[] = [];

  // Add default testing accounts
  // 1. CHỦ TRUNG TÂM (ADMIN)
  users.push({
    id: 'user_owner',
    email: 'admin@smartedu.vn',
    displayName: 'Nguyễn Thế Dũng (Chủ trung tâm)',
    role: 'OWNER',
    phone: '0901112222',
    status: 'Đang hoạt động',
    department: 'Ban Điều Hành',
  });

  // 2. GIÁO VỤ (ACADEMIC_STAFF)
  users.push({
    id: 'user_giaovu',
    email: 'giaovu@smartedu.vn',
    displayName: 'Trần Thị Mai (Giáo vụ)',
    role: 'ACADEMIC_STAFF',
    phone: '0903334444',
    status: 'Đang hoạt động',
    department: 'Phòng Học Vụ',
  });

  // 3. KẾ TOÁN (ACCOUNTANT)
  users.push({
    id: 'user_accountant',
    email: 'ketoan@smartedu.vn',
    displayName: 'Lê Hoàng Phong (Kế toán)',
    role: 'ACCOUNTANT',
    phone: '0905556666',
    status: 'Đang hoạt động',
    department: 'Phòng Tài Chính',
  });

  // Add teacher users
  TEACHERS.forEach((teacher, idx) => {
    users.push({
      id: `user_${teacher.id}`,
      email: teacher.email,
      displayName: teacher.name,
      role: 'TEACHER',
      phone: `0913000${(100 + idx).toString().slice(-3)}`,
      status: 'Đang hoạt động',
      department: teacher.department,
    });
  });

  // Generate 216 Students (54 students per grade, 18 per class across 12 classes)
  let studentCounter = 1;
  const grades = [6, 7, 8, 9];

  grades.forEach((grade) => {
    const gradeClasses = CLASSES.filter(c => c.grade === grade);
    
    for (let i = 1; i <= 54; i++) {
      const studentId = `STU-2026-${studentCounter.toString().padStart(3, '0')}`;
      const parentId = `PAR-2026-${studentCounter.toString().padStart(3, '0')}`;
      
      const sFirst = firstNames[studentCounter % firstNames.length];
      const sMid = middleNames[(studentCounter + 3) % middleNames.length];
      const sLast = lastNames[(studentCounter + 7) % lastNames.length];
      const studentName = `${sFirst} ${sMid} ${sLast}`;

      const pFirst = sFirst; // Keep family name
      const pMid = middleNames[(studentCounter + 8) % middleNames.length];
      const pLast = lastNames[(studentCounter + 12) % lastNames.length];
      const parentName = `${pFirst} ${pMid} ${pLast}`;

      const parentEmail = `ph.${studentCounter}@smartedu.vn`;
      const studentEmail = `hs.${studentCounter}@smartedu.vn`;

      // Distribute student to one of the 3 classes in this grade
      const assignedClass = gradeClasses[(i - 1) % gradeClasses.length];

      // Setup realistic learning values
      // Deterministic learning indicators
      const seedValue = (studentCounter * 17) % 100;
      let attendanceRate = 85 + (seedValue % 16); // 85% to 100%
      let homeworkCompletion = 80 + (seedValue % 21); // 80% to 100%
      let gpa = parseFloat((6.0 + (seedValue % 40) / 10).toFixed(1)); // 6.0 to 10.0

      // Add a couple of high-risk cases explicitly
      if (studentCounter === 6) {
        // High risk student 1 (STU-2026-006 Lancelot DuLac equivalent)
        attendanceRate = 72;
        homeworkCompletion = 52;
        gpa = 4.8;
      } else if (studentCounter === 14) {
        // High risk student 2
        attendanceRate = 65;
        homeworkCompletion = 45;
        gpa = 3.9;
      } else if (studentCounter === 23) {
        // Medium risk
        attendanceRate = 79;
        homeworkCompletion = 68;
        gpa = 5.5;
      }

      // Add parent account
      users.push({
        id: `user_${parentId}`,
        email: parentEmail,
        displayName: parentName,
        role: 'PARENT',
        phone: `0937000${studentCounter.toString().padStart(3, '0')}`,
        status: 'Đang hoạt động',
        department: 'Phụ huynh',
      });

      // Add student account
      users.push({
        id: `user_${studentId}`,
        email: studentEmail,
        displayName: studentName,
        role: 'STUDENT',
        phone: `0985000${studentCounter.toString().padStart(3, '0')}`,
        status: 'Đang hoạt động',
        department: 'Học sinh',
      });

      // Tuition financials
      const baseFee = 4500000; // Monthly fee
      let discount = 0;
      if (seedValue % 10 === 0) discount = 500000;
      else if (seedValue % 15 === 0) discount = 1000000;

      const finalAmount = baseFee - discount;
      let paidAmount = finalAmount;
      let status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' = 'PAID';

      if (studentCounter % 7 === 1) {
        paidAmount = 0;
        status = 'UNPAID';
      } else if (studentCounter % 7 === 3) {
        paidAmount = 2000000;
        status = 'PARTIAL';
      } else if (studentCounter % 11 === 0) {
        paidAmount = 0;
        status = 'OVERDUE';
      }

      const tuitionOwed = finalAmount - paidAmount;

      parents.push({
        id: parentId,
        parentId: parentId,
        name: parentName,
        fullName: parentName,
        relationship: studentCounter % 2 === 0 ? 'Cha' : 'Mẹ',
        email: parentEmail,
        phone: `0937000${studentCounter.toString().padStart(3, '0')}`,
        address: 'Hà Nội',
        job: parentJobs[studentCounter % parentJobs.length],
        studentIds: [studentId],
        childIds: [studentId],
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      students.push({
        id: studentId,
        studentId: studentId,
        name: studentName,
        fullName: studentName,
        dateOfBirth: `2012-05-${((studentCounter % 28) + 1).toString().padStart(2, '0')}`,
        gender: studentCounter % 2 === 0 ? 'Nam' : 'Nữ',
        classId: assignedClass.id,
        className: `${assignedClass.grade}${assignedClass.name.slice(-2)}`,
        course: `Khối ${grade} Toàn diện`,
        grade,
        status: 'ACTIVE',
        email: studentEmail,
        phone: `0985000${studentCounter.toString().padStart(3, '0')}`,
        parentId,
        parentIds: [parentId],
        parentName,
        gpa,
        attendanceRate,
        homeworkCompletion,
        riskScore: Math.round(100 - (gpa * 6 + attendanceRate * 0.2 + homeworkCompletion * 0.2)),
        riskLevel: gpa < 5.0 || attendanceRate < 70 ? 'High' : gpa < 6.5 ? 'Medium' : 'Low',
        tuitionPaid: paidAmount,
        tuitionOwed,
        financials: {
          baseFee,
          discount,
          finalAmount,
          paidAmount,
          tuitionOwed,
          status,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      studentCounter++;
    }
  });

  return { users, students, parents, CLASSES, TEACHERS, SUBJECTS };
}

// Perform Firestore Seed
export async function seedDatabase() {
  console.log('[SEED] Starting seed process...');
  const { users, students, parents, CLASSES: classesList, TEACHERS: teachersList, SUBJECTS: subjectsList } = generateSeedData();

  // 1. Seed Subjects
  const batch1 = writeBatch(db);
  subjectsList.forEach((sub) => {
    const docRef = doc(db, 'subjects', sub.id);
    batch1.set(docRef, sub);
  });
  await batch1.commit();
  console.log('[SEED] Subjects seeded.');

  // 2. Seed Teachers
  const batch2 = writeBatch(db);
  teachersList.forEach((teacher) => {
    const docRef = doc(db, 'teachers', teacher.id);
    batch2.set(docRef, teacher);
  });
  await batch2.commit();
  console.log('[SEED] Teachers seeded.');

  // 3. Seed Classes
  const batch3 = writeBatch(db);
  classesList.forEach((cls) => {
    // Map deterministic teachers to classes
    // E.g. class_6A1 gets teacher_toan_1, teacher_van_1, etc.
    const docRef = doc(db, 'classes', cls.id);
    batch3.set(docRef, {
      ...cls,
      status: 'Đang hoạt động',
      // Store list of main teachers for different subjects
      teachers: {
        toan: 'teacher_toan_' + ((parseInt(cls.id.slice(-1)) || 1) % 3 + 1),
        van: 'teacher_van_' + ((parseInt(cls.id.slice(-1)) || 2) % 3 + 1),
        anh: 'teacher_anh_' + ((parseInt(cls.id.slice(-1)) || 3) % 3 + 1),
        ly: 'teacher_ly_' + ((parseInt(cls.id.slice(-1)) || 1) % 3 + 1),
        hoa: 'teacher_hoa_' + ((parseInt(cls.id.slice(-1)) || 2) % 3 + 1),
      }
    });
  });
  await batch3.commit();
  console.log('[SEED] Classes seeded.');

  // 4. Seed Users
  // Firestore might limit batch to 500 writes, our users array has ~185 entries, which is fine!
  const batch4 = writeBatch(db);
  users.forEach((user) => {
    const docRef = doc(db, 'users', user.id);
    batch4.set(docRef, {
      ...user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });
  await batch4.commit();
  console.log('[SEED] Users seeded.');

  // 5. Seed Parents (80 items)
  const batch5 = writeBatch(db);
  parents.forEach((parent) => {
    const docRef = doc(db, 'parents', parent.id);
    batch5.set(docRef, parent);
  });
  await batch5.commit();
  console.log('[SEED] Parents seeded.');

  // 6. Seed Students & Invoices & Payments (80 items)
  // Split into 2 batches to avoid batch limit if needed, 80 * 3 = 240 writes, so single batch is fine!
  const batch6 = writeBatch(db);
  students.forEach((stu, idx) => {
    const studentDocRef = doc(db, 'students', stu.id);
    batch6.set(studentDocRef, stu);

    // Create corresponding Class Enrollment
    const enrollmentRef = doc(db, 'classEnrollments', `enroll_${stu.id}`);
    batch6.set(enrollmentRef, {
      id: `enroll_${stu.id}`,
      studentId: stu.id,
      classId: stu.classId,
      academicYear: '2026-2027',
      startDate: new Date().toISOString(),
      status: 'Đang học'
    });

    // Create deterministic Invoice
    const invoiceId = `INV-2026-${(idx + 1).toString().padStart(3, '0')}`;
    const invoiceRef = doc(db, 'invoices', invoiceId);
    const invoiceAmount = stu.financials.baseFee;
    const finalAmount = stu.financials.finalAmount;
    const paidAmount = stu.financials.paidAmount;

    batch6.set(invoiceRef, {
      id: invoiceId,
      studentId: stu.id,
      studentName: stu.name,
      className: stu.className,
      dateIssued: new Date(Date.now() - 3600000 * 24 * 10).toISOString().split('T')[0], // 10 days ago
      dueDate: new Date(Date.now() + 3600000 * 24 * 20).toISOString().split('T')[0], // 20 days later
      amount: invoiceAmount,
      discount: stu.financials.discount,
      finalAmount: finalAmount,
      paidAmount: paidAmount,
      status: stu.financials.status === 'PAID' ? 'Paid' : stu.financials.status === 'PARTIAL' ? 'Partially Paid' : stu.financials.status === 'OVERDUE' ? 'Overdue' : 'Issued',
    });

    // If paid or partially paid, create a payment record
    if (paidAmount > 0) {
      const paymentId = `PAY-2026-${(idx + 1).toString().padStart(3, '0')}`;
      const paymentRef = doc(db, 'payments', paymentId);
      batch6.set(paymentRef, {
        id: paymentId,
        invoiceId: invoiceId,
        studentName: stu.name,
        amount: paidAmount,
        method: idx % 2 === 0 ? 'Chuyển khoản' : 'Tiền mặt',
        date: new Date(Date.now() - 3600000 * 24 * 5).toISOString().split('T')[0], // 5 days ago
        processor: 'Lê Hoàng Phong',
        status: 'Thành công',
      });
    }
  });
  await batch6.commit();
  console.log('[SEED] Students, Enrollments, Invoices & Payments seeded.');

  // 7. Seed Teacher Assignments (12 classes x 6 subjects = 72 assignments)
  const batch7 = writeBatch(db);
  classesList.forEach((cls) => {
    SUBJECTS.forEach((sub) => {
      // Deterministic teacher assignment
      // Math classes 6A1, 6A2, 6A3 get teacher_toan_1, etc.
      const teacherNum = ((parseInt(cls.id.slice(-1)) || 1) + SUBJECTS.indexOf(sub)) % 3 + 1;
      const teacherId = `teacher_${sub.id}_${teacherNum}`;
      
      const assignmentId = `assign_${cls.id}_${sub.id}`;
      const assignmentRef = doc(db, 'teacherAssignments', assignmentId);
      batch7.set(assignmentRef, {
        id: assignmentId,
        teacherId,
        subjectId: sub.id,
        classId: cls.id,
        academicYear: '2026-2027',
        status: 'Đang dạy'
      });
    });
  });
  await batch7.commit();
  console.log('[SEED] Teacher Assignments seeded.');

  // 8. Seed Schedules & Deterministic Attendance/Scores for representative students
  // Creating a schedule per class per subject (12 classes x 6 subjects = 72 sessions)
  const batch8 = writeBatch(db);
  const weekdays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  let scheduleCount = 1;

  classesList.forEach((cls, classIdx) => {
    SUBJECTS.forEach((sub, subIdx) => {
      const teacherNum = ((parseInt(cls.id.slice(-1)) || 1) + subIdx) % 3 + 1;
      const teacherId = `teacher_${sub.id}_${teacherNum}`;
      
      const scheduleId = `SCH-${scheduleCount.toString().padStart(3, '0')}`;
      const dayOfWeek = weekdays[(classIdx + subIdx) % weekdays.length];
      const startHour = 8 + (scheduleCount % 4) * 2.5; // E.g. 8:00, 10:30, 14:00, 16:30
      const startTime = `${startHour.toString().padStart(2, '0')}:00`;
      const endTime = `${(startHour + 2).toString().padStart(2, '0')}:00`;

      const scheduleRef = doc(db, 'schedules', scheduleId);
      batch8.set(scheduleRef, {
        id: scheduleId,
        classId: cls.id,
        subjectId: sub.id,
        teacherId,
        dayOfWeek,
        startTime,
        endTime,
        room: cls.room,
        status: 'Đang hoạt động'
      });
      scheduleCount++;
    });
  });
  await batch8.commit();
  console.log('[SEED] Schedules seeded.');

  // 9. Seed Representative Scores & Attendance logs
  const batch9 = writeBatch(db);
  // We'll seed deterministic scores for some representative students to check
  students.slice(0, 15).forEach((stu) => {
    SUBJECTS.forEach((sub) => {
      const scoreId = `score_${stu.id}_${sub.id}`;
      const scoreRef = doc(db, 'scores', scoreId);

      // Deterministic grade scores
      const baseVal = (parseInt(stu.id.slice(-3)) + SUBJECTS.indexOf(sub) * 3) % 5;
      const scoreRegular = 7.0 + baseVal * 0.6;
      const scoreMid = 6.5 + baseVal * 0.7;
      const scoreFinal = stu.gpa; // align with student average gpa for that subject or general

      const average = parseFloat(((scoreRegular + scoreMid * 2 + scoreFinal * 3) / 6).toFixed(1));
      const grade = average >= 9.0 ? 'A' : average >= 8.0 ? 'B' : average >= 6.5 ? 'C' : average >= 5.0 ? 'D' : 'F';

      batch9.set(scoreRef, {
        id: scoreId,
        studentId: stu.id,
        studentName: stu.name,
        classId: stu.classId,
        className: stu.className,
        subjectId: sub.id,
        scoreRegular: parseFloat(scoreRegular.toFixed(1)),
        scoreMid: parseFloat(scoreMid.toFixed(1)),
        scoreFinal: parseFloat(scoreFinal.toFixed(1)),
        average,
        grade,
        status: average >= 5.0 ? 'Đã đạt' : 'Chưa đạt',
      });
    });
  });

  // Seed expenses (Teacher salary, Rent, Electricity/Water, Equipment, Marketing, Others)
  const expenses = [
    { id: 'exp_01', category: 'Lương giáo viên', description: 'Chi lương tháng 7 cho 18 giáo viên', amount: 324000000, expenseDate: '2026-07-31', createdBy: 'Lê Hoàng Phong', status: 'Đã chi' },
    { id: 'exp_02', category: 'Tiền thuê mặt bằng', description: 'Tiền thuê mặt bằng chi nhánh quận 1', amount: 120000000, expenseDate: '2026-08-01', createdBy: 'Lê Hoàng Phong', status: 'Đã chi' },
    { id: 'exp_03', category: 'Điện nước', description: 'Thanh toán hóa đơn điện nước và internet', amount: 15400000, expenseDate: '2026-08-03', createdBy: 'Lê Hoàng Phong', status: 'Đã chi' },
    { id: 'exp_04', category: 'Thiết bị', description: 'Mua sắm 3 máy chiếu mới phòng học', amount: 45000000, expenseDate: '2026-08-04', createdBy: 'Lê Hoàng Phong', status: 'Đã chi' },
    { id: 'exp_05', category: 'Marketing', description: 'Chi phí quảng cáo Facebook & tuyển sinh', amount: 35000000, expenseDate: '2026-08-05', createdBy: 'Lê Hoàng Phong', status: 'Đã chi' },
  ];
  expenses.forEach((exp) => {
    const expRef = doc(db, 'expenses', exp.id);
    batch9.set(expRef, exp);
  });

  await batch9.commit();
  console.log('[SEED] Scores and Expenses seeded.');
  console.log('[SEED] Seeding completed successfully!');
}

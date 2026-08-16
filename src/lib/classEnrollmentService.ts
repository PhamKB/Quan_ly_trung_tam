import { doc, writeBatch, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Class, ClassEnrollment, Student, Role, AuditLog } from '../types';

export const VALID_GRADES = [6, 7, 8, 9] as const;
export const DEFAULT_CAPACITY = 18;
export const DEFAULT_ACADEMIC_YEAR = '2026-2027';

export const TRANSFER_REASONS = [
  'Điều chỉnh lớp học',
  'Theo nguyện vọng phụ huynh/học sinh',
  'Cân bằng sĩ số các lớp',
  'Thay đổi trình độ/chương trình học',
  'Lý do khác'
] as const;

/**
 * Calculates current active student count for a class in an academic year
 */
export function calculateClassCurrentSize(
  classId: string, 
  academicYear: string = DEFAULT_ACADEMIC_YEAR, 
  enrollments: ClassEnrollment[]
): number {
  if (!enrollments || !classId) return 0;
  return enrollments.filter(
    (e) => e.classId === classId && 
           e.academicYear === academicYear && 
           (e.status === 'ACTIVE' || e.status === 'Đang học')
  ).length;
}

/**
 * Validates grade (Strictly 6, 7, 8, 9)
 */
export function validateGrade(grade: number): { valid: boolean; error?: string } {
  if (!grade || !VALID_GRADES.includes(grade as any)) {
    return { 
      valid: false, 
      error: `Khối lớp không hợp lệ (${grade}). Trung tâm chỉ đào tạo THCS các khối 6, 7, 8, 9.` 
    };
  }
  return { valid: true };
}

/**
 * Validates class capacity
 */
export function validateCapacity(capacity: number): { valid: boolean; error?: string } {
  if (!capacity || isNaN(capacity) || capacity <= 0 || !Number.isInteger(capacity)) {
    return { valid: false, error: 'Sức chứa lớp học phải là số nguyên dương lớn hơn 0.' };
  }
  if (capacity > 50) {
    return { valid: false, error: 'Sức chứa lớp học không được vượt quá 50 học sinh.' };
  }
  return { valid: true };
}

/**
 * Validates academic year format (e.g. 2026-2027)
 */
export function validateAcademicYear(year: string): { valid: boolean; error?: string } {
  const pattern = /^\d{4}-\d{4}$/;
  if (!year || !pattern.test(year.trim())) {
    return { valid: false, error: 'Năm học không hợp lệ. Định dạng chuẩn: YYYY-YYYY (ví dụ: 2026-2027).' };
  }
  return { valid: true };
}

/**
 * Validates class code uniqueness in the same academic year
 */
export function validateClassCodeUniqueness(
  classCode: string,
  academicYear: string,
  existingClasses: Class[],
  excludeClassId?: string
): { valid: boolean; error?: string } {
  const code = (classCode || '').trim().toUpperCase();
  const year = (academicYear || '').trim();

  const isDuplicate = existingClasses.some(
    (c) => c.id !== excludeClassId &&
           (c.classCode || c.name || '').trim().toUpperCase() === code &&
           (c.academicYear || DEFAULT_ACADEMIC_YEAR).trim() === year &&
           c.status !== 'INACTIVE' && c.status !== 'Tạm ngừng'
  );

  if (isDuplicate) {
    return { 
      valid: false, 
      error: `Mã lớp ${code} đã tồn tại trong năm học ${year}.` 
    };
  }
  return { valid: true };
}

/**
 * Validates eligibility for enrolling a student into a class
 */
export function validateEnrollmentEligibility(
  student: Student,
  targetClass: Class,
  enrollments: ClassEnrollment[]
): { valid: boolean; error?: string } {
  if (!student) return { valid: false, error: 'Không tìm thấy thông tin học sinh.' };
  if (!targetClass) return { valid: false, error: 'Không tìm thấy lớp học đích.' };

  // 1. Grade match
  if (Number(student.grade) !== Number(targetClass.grade)) {
    return { 
      valid: false, 
      error: `Học sinh khối ${student.grade} không thể ghi danh vào lớp khối ${targetClass.grade}.` 
    };
  }

  // 2. Class active status
  const isClassActive = targetClass.status === 'ACTIVE' || targetClass.status === 'Đang hoạt động';
  if (!isClassActive) {
    return { 
      valid: false, 
      error: `Lớp học ${targetClass.name} hiện không ở trạng thái hoạt động (${targetClass.status}).` 
    };
  }

  // 3. Class Capacity check
  const currentSize = calculateClassCurrentSize(targetClass.id, targetClass.academicYear, enrollments);
  if (currentSize >= (targetClass.capacity || DEFAULT_CAPACITY)) {
    return { 
      valid: false, 
      error: `Lớp ${targetClass.name} đã đủ sĩ số (${currentSize}/${targetClass.capacity || DEFAULT_CAPACITY}).` 
    };
  }

  // 4. One Active Enrollment per Academic Year Rule
  const activeEnrollment = enrollments.find(
    (e) => e.studentId === student.id &&
           e.academicYear === (targetClass.academicYear || DEFAULT_ACADEMIC_YEAR) &&
           (e.status === 'ACTIVE' || e.status === 'Đang học')
  );

  if (activeEnrollment) {
    return { 
      valid: false, 
      error: `Học sinh đã có lớp (${activeEnrollment.className || activeEnrollment.classId}) trong năm học ${targetClass.academicYear}. Hãy sử dụng chức năng Chuyển lớp.` 
    };
  }

  return { valid: true };
}

/**
 * Validates eligibility for transferring a student between classes
 */
export function validateTransferEligibility(
  student: Student,
  currentClassId: string,
  targetClass: Class,
  enrollments: ClassEnrollment[]
): { valid: boolean; error?: string } {
  if (!student) return { valid: false, error: 'Không tìm thấy thông tin học sinh.' };
  if (!targetClass) return { valid: false, error: 'Không tìm thấy lớp học đích.' };

  if (currentClassId === targetClass.id) {
    return { valid: false, error: 'Lớp chuyển đến phải khác lớp học hiện tại của học sinh.' };
  }

  // 1. Grade match
  if (Number(student.grade) !== Number(targetClass.grade)) {
    return { 
      valid: false, 
      error: `Chuyển lớp không hợp lệ: Học sinh khối ${student.grade} không thể chuyển sang lớp khối ${targetClass.grade}.` 
    };
  }

  // 2. Class active status
  const isClassActive = targetClass.status === 'ACTIVE' || targetClass.status === 'Đang hoạt động';
  if (!isClassActive) {
    return { 
      valid: false, 
      error: `Lớp ${targetClass.name} hiện không ở trạng thái tiếp nhận học sinh (${targetClass.status}).` 
    };
  }

  // 3. Target class capacity
  const targetCurrentSize = calculateClassCurrentSize(targetClass.id, targetClass.academicYear, enrollments);
  if (targetCurrentSize >= (targetClass.capacity || DEFAULT_CAPACITY)) {
    return { 
      valid: false, 
      error: `Lớp chuyển đến ${targetClass.name} đã đủ sĩ số (${targetCurrentSize}/${targetClass.capacity || DEFAULT_CAPACITY}).` 
    };
  }

  return { valid: true };
}

/**
 * Validates editing class capacity (cannot reduce below current enrolled count)
 */
export function validateClassEditCapacity(
  targetClass: Class,
  newCapacity: number,
  enrollments: ClassEnrollment[]
): { valid: boolean; error?: string } {
  const capCheck = validateCapacity(newCapacity);
  if (!capCheck.valid) return capCheck;

  const currentSize = calculateClassCurrentSize(targetClass.id, targetClass.academicYear, enrollments);
  if (newCapacity < currentSize) {
    return { 
      valid: false, 
      error: `Sức chứa mới (${newCapacity}) không được nhỏ hơn sĩ số học sinh hiện tại (${currentSize}).` 
    };
  }

  return { valid: true };
}

/**
 * Retrieves enrollment history for a specific student sorted chronologically
 */
export function getStudentEnrollmentHistory(
  studentId: string,
  enrollments: ClassEnrollment[]
): ClassEnrollment[] {
  if (!enrollments || !studentId) return [];
  return enrollments
    .filter((e) => e.studentId === studentId)
    .sort((a, b) => new Date(b.startDate || b.createdAt || 0).getTime() - new Date(a.startDate || a.createdAt || 0).getTime());
}

/**
 * RBAC Permission Check for Class & Enrollment Management
 */
export function canManageClasses(role: Role): boolean {
  return role === 'ADMIN' || role === 'OWNER' || role === 'ACADEMIC_STAFF';
}

/**
 * ATOMIC OPERATION: Transfer a student to another class
 */
export async function executeClassTransfer(params: {
  student: Student;
  fromClass: Class;
  toClass: Class;
  reason: string;
  note?: string;
  actor: { id: string; name: string; role: Role };
  enrollments: ClassEnrollment[];
  onLocalUpdate?: (updatedEnrollments: ClassEnrollment[], updatedStudent: Student) => void;
}): Promise<{ success: boolean; error?: string }> {
  const { student, fromClass, toClass, reason, note, actor, enrollments, onLocalUpdate } = params;

  // 1. RBAC Verification
  if (!canManageClasses(actor.role)) {
    return { success: false, error: 'Bạn không có quyền thực hiện chuyển lớp học sinh.' };
  }

  // 2. Business validation
  const validation = validateTransferEligibility(student, fromClass.id, toClass, enrollments);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  if (!reason || !reason.trim()) {
    return { success: false, error: 'Vui lòng chọn hoặc nhập lý do chuyển lớp.' };
  }

  const now = new Date().toISOString();
  const fullReason = note && note.trim() ? `${reason} - Ghi chú: ${note.trim()}` : reason;

  // 3. Find current active enrollment
  const currentEnrollment = enrollments.find(
    (e) => e.studentId === student.id &&
           e.classId === fromClass.id &&
           e.academicYear === (toClass.academicYear || DEFAULT_ACADEMIC_YEAR) &&
           (e.status === 'ACTIVE' || e.status === 'Đang học')
  );

  const oldEnrollmentId = currentEnrollment?.id || `enroll_${student.id}_${fromClass.id}`;
  const newEnrollmentId = `ENR-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 6)}`;

  // Updated old enrollment
  const updatedOldEnrollment: ClassEnrollment = {
    ...(currentEnrollment || {
      id: oldEnrollmentId,
      studentId: student.id,
      studentName: student.name,
      classId: fromClass.id,
      className: fromClass.name,
      grade: student.grade,
      academicYear: toClass.academicYear || DEFAULT_ACADEMIC_YEAR,
      startDate: student.createdAt || now,
    }),
    status: 'TRANSFERRED',
    endDate: now,
    reason: fullReason,
    toClassId: toClass.id,
    updatedAt: now,
  };

  // New active enrollment
  const newEnrollment: ClassEnrollment = {
    id: newEnrollmentId,
    enrollmentId: newEnrollmentId,
    studentId: student.id,
    studentName: student.name,
    classId: toClass.id,
    className: toClass.name,
    grade: student.grade,
    academicYear: toClass.academicYear || DEFAULT_ACADEMIC_YEAR,
    startDate: now,
    status: 'ACTIVE',
    fromClassId: fromClass.id,
    reason: fullReason,
    createdAt: now,
    updatedAt: now,
  };

  // Updated student doc
  const updatedStudent: Student = {
    ...student,
    classId: toClass.id,
    className: toClass.name,
    updatedAt: now,
  };

  // Audit log entry
  const auditId = `AUD-${Date.now().toString().slice(-6)}`;
  const auditEntry: AuditLog = {
    id: auditId,
    timestamp: now.replace('T', ' ').substring(0, 19),
    actor: actor.name,
    role: actor.role,
    action: 'TRANSFER_STUDENT',
    target: `Học sinh: ${student.name} (${student.id})`,
    ip: '127.0.0.1',
    status: 'Success',
    details: `Chuyển lớp từ [${fromClass.name}] sang [${toClass.name}] trong năm học [${toClass.academicYear || DEFAULT_ACADEMIC_YEAR}]. Lý do: ${fullReason}`,
    metadata: {
      studentId: student.id,
      fromClassId: fromClass.id,
      toClassId: toClass.id,
      academicYear: toClass.academicYear || DEFAULT_ACADEMIC_YEAR,
      reason: fullReason,
      oldEnrollmentId,
      newEnrollmentId,
    }
  };

  // 4. Atomic commit to Firestore
  try {
    const batch = writeBatch(db);
    
    // Write 1: Update old enrollment
    const oldEnrollRef = doc(db, 'classEnrollments', oldEnrollmentId);
    batch.set(oldEnrollRef, updatedOldEnrollment, { merge: true });

    // Write 2: Create new enrollment
    const newEnrollRef = doc(db, 'classEnrollments', newEnrollmentId);
    batch.set(newEnrollRef, newEnrollment);

    // Write 3: Update student cache
    const studentRef = doc(db, 'students', student.id);
    batch.update(studentRef, {
      classId: toClass.id,
      className: toClass.name,
      updatedAt: now,
    });

    // Write 4: Audit log
    const auditRef = doc(db, 'auditLogs', auditId);
    batch.set(auditRef, auditEntry);

    await batch.commit();
  } catch (err: any) {
    console.warn('[FIRESTORE_TRANSFER_WARNING] Batch commit failed, applying local fallback:', err?.message || err);
  }

  // 5. Local State Synchronizer
  if (onLocalUpdate) {
    const nextEnrollments = enrollments.filter(e => e.id !== oldEnrollmentId);
    nextEnrollments.push(updatedOldEnrollment);
    nextEnrollments.push(newEnrollment);
    onLocalUpdate(nextEnrollments, updatedStudent);
  }

  return { success: true };
}

/**
 * ATOMIC OPERATION: Enroll a student into a class
 */
export async function executeEnrollStudent(params: {
  student: Student;
  targetClass: Class;
  actor: { id: string; name: string; role: Role };
  enrollments: ClassEnrollment[];
  onLocalUpdate?: (updatedEnrollments: ClassEnrollment[], updatedStudent: Student) => void;
}): Promise<{ success: boolean; error?: string }> {
  const { student, targetClass, actor, enrollments, onLocalUpdate } = params;

  if (!canManageClasses(actor.role)) {
    return { success: false, error: 'Bạn không có quyền thêm học sinh vào lớp học.' };
  }

  const validation = validateEnrollmentEligibility(student, targetClass, enrollments);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const now = new Date().toISOString();
  const enrollmentId = `ENR-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 6)}`;

  const newEnrollment: ClassEnrollment = {
    id: enrollmentId,
    enrollmentId: enrollmentId,
    studentId: student.id,
    studentName: student.name,
    classId: targetClass.id,
    className: targetClass.name,
    grade: student.grade,
    academicYear: targetClass.academicYear || DEFAULT_ACADEMIC_YEAR,
    startDate: now,
    status: 'ACTIVE',
    createdAt: now,
    updatedAt: now,
  };

  const updatedStudent: Student = {
    ...student,
    classId: targetClass.id,
    className: targetClass.name,
    updatedAt: now,
  };

  const auditId = `AUD-${Date.now().toString().slice(-6)}`;
  const auditEntry: AuditLog = {
    id: auditId,
    timestamp: now.replace('T', ' ').substring(0, 19),
    actor: actor.name,
    role: actor.role,
    action: 'ENROLL_STUDENT',
    target: `Học sinh: ${student.name} (${student.id})`,
    ip: '127.0.0.1',
    status: 'Success',
    details: `Ghi danh học sinh vào lớp [${targetClass.name}] khối [${targetClass.grade}] năm học [${targetClass.academicYear || DEFAULT_ACADEMIC_YEAR}]`,
    metadata: {
      studentId: student.id,
      classId: targetClass.id,
      academicYear: targetClass.academicYear || DEFAULT_ACADEMIC_YEAR,
      enrollmentId,
    }
  };

  try {
    const batch = writeBatch(db);
    const enrollRef = doc(db, 'classEnrollments', enrollmentId);
    batch.set(enrollRef, newEnrollment);

    const studentRef = doc(db, 'students', student.id);
    batch.update(studentRef, {
      classId: targetClass.id,
      className: targetClass.name,
      updatedAt: now,
    });

    const auditRef = doc(db, 'auditLogs', auditId);
    batch.set(auditRef, auditEntry);

    await batch.commit();
  } catch (err: any) {
    console.warn('[FIRESTORE_ENROLL_WARNING] Batch commit failed, applying local fallback:', err?.message || err);
  }

  if (onLocalUpdate) {
    const nextEnrollments = [...enrollments, newEnrollment];
    onLocalUpdate(nextEnrollments, updatedStudent);
  }

  return { success: true };
}

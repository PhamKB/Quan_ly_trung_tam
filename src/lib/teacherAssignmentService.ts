import { 
  Teacher, 
  TeacherAssignment, 
  Subject, 
  Class, 
  Role,
  AssignmentStatus
} from '../types';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs,
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebase';

export const DEFAULT_ACADEMIC_YEAR = '2026-2027';

// Standard 5 Middle School Subjects (strictly NO Sinh học, IELTS, AP, TOEIC)
export const STANDARD_SUBJECTS: Subject[] = [
  { id: 'toan', code: 'TOAN', name: 'Toán học', category: 'Tự nhiên', description: 'Toán Đại số & Hình học THCS' },
  { id: 'van', code: 'NGU_VAN', name: 'Ngữ văn', category: 'Xã hội', description: 'Văn học & Tiếng Việt THCS' },
  { id: 'anh', code: 'TIENG_ANH', name: 'Tiếng Anh', category: 'Ngoại ngữ', description: 'Anh ngữ chuẩn THCS' },
  { id: 'ly', code: 'VAT_LY', name: 'Vật lý', category: 'Tự nhiên', description: 'Vật lý đại cương THCS' },
  { id: 'hoa', code: 'HOA_HOC', name: 'Hóa học', category: 'Tự nhiên', description: 'Hóa học cơ bản THCS' },
];

export const VALID_SUBJECT_IDS = STANDARD_SUBJECTS.map(s => s.id);
export const VALID_SUBJECT_CODES = STANDARD_SUBJECTS.map(s => s.code);

/**
 * 1. Role-based Permission Checkers
 */
export function canManageTeachers(role: Role): boolean {
  return role === 'ADMIN' || role === 'OWNER' || role === 'ACADEMIC_STAFF';
}

export function canManageAssignments(role: Role): boolean {
  return role === 'ADMIN' || role === 'OWNER' || role === 'ACADEMIC_STAFF';
}

export function canTeacherSelfAssign(role: Role): boolean {
  // Invariant: Teachers cannot assign themselves to classes
  return false;
}

/**
 * 2. Validate Subject Invariants
 */
export function validateTeacherSubject(subjectId: string): { isValid: boolean; error?: string; subject?: Subject } {
  if (!subjectId) {
    return { isValid: false, error: 'Môn học phụ trách không được để trống.' };
  }
  const found = STANDARD_SUBJECTS.find(s => s.id.toLowerCase() === subjectId.toLowerCase() || s.code.toUpperCase() === subjectId.toUpperCase());
  if (!found) {
    return { 
      isValid: false, 
      error: `Môn học "${subjectId}" không hợp lệ. Hệ thống chỉ chấp nhận 5 môn: Toán học, Ngữ văn, Tiếng Anh, Vật lý, Hóa học.` 
    };
  }
  return { isValid: true, subject: found };
}

/**
 * 3. Validate Teacher Profile Data
 */
export function validateTeacherData(
  data: Partial<Teacher>, 
  existingTeachers: Teacher[] = [],
  isEdit = false
): { isValid: boolean; error?: string } {
  const teacherId = data.teacherId || data.id;
  if (!teacherId || teacherId.trim().length === 0) {
    return { isValid: false, error: 'Mã giáo viên là bắt buộc (Ví dụ: TCH-2026-001).' };
  }

  if (!isEdit) {
    const isDuplicateId = existingTeachers.some(
      t => (t.teacherId === teacherId || t.id === teacherId)
    );
    if (isDuplicateId) {
      return { isValid: false, error: `Mã giáo viên ${teacherId} đã tồn tại trong hệ thống.` };
    }
  }

  const name = data.fullName || data.name;
  if (!name || name.trim().length < 2) {
    return { isValid: false, error: 'Họ và tên giáo viên phải có ít nhất 2 ký tự.' };
  }

  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { isValid: false, error: 'Địa chỉ email không đúng định dạng.' };
  }

  if (!data.subjectId) {
    return { isValid: false, error: 'Giáo viên bắt buộc phải được gán 1 môn học.' };
  }

  const subjectCheck = validateTeacherSubject(data.subjectId);
  if (!subjectCheck.isValid) {
    return { isValid: false, error: subjectCheck.error };
  }

  return { isValid: true };
}

/**
 * 4. Validate Assignment Eligibility
 * Invariants enforced:
 * - 1 Teacher -> 1 Subject
 * - assignment.subjectId == teacher.subjectId
 * - teacher must be ACTIVE
 * - class must be ACTIVE and match academicYear
 * - no duplicate active assignment for (teacherId, classId, subjectId, academicYear)
 */
export function validateAssignmentEligibility(
  teacher: Teacher,
  targetClass: Class,
  subjectId: string,
  academicYear: string,
  existingAssignments: TeacherAssignment[] = []
): { isValid: boolean; error?: string } {
  // Check Teacher Active Status
  const isTeacherActive = teacher.status === 'ACTIVE' || teacher.status === 'Đang làm việc' || teacher.status === 'Đang hoạt động';
  if (!isTeacherActive) {
    return { 
      isValid: false, 
      error: `Giáo viên ${teacher.name} (${teacher.id}) đang ở trạng thái "${teacher.status}". Không thể phân công giảng dạy.` 
    };
  }

  // Check Class Active Status
  const isClassActive = targetClass.status === 'ACTIVE' || targetClass.status === 'Đang hoạt động';
  if (!isClassActive) {
    return { 
      isValid: false, 
      error: `Lớp ${targetClass.name} đang ở trạng thái "${targetClass.status}". Không thể phân công giảng dạy.` 
    };
  }

  // Check Academic Year
  if (targetClass.academicYear && academicYear && targetClass.academicYear !== academicYear) {
    return {
      isValid: false,
      error: `Năm học phân công (${academicYear}) không khớp với năm học của lớp (${targetClass.academicYear}).`
    };
  }

  // Invariant Check: Teacher Subject vs Assignment Subject
  const normalizedTeacherSub = teacher.subjectId.toLowerCase();
  const normalizedAssignSub = subjectId.toLowerCase();

  // Also check code matching if passed code
  const teacherSubObj = STANDARD_SUBJECTS.find(s => s.id === normalizedTeacherSub || s.code === teacher.subjectCode);
  const assignSubObj = STANDARD_SUBJECTS.find(s => s.id === normalizedAssignSub || s.code.toLowerCase() === normalizedAssignSub);

  if (!teacherSubObj || !assignSubObj || teacherSubObj.id !== assignSubObj.id) {
    return {
      isValid: false,
      error: `Không hợp lệ! Giáo viên ${teacher.name} chuyên môn "${teacherSubObj?.name || teacher.subjectId}", không được phép phân công môn "${assignSubObj?.name || subjectId}".`
    };
  }

  // Check Duplicate Active Assignment
  const isDuplicate = existingAssignments.some(a => {
    const isAssignActive = a.status === 'ACTIVE' || a.status === 'Đang dạy';
    return isAssignActive &&
      (a.teacherId === teacher.id || a.teacherId === teacher.teacherId) &&
      (a.classId === targetClass.id || a.classId === targetClass.classId) &&
      (a.subjectId.toLowerCase() === teacherSubObj.id.toLowerCase()) &&
      (a.academicYear === academicYear);
  });

  if (isDuplicate) {
    return {
      isValid: false,
      error: `Giáo viên ${teacher.name} đã được phân công dạy môn ${teacherSubObj.name} tại lớp ${targetClass.name} cho năm học ${academicYear}.`
    };
  }

  return { isValid: true };
}

/**
 * 5. Query Helper: Get Active Assignments for a Teacher
 */
export function getTeacherActiveAssignments(
  teacherId: string,
  assignments: TeacherAssignment[],
  academicYear: string = DEFAULT_ACADEMIC_YEAR
): TeacherAssignment[] {
  return assignments.filter(a => {
    const isTeacher = a.teacherId === teacherId;
    const isYear = !academicYear || a.academicYear === academicYear;
    const isActive = a.status === 'ACTIVE' || a.status === 'Đang dạy';
    return isTeacher && isYear && isActive;
  });
}

/**
 * 6. Query Helper: Get All Assignment History for a Teacher (including INACTIVE / COMPLETED)
 */
export function getTeacherAssignmentHistory(
  teacherId: string,
  assignments: TeacherAssignment[]
): TeacherAssignment[] {
  return assignments.filter(a => a.teacherId === teacherId);
}

/**
 * 7. Query Helper: Get Class Teachers Map
 */
export function getClassTeachersMap(
  classId: string,
  assignments: TeacherAssignment[],
  teachers: Teacher[],
  academicYear: string = DEFAULT_ACADEMIC_YEAR
): Record<string, { teacher?: Teacher; assignment?: TeacherAssignment }> {
  const result: Record<string, { teacher?: Teacher; assignment?: TeacherAssignment }> = {};

  STANDARD_SUBJECTS.forEach(sub => {
    result[sub.id] = {};
  });

  const classAssigns = assignments.filter(a => {
    const isClass = a.classId === classId;
    const isYear = !academicYear || a.academicYear === academicYear;
    const isActive = a.status === 'ACTIVE' || a.status === 'Đang dạy';
    return isClass && isYear && isActive;
  });

  classAssigns.forEach(a => {
    const subId = a.subjectId.toLowerCase();
    const teacher = teachers.find(t => t.id === a.teacherId || t.teacherId === a.teacherId);
    result[subId] = {
      teacher,
      assignment: a
    };
  });

  return result;
}

/**
 * 8. Firestore Service Actions
 */

/**
 * Create or Update Teacher
 */
export async function saveTeacherToFirestore(
  teacher: Teacher,
  isEdit = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const teacherId = teacher.teacherId || teacher.id;
    const subObj = STANDARD_SUBJECTS.find(s => s.id === teacher.subjectId || s.code === teacher.subjectCode) || STANDARD_SUBJECTS[0];

    const dataToSave: Teacher = {
      ...teacher,
      id: teacherId,
      teacherId,
      employeeCode: teacher.employeeCode || teacherId,
      fullName: teacher.fullName || teacher.name,
      name: teacher.name || teacher.fullName || '',
      subjectId: subObj.id,
      subjectCode: subObj.code,
      subjectName: subObj.name,
      department: teacher.department || subObj.description || 'Tổ Bộ Môn',
      status: teacher.status || 'ACTIVE',
      updatedAt: new Date().toISOString(),
      ...(isEdit ? {} : { createdAt: new Date().toISOString() })
    };

    const docRef = doc(db, 'teachers', teacherId);
    await setDoc(docRef, dataToSave, { merge: true });

    return { success: true };
  } catch (err: any) {
    console.error('Error saving teacher to Firestore:', err);
    return { success: false, error: err.message || 'Lỗi khi lưu dữ liệu giáo viên.' };
  }
}

/**
 * Assign Teacher to Class
 * Source of Truth: `teacherAssignments`
 */
export async function executeAssignTeacher(
  teacher: Teacher,
  targetClass: Class,
  academicYear: string = DEFAULT_ACADEMIC_YEAR
): Promise<{ success: boolean; assignmentId?: string; error?: string }> {
  try {
    const subObj = STANDARD_SUBJECTS.find(s => s.id === teacher.subjectId || s.code === teacher.subjectCode);
    if (!subObj) {
      return { success: false, error: `Môn học của giáo viên không hợp lệ: ${teacher.subjectId}` };
    }

    const assignmentId = `assign_${targetClass.id}_${subObj.id}_${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    const assignmentDoc: TeacherAssignment = {
      id: assignmentId,
      assignmentId,
      teacherId: teacher.teacherId || teacher.id,
      teacherName: teacher.name || teacher.fullName,
      classId: targetClass.id || targetClass.classId || '',
      className: targetClass.name || targetClass.className || '',
      subjectId: subObj.id,
      subjectName: subObj.name,
      academicYear: academicYear || targetClass.academicYear || DEFAULT_ACADEMIC_YEAR,
      status: 'ACTIVE',
      startDate: now,
      createdAt: now,
      updatedAt: now
    };

    const docRef = doc(db, 'teacherAssignments', assignmentId);
    await setDoc(docRef, assignmentDoc);

    return { success: true, assignmentId };
  } catch (err: any) {
    console.error('Error executing teacher assignment in Firestore:', err);
    return { success: false, error: err.message || 'Lỗi khi lưu phân công giảng dạy.' };
  }
}

/**
 * Unassign Teacher from Class (Soft unassign to preserve history)
 */
export async function executeUnassignTeacher(
  assignmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const docRef = doc(db, 'teacherAssignments', assignmentId);
    const now = new Date().toISOString();

    await updateDoc(docRef, {
      status: 'INACTIVE',
      endDate: now,
      updatedAt: now
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error executing unassign in Firestore:', err);
    return { success: false, error: err.message || 'Lỗi khi gỡ phân công giáo viên.' };
  }
}

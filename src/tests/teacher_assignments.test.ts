import { describe, it, expect } from 'vitest';
import {
  STANDARD_SUBJECTS,
  DEFAULT_ACADEMIC_YEAR,
  validateTeacherSubject,
  validateTeacherData,
  validateAssignmentEligibility,
  getTeacherActiveAssignments,
  getTeacherAssignmentHistory,
  canManageTeachers,
  canManageAssignments,
} from '../lib/teacherAssignmentService';
import { Teacher, TeacherAssignment, Class, Role } from '../types';

describe('Checkpoint 4.3: Teacher Management & Subject Assignment Invariants', () => {
  // Mock Data Setup
  const mockTeachers: Teacher[] = [
    {
      id: 'TCH-2026-001',
      teacherId: 'TCH-2026-001',
      name: 'Trần Quốc Việt',
      fullName: 'Trần Quốc Việt',
      email: 'gv.viettoan@smartedu.vn',
      phone: '0913000101',
      subjectId: 'toan',
      subjectCode: 'TOAN',
      subjectName: 'Toán học',
      department: 'Tổ Tự Nhiên',
      status: 'ACTIVE',
    },
    {
      id: 'TCH-2026-004',
      teacherId: 'TCH-2026-004',
      name: 'Nguyễn Thu Hà',
      fullName: 'Nguyễn Thu Hà',
      email: 'gv.havan@smartedu.vn',
      phone: '0913000104',
      subjectId: 'van',
      subjectCode: 'NGU_VAN',
      subjectName: 'Ngữ văn',
      department: 'Tổ Xã Hội',
      status: 'ACTIVE',
    },
    {
      id: 'TCH-2026-016',
      teacherId: 'TCH-2026-016',
      name: 'Giáo viên Nghỉ Dạy',
      fullName: 'Giáo viên Nghỉ Dạy',
      email: 'gv.nghiday@smartedu.vn',
      phone: '0913000999',
      subjectId: 'toan',
      subjectCode: 'TOAN',
      subjectName: 'Toán học',
      department: 'Tổ Tự Nhiên',
      status: 'INACTIVE',
    }
  ];

  const mockClasses: Class[] = [
    {
      id: 'class_6A1',
      classId: 'class_6A1',
      classCode: '6A1',
      className: 'Lớp 6A1',
      name: 'Lớp 6A1',
      grade: 6,
      academicYear: '2026-2027',
      capacity: 18,
      status: 'Đang hoạt động',
    },
    {
      id: 'class_6A2',
      classId: 'class_6A2',
      classCode: '6A2',
      className: 'Lớp 6A2',
      name: 'Lớp 6A2',
      grade: 6,
      academicYear: '2026-2027',
      capacity: 18,
      status: 'Đang hoạt động',
    },
    {
      id: 'class_7A1',
      classId: 'class_7A1',
      classCode: '7A1',
      className: 'Lớp 7A1',
      name: 'Lớp 7A1',
      grade: 7,
      academicYear: '2026-2027',
      capacity: 18,
      status: 'Đang hoạt động',
    },
    {
      id: 'class_closed',
      classId: 'class_closed',
      classCode: 'CLOSED',
      className: 'Lớp Đã Kết Thúc',
      name: 'Lớp Đã Kết Thúc',
      grade: 8,
      academicYear: '2026-2027',
      capacity: 18,
      status: 'Đã kết thúc',
    }
  ];

  const mockAssignments: TeacherAssignment[] = [
    {
      id: 'asn_6A1_toan',
      assignmentId: 'asn_6A1_toan',
      teacherId: 'TCH-2026-001',
      teacherName: 'Trần Quốc Việt',
      classId: 'class_6A1',
      className: 'Lớp 6A1',
      subjectId: 'toan',
      subjectName: 'Toán học',
      academicYear: '2026-2027',
      status: 'ACTIVE',
      startDate: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'asn_6A1_van',
      assignmentId: 'asn_6A1_van',
      teacherId: 'TCH-2026-004',
      teacherName: 'Nguyễn Thu Hà',
      classId: 'class_6A1',
      className: 'Lớp 6A1',
      subjectId: 'van',
      subjectName: 'Ngữ văn',
      academicYear: '2026-2027',
      status: 'ACTIVE',
      startDate: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'asn_old_assignment',
      assignmentId: 'asn_old_assignment',
      teacherId: 'TCH-2026-001',
      teacherName: 'Trần Quốc Việt',
      classId: 'class_6A2',
      className: 'Lớp 6A2',
      subjectId: 'toan',
      subjectName: 'Toán học',
      academicYear: '2025-2026',
      status: 'INACTIVE',
      startDate: '2025-08-01T00:00:00.000Z',
      endDate: '2026-05-31T00:00:00.000Z',
    }
  ];

  // ---------------------------------------------------------------------------
  // 1. INVARIANT: 5 Standard Subjects Only
  // ---------------------------------------------------------------------------
  describe('1. 5 Standard Subjects Invariant', () => {
    it('allows only the 5 standard subjects (Toán, Văn, Anh, Lý, Hóa)', () => {
      expect(STANDARD_SUBJECTS.length).toBe(5);
      expect(STANDARD_SUBJECTS.map(s => s.id)).toEqual(['toan', 'van', 'anh', 'ly', 'hoa']);
    });

    it('validates allowed subjectIds correctly', () => {
      expect(validateTeacherSubject('toan').isValid).toBe(true);
      expect(validateTeacherSubject('van').isValid).toBe(true);
      expect(validateTeacherSubject('anh').isValid).toBe(true);
      expect(validateTeacherSubject('ly').isValid).toBe(true);
      expect(validateTeacherSubject('hoa').isValid).toBe(true);
    });

    it('strictly rejects non-standard subjects (e.g. sinh, su, dia)', () => {
      expect(validateTeacherSubject('sinh').isValid).toBe(false);
      expect(validateTeacherSubject('su').isValid).toBe(false);
      expect(validateTeacherSubject('dia').isValid).toBe(false);
      expect(validateTeacherSubject('').isValid).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. INVARIANT: 1 Teacher -> 1 Subject
  // ---------------------------------------------------------------------------
  describe('2. 1 Teacher -> 1 Subject Validation', () => {
    it('accepts teacher data with valid single subject', () => {
      const result = validateTeacherData(
        {
          teacherId: 'TCH-2026-020',
          fullName: 'Lê Hoàng Nam',
          email: 'nam.le@smartedu.vn',
          subjectId: 'toan',
        },
        mockTeachers,
        false
      );
      expect(result.isValid).toBe(true);
    });

    it('rejects teacher creation with invalid or missing subject', () => {
      const result = validateTeacherData(
        {
          teacherId: 'TCH-2026-021',
          fullName: 'Trần Văn Sinh',
          email: 'sinh.tran@smartedu.vn',
          subjectId: 'sinh',
        },
        mockTeachers,
        false
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('không hợp lệ');
    });

    it('rejects duplicate teacherId during creation', () => {
      const result = validateTeacherData(
        {
          teacherId: 'TCH-2026-001',
          fullName: 'Trùng Mã',
          email: 'duplicate@smartedu.vn',
          subjectId: 'toan',
        },
        mockTeachers,
        false
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('đã tồn tại');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. INVARIANT: Assignment Subject Matching & Multiple Classes
  // ---------------------------------------------------------------------------
  describe('3. Teacher Assignment Eligibility & Multi-Class Invariant', () => {
    const mathTeacher = mockTeachers[0]; // TCH-2026-001 (Toán)
    const litTeacher = mockTeachers[1];  // TCH-2026-004 (Văn)

    it('allows assigning a Math teacher to another active class for Math (1 Teacher -> Multiple Classes)', () => {
      const class7A1 = mockClasses[2];
      const result = validateAssignmentEligibility(
        mathTeacher,
        class7A1,
        'toan',
        '2026-2027',
        mockAssignments
      );
      expect(result.isValid).toBe(true);
    });

    it('strictly REJECTS assigning a Math teacher to teach Literature (Subject mismatch invariant)', () => {
      const class7A1 = mockClasses[2];
      const result = validateAssignmentEligibility(
        mathTeacher,
        class7A1,
        'van', // Attempting to assign Math teacher to Literature!
        '2026-2027',
        mockAssignments
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('không được phép phân công');
    });

    it('strictly REJECTS assigning a Literature teacher to teach Math', () => {
      const class7A1 = mockClasses[2];
      const result = validateAssignmentEligibility(
        litTeacher,
        class7A1,
        'toan', // Attempting to assign Literature teacher to Math!
        '2026-2027',
        mockAssignments
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('không được phép phân công');
    });

    it('rejects duplicate active assignment (same teacher, class, subject, academicYear)', () => {
      const class6A1 = mockClasses[0]; // Already assigned to TCH-2026-001
      const result = validateAssignmentEligibility(
        mathTeacher,
        class6A1,
        'toan',
        '2026-2027',
        mockAssignments
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('đã được phân công');
    });

    it('rejects assignment for inactive teacher', () => {
      const inactiveTeacher = mockTeachers[2];
      const class7A1 = mockClasses[2];
      const result = validateAssignmentEligibility(
        inactiveTeacher,
        class7A1,
        'toan',
        '2026-2027',
        mockAssignments
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('INACTIVE');
    });

    it('rejects assignment for closed/inactive class', () => {
      const closedClass = mockClasses[3];
      const result = validateAssignmentEligibility(
        mathTeacher,
        closedClass,
        'toan',
        '2026-2027',
        mockAssignments
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Đã kết thúc');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Soft Unassign & History Preservation
  // ---------------------------------------------------------------------------
  describe('4. Active Assignments Query & History Preservation', () => {
    it('retrieves only active assignments for the current academic year', () => {
      const activeAssigns = getTeacherActiveAssignments('TCH-2026-001', mockAssignments, '2026-2027');
      expect(activeAssigns.length).toBe(1);
      expect(activeAssigns[0].classId).toBe('class_6A1');
    });

    it('retrieves full historical assignment audit trail (both active and inactive)', () => {
      const history = getTeacherAssignmentHistory('TCH-2026-001', mockAssignments);
      expect(history.length).toBe(2);
      expect(history.some(h => h.status === 'ACTIVE')).toBe(true);
      expect(history.some(h => h.status === 'INACTIVE')).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Zero-Trust RBAC for Teacher & Assignment Management
  // ---------------------------------------------------------------------------
  describe('5. RBAC Authorization Rules', () => {
    it('allows ADMIN, OWNER, and ACADEMIC_STAFF to manage teachers & assignments', () => {
      expect(canManageTeachers('ADMIN')).toBe(true);
      expect(canManageTeachers('OWNER')).toBe(true);
      expect(canManageTeachers('ACADEMIC_STAFF')).toBe(true);

      expect(canManageAssignments('ADMIN')).toBe(true);
      expect(canManageAssignments('OWNER')).toBe(true);
      expect(canManageAssignments('ACADEMIC_STAFF')).toBe(true);
    });

    it('denies TEACHER, STUDENT, PARENT, and ACCOUNTANT from modifying teachers or assignments', () => {
      const restrictedRoles: Role[] = ['TEACHER', 'STUDENT', 'PARENT', 'ACCOUNTANT'];
      restrictedRoles.forEach(role => {
        expect(canManageTeachers(role)).toBe(false);
        expect(canManageAssignments(role)).toBe(false);
      });
    });
  });
});

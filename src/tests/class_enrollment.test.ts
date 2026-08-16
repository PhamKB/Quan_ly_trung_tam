import { describe, it, expect } from 'vitest';
import {
  calculateClassCurrentSize,
  validateGrade,
  validateCapacity,
  validateAcademicYear,
  validateClassCodeUniqueness,
  validateEnrollmentEligibility,
  validateTransferEligibility,
  validateClassEditCapacity,
  getStudentEnrollmentHistory,
  canManageClasses,
  DEFAULT_CAPACITY,
  DEFAULT_ACADEMIC_YEAR
} from '../lib/classEnrollmentService';
import { Class, ClassEnrollment, Student, Role } from '../types';

describe('Checkpoint 4.2: Class & Enrollment Business Logic', () => {
  // Mock Data Setup
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
    }
  ];

  const mockStudents: Student[] = [
    {
      id: 'STU-2026-001',
      name: 'Nguyễn Minh Anh',
      grade: 6,
      classId: 'class_6A1',
      className: 'Lớp 6A1',
      status: 'ACTIVE',
      tuitionOwed: 0,
      tuitionPaid: 4500000,
    },
    {
      id: 'STU-2026-002',
      name: 'Trần Hoàng Nam',
      grade: 7,
      classId: 'class_7A1',
      className: 'Lớp 7A1',
      status: 'ACTIVE',
      tuitionOwed: 0,
      tuitionPaid: 4500000,
    },
    {
      id: 'STU-2026-003',
      name: 'Lê Thu Hà',
      grade: 6,
      classId: '',
      className: '',
      status: 'ACTIVE',
      tuitionOwed: 0,
      tuitionPaid: 4500000,
    }
  ];

  const mockEnrollments: ClassEnrollment[] = [
    {
      id: 'ENR-001',
      studentId: 'STU-2026-001',
      studentName: 'Nguyễn Minh Anh',
      classId: 'class_6A1',
      className: 'Lớp 6A1',
      grade: 6,
      academicYear: '2026-2027',
      startDate: '2026-08-01T08:00:00.000Z',
      status: 'ACTIVE',
    },
    {
      id: 'ENR-002',
      studentId: 'STU-2026-002',
      studentName: 'Trần Hoàng Nam',
      classId: 'class_7A1',
      className: 'Lớp 7A1',
      grade: 7,
      academicYear: '2026-2027',
      startDate: '2026-08-01T08:00:00.000Z',
      status: 'ACTIVE',
    }
  ];

  describe('1. Grade & Capacity Validation', () => {
    it('should validate valid Middle School grades (6, 7, 8, 9)', () => {
      expect(validateGrade(6).valid).toBe(true);
      expect(validateGrade(7).valid).toBe(true);
      expect(validateGrade(8).valid).toBe(true);
      expect(validateGrade(9).valid).toBe(true);
    });

    it('should reject invalid grades (5, 10, 11, 12, negative)', () => {
      expect(validateGrade(5).valid).toBe(false);
      expect(validateGrade(10).valid).toBe(false);
      expect(validateGrade(11).valid).toBe(false);
      expect(validateGrade(12).valid).toBe(false);
      expect(validateGrade(-1).valid).toBe(false);
    });

    it('should validate standard class capacity (18 students)', () => {
      expect(validateCapacity(18).valid).toBe(true);
      expect(validateCapacity(30).valid).toBe(true);
    });

    it('should reject invalid class capacities (<=0, decimals, >50)', () => {
      expect(validateCapacity(0).valid).toBe(false);
      expect(validateCapacity(-5).valid).toBe(false);
      expect(validateCapacity(18.5).valid).toBe(false);
      expect(validateCapacity(55).valid).toBe(false);
    });

    it('should validate academic year pattern', () => {
      expect(validateAcademicYear('2026-2027').valid).toBe(true);
      expect(validateAcademicYear('2025-2026').valid).toBe(true);
      expect(validateAcademicYear('2026').valid).toBe(false);
      expect(validateAcademicYear('invalid-year').valid).toBe(false);
    });
  });

  describe('2. Class Code Uniqueness', () => {
    it('should reject duplicate class codes in the same academic year', () => {
      const result = validateClassCodeUniqueness('6A1', '2026-2027', mockClasses);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('đã tồn tại');
    });

    it('should allow unique class codes in the same academic year', () => {
      const result = validateClassCodeUniqueness('6A3', '2026-2027', mockClasses);
      expect(result.valid).toBe(true);
    });

    it('should allow the same class code when editing its own class ID', () => {
      const result = validateClassCodeUniqueness('6A1', '2026-2027', mockClasses, 'class_6A1');
      expect(result.valid).toBe(true);
    });
  });

  describe('3. Dynamic Sĩ Số & Capacity Calculation', () => {
    it('should calculate active enrollments dynamically from classEnrollments', () => {
      const size6A1 = calculateClassCurrentSize('class_6A1', '2026-2027', mockEnrollments);
      expect(size6A1).toBe(1);

      const size6A2 = calculateClassCurrentSize('class_6A2', '2026-2027', mockEnrollments);
      expect(size6A2).toBe(0);
    });

    it('should ignore TRANSFERRED or COMPLETED enrollments in live count', () => {
      const enrollmentsWithTransferred: ClassEnrollment[] = [
        ...mockEnrollments,
        {
          id: 'ENR-003',
          studentId: 'STU-2026-004',
          classId: 'class_6A1',
          academicYear: '2026-2027',
          startDate: '2026-07-01T08:00:00.000Z',
          endDate: '2026-08-01T08:00:00.000Z',
          status: 'TRANSFERRED',
        }
      ];
      const size = calculateClassCurrentSize('class_6A1', '2026-2027', enrollmentsWithTransferred);
      expect(size).toBe(1);
    });
  });

  describe('4. Enrollment Eligibility & Business Constraints', () => {
    it('should allow enrolling an unassigned student into matching grade class with space', () => {
      const student = mockStudents[2]; // Grade 6, no class
      const targetClass = mockClasses[1]; // 6A2
      const result = validateEnrollmentEligibility(student, targetClass, mockEnrollments);
      expect(result.valid).toBe(true);
    });

    it('should reject enrollment when student grade does not match class grade', () => {
      const student = mockStudents[2]; // Grade 6
      const targetClass = mockClasses[2]; // Grade 7 (7A1)
      const result = validateEnrollmentEligibility(student, targetClass, mockEnrollments);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('không thể ghi danh');
    });

    it('should reject enrollment if student already has an ACTIVE enrollment in that year', () => {
      const student = mockStudents[0]; // Already enrolled in 6A1
      const targetClass = mockClasses[1]; // 6A2
      const result = validateEnrollmentEligibility(student, targetClass, mockEnrollments);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Học sinh đã có lớp');
    });

    it('should reject enrollment if target class is full (capacity reached)', () => {
      const fullClass: Class = {
        id: 'class_full',
        name: 'Lớp 6A3',
        grade: 6,
        academicYear: '2026-2027',
        capacity: 2,
        status: 'Đang hoạt động',
      };
      const fullEnrollments: ClassEnrollment[] = [
        {
          id: 'E1',
          studentId: 'STU-001',
          classId: 'class_full',
          academicYear: '2026-2027',
          startDate: '2026-08-01',
          status: 'ACTIVE',
        },
        {
          id: 'E2',
          studentId: 'STU-002',
          classId: 'class_full',
          academicYear: '2026-2027',
          startDate: '2026-08-01',
          status: 'ACTIVE',
        }
      ];
      const student = mockStudents[2]; // Grade 6
      const result = validateEnrollmentEligibility(student, fullClass, fullEnrollments);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('đã đủ sĩ số');
    });
  });

  describe('5. Class Transfer Eligibility & Atomicity Rules', () => {
    it('should allow transferring student to a different class of the same grade with capacity', () => {
      const student = mockStudents[0]; // In 6A1
      const currentClassId = 'class_6A1';
      const targetClass = mockClasses[1]; // 6A2 (Grade 6)
      const result = validateTransferEligibility(student, currentClassId, targetClass, mockEnrollments);
      expect(result.valid).toBe(true);
    });

    it('should reject transferring student to the exact same class', () => {
      const student = mockStudents[0]; // In 6A1
      const currentClassId = 'class_6A1';
      const targetClass = mockClasses[0]; // 6A1
      const result = validateTransferEligibility(student, currentClassId, targetClass, mockEnrollments);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('phải khác lớp học hiện tại');
    });

    it('should reject transferring student to a different grade class', () => {
      const student = mockStudents[0]; // Grade 6
      const currentClassId = 'class_6A1';
      const targetClass = mockClasses[2]; // 7A1 (Grade 7)
      const result = validateTransferEligibility(student, currentClassId, targetClass, mockEnrollments);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('không thể chuyển sang lớp khối');
    });
  });

  describe('6. Class Capacity Reduction Safety', () => {
    it('should allow increasing capacity or setting capacity >= current student count', () => {
      const targetClass = mockClasses[0]; // 6A1 with 1 student
      const result = validateClassEditCapacity(targetClass, 25, mockEnrollments);
      expect(result.valid).toBe(true);
    });

    it('should reject reducing capacity below the number of currently enrolled active students', () => {
      const targetClass = mockClasses[0]; // 6A1 with 1 student
      const result = validateClassEditCapacity(targetClass, 0, mockEnrollments);
      expect(result.valid).toBe(false);
    });
  });

  describe('7. Student Enrollment History Query', () => {
    it('should return complete enrollment history sorted by date descending', () => {
      const studentHistoryEnrollments: ClassEnrollment[] = [
        {
          id: 'ENR-HIST-1',
          studentId: 'STU-2026-001',
          classId: 'class_6A1',
          academicYear: '2026-2027',
          startDate: '2026-08-01T08:00:00.000Z',
          endDate: '2026-08-15T08:00:00.000Z',
          status: 'TRANSFERRED',
          reason: 'Cân bằng sĩ số',
        },
        {
          id: 'ENR-HIST-2',
          studentId: 'STU-2026-001',
          classId: 'class_6A2',
          academicYear: '2026-2027',
          startDate: '2026-08-15T08:00:00.000Z',
          status: 'ACTIVE',
        }
      ];

      const history = getStudentEnrollmentHistory('STU-2026-001', studentHistoryEnrollments);
      expect(history.length).toBe(2);
      expect(history[0].id).toBe('ENR-HIST-2'); // Most recent first
      expect(history[1].id).toBe('ENR-HIST-1');
    });
  });

  describe('8. RBAC Authorization for Class Management', () => {
    it('should allow ADMIN and ACADEMIC_STAFF to manage classes and enrollments', () => {
      expect(canManageClasses('ADMIN')).toBe(true);
      expect(canManageClasses('OWNER')).toBe(true);
      expect(canManageClasses('ACADEMIC_STAFF')).toBe(true);
    });

    it('should deny TEACHER, ACCOUNTANT, STUDENT, PARENT from managing classes and enrollments', () => {
      expect(canManageClasses('TEACHER')).toBe(false);
      expect(canManageClasses('ACCOUNTANT')).toBe(false);
      expect(canManageClasses('STUDENT')).toBe(false);
      expect(canManageClasses('PARENT')).toBe(false);
    });
  });
});

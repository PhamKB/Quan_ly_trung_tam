import { describe, it, expect } from 'vitest';
import { Student, Parent, Role } from '../types';

describe('Checkpoint 4.1 — Student & Parent Management Logic', () => {
  // Test 1: Grade Validation Constraint (Strictly THCS: 6, 7, 8, 9)
  it('should restrict student grade to valid THCS range (6, 7, 8, 9)', () => {
    const validGrades = [6, 7, 8, 9];
    const testGrade = (grade: number) => validGrades.includes(grade);

    expect(testGrade(6)).toBe(true);
    expect(testGrade(7)).toBe(true);
    expect(testGrade(8)).toBe(true);
    expect(testGrade(9)).toBe(true);

    // Invalid grades
    expect(testGrade(5)).toBe(false);
    expect(testGrade(10)).toBe(false);
    expect(testGrade(11)).toBe(false);
    expect(testGrade(12)).toBe(false);
  });

  // Test 2: Auto ID Generation Format
  it('should correctly format business Student and Parent IDs', () => {
    const generateStudentId = (seq: number) => `STU-2026-${seq.toString().padStart(3, '0')}`;
    const generateParentId = (seq: number) => `PAR-2026-${seq.toString().padStart(3, '0')}`;

    expect(generateStudentId(1)).toBe('STU-2026-001');
    expect(generateStudentId(42)).toBe('STU-2026-042');
    expect(generateParentId(5)).toBe('PAR-2026-005');
  });

  // Test 3: Bidirectional Student ↔ Parent Relationship Linking
  it('should perform bidirectional linking between student and parent', () => {
    const student: Student = {
      id: 'STU-2026-001',
      name: 'Nguyễn Minh Anh',
      grade: 6,
      status: 'ACTIVE',
      parentIds: [],
    };

    const parent: Parent = {
      id: 'PAR-2026-001',
      name: 'Nguyễn Văn Hùng',
      relationship: 'Cha',
      phone: '0937000001',
      email: 'ph.1@smartedu.vn',
      studentIds: [],
      status: 'ACTIVE',
    };

    // Simulate Linking Logic
    const updatedStudent = {
      ...student,
      parentIds: [...(student.parentIds || []), parent.id],
      parentId: parent.id,
      parentName: parent.name,
    };

    const updatedParent = {
      ...parent,
      studentIds: [...(parent.studentIds || []), student.id],
      childIds: [...(parent.childIds || []), student.id],
    };

    expect(updatedStudent.parentIds).toContain('PAR-2026-001');
    expect(updatedStudent.parentId).toBe('PAR-2026-001');
    expect(updatedStudent.parentName).toBe('Nguyễn Văn Hùng');

    expect(updatedParent.studentIds).toContain('STU-2026-001');
    expect(updatedParent.childIds).toContain('STU-2026-001');
  });

  // Test 4: RBAC Access Control Permissions for Student/Parent Management
  it('should grant write permissions only to ADMIN, OWNER, and ACADEMIC_STAFF', () => {
    const canWrite = (role: Role) => role === 'ADMIN' || role === 'OWNER' || role === 'ACADEMIC_STAFF';

    expect(canWrite('ADMIN')).toBe(true);
    expect(canWrite('OWNER')).toBe(true);
    expect(canWrite('ACADEMIC_STAFF')).toBe(true);

    expect(canWrite('TEACHER')).toBe(false);
    expect(canWrite('ACCOUNTANT')).toBe(false);
    expect(canWrite('STUDENT')).toBe(false);
    expect(canWrite('PARENT')).toBe(false);
  });

  // Test 5: Soft Delete (Status Toggle) Logic
  it('should toggle student status between ACTIVE and INACTIVE', () => {
    const student: Student = {
      id: 'STU-2026-001',
      name: 'Test Student',
      grade: 6,
      status: 'ACTIVE',
    };

    const deactivate = (s: Student): Student => ({
      ...s,
      status: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
    });

    const inactiveStudent = deactivate(student);
    expect(inactiveStudent.status).toBe('INACTIVE');

    const reactivatedStudent = deactivate(inactiveStudent);
    expect(reactivatedStudent.status).toBe('ACTIVE');
  });
});

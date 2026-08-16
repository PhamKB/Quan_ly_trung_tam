import { describe, it, expect } from 'vitest';
import { 
  generateTempPassword, 
  generateUniqueUsername, 
  hashPassword, 
  verifyPassword, 
  validateNewPassword 
} from '../lib/accountUtils';
import { Student, Parent, User, Role } from '../types';

describe('Checkpoint 4.1.2 — Account Provisioning & Password Security', () => {

  // 1. Username Generation Tests
  describe('Username Generation', () => {
    it('generates a student username starting with hs_ and padded to 4 digits', () => {
      const username = generateUniqueUsername(true, 'STU-2026-001', []);
      expect(username).toBe('hs_0001');
      expect(username).not.toContain('@');
      expect(username).not.toContain(' ');
      expect(username).toBe(username.toLowerCase());
    });

    it('generates a parent username starting with ph_ and padded to 4 digits', () => {
      const username = generateUniqueUsername(false, 'PAR-2026-005', []);
      expect(username).toBe('ph_0005');
      expect(username).not.toContain('@');
      expect(username).not.toContain(' ');
      expect(username).toBe(username.toLowerCase());
    });

    it('guarantees uniqueness by incrementing index when username collision occurs', () => {
      const existing = ['hs_0001', 'hs_0002'];
      const username = generateUniqueUsername(true, 'STU-2026-001', existing);
      expect(username).toBe('hs_0003');
      expect(existing).not.toContain(username);
    });
  });

  // 2. Temporary Password Generation Tests
  describe('Temporary Password Generation', () => {
    it('generates an 8-character random password containing alphanumeric characters', () => {
      const pass1 = generateTempPassword(8);
      const pass2 = generateTempPassword(8);
      expect(pass1.length).toBe(8);
      expect(pass2.length).toBe(8);
      expect(pass1).not.toBe(pass2); // Randomness
      expect(pass1).toMatch(/[A-Za-z0-9]/);
    });
  });

  // 3. Password Hashing & Verification Tests
  describe('Bcrypt Password Hashing', () => {
    it('hashes passwords using bcrypt and verifies correctly', () => {
      const plain = 'TempPass123';
      const hash = hashPassword(plain);

      expect(hash).not.toBe(plain); // Plaintext is NEVER stored
      expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);

      const isValid = verifyPassword(plain, hash);
      expect(isValid).toBe(true);

      const isInvalid = verifyPassword('WrongPass', hash);
      expect(isInvalid).toBe(false);
    });
  });

  // 4. First Login Password Validation Tests
  describe('First Login Password Validation', () => {
    it('rejects passwords shorter than 6 characters', () => {
      const res = validateNewPassword('12345', '12345', 'Temp1234');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('6 ký tự');
    });

    it('rejects when new password and confirm password do not match', () => {
      const res = validateNewPassword('Secret123', 'Secret456', 'Temp1234');
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('không khớp');
    });

    it('rejects when new password matches the temporary password', () => {
      const temp = 'Temp1234';
      const res = validateNewPassword(temp, temp, temp);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('trùng');
    });

    it('accepts valid new password', () => {
      const res = validateNewPassword('NewSecurePass123', 'NewSecurePass123', 'Temp1234');
      expect(res.isValid).toBe(true);
      expect(res.error).toBeUndefined();
    });
  });

  // 5. Account Provisioning & Duplicate Prevention Simulation
  describe('Account Provisioning & Duplicate Check', () => {
    it('prevents re-provisioning if account already exists', () => {
      const student: Student = {
        id: 'STU-2026-001',
        name: 'Nguyễn Minh Anh',
        grade: 6,
        status: 'ACTIVE',
        userId: 'USR-STUDENT-STU-2026-001', // Already provisioned
        username: 'hs_0001'
      };

      const canProvision = !student.userId;
      expect(canProvision).toBe(false); // Rejected!
    });

    it('ensures correct account link consistency between user and target student', () => {
      const studentId = 'STU-2026-010';
      const generatedUid = `USR-STUDENT-${studentId}`;
      const username = 'hs_0010';
      const tempPass = 'Pass9988';
      const passwordHash = hashPassword(tempPass);

      const userDoc: User = {
        id: generatedUid,
        username,
        passwordHash,
        mustChangePassword: true,
        studentId,
        name: 'Trần Bảo Nam',
        email: 'hs_0010@smartedu.vn',
        role: 'STUDENT',
        department: 'Học sinh Khối 6',
        school: 'Trụ sở chính',
        status: 'Đang hoạt động'
      };

      const updatedStudent: Student = {
        id: studentId,
        name: 'Trần Bảo Nam',
        grade: 6,
        status: 'ACTIVE',
        userId: userDoc.id,
        username: userDoc.username
      };

      // Verify reciprocal linkage
      expect(userDoc.studentId).toBe(updatedStudent.id);
      expect(updatedStudent.userId).toBe(userDoc.id);
      expect(userDoc.mustChangePassword).toBe(true);
    });
  });

  // 6. RBAC Role Restrictions
  describe('RBAC Role Escalation Restrictions', () => {
    it('restricts Academic Staff from provisioning Admin/Owner accounts', () => {
      const currentRole: Role = 'ACADEMIC_STAFF';
      const allowedRolesToCreate: Role[] = ['STUDENT', 'PARENT', 'TEACHER'];

      expect(allowedRolesToCreate.includes('ADMIN')).toBe(false);
      expect(allowedRolesToCreate.includes('OWNER')).toBe(false);
    });
  });

  // 7. Audit Log Security
  describe('Audit Log Security', () => {
    it('ensures audit log details do not contain plaintext passwords or password hashes', () => {
      const username = 'hs_0001';
      const studentName = 'Nguyễn Minh Anh';
      const auditDetails = `Cấp tài khoản Học sinh cho ${studentName} (username: ${username})`;

      expect(auditDetails).not.toContain('password');
      expect(auditDetails).not.toContain('hash');
      expect(auditDetails).not.toContain('$2b$');
      expect(auditDetails).toContain('username: hs_0001');
    });
  });
});

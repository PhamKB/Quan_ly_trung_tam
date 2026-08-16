import React, { useState, useMemo } from 'react';
import { 
  Users, User, Plus, Search, Eye, Edit2, UserCheck, UserX, Link, Unlink,
  Check, X, Shield, Phone, Mail, MapPin, Calendar, BookOpen, AlertCircle, Key, RefreshCw, Copy
} from 'lucide-react';
import { Student, Parent, Role, StudentStatus, ParentRelationship, User as UserType } from '../types';
import { Button, PageHeader, Badge, SearchInput, Modal, Card } from './Common';
import { doc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { generateTempPassword, generateUniqueUsername, hashPassword } from '../lib/accountUtils';

interface StudentParentManagementProps {
  currentTab: 'students' | 'parents';
  students: Student[];
  parents: Parent[];
  currentRole: Role;
  currentUser: any;
  userProfile: UserType | null;
  onRaiseToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onLogAudit: (action: string, target: string, status: 'Success' | 'Warning' | 'Critical', details: string) => Promise<void>;
  onNavigateTab?: (tab: string) => void;
}

export const StudentParentManagement: React.FC<StudentParentManagementProps> = ({
  currentTab,
  students,
  parents,
  currentRole,
  currentUser,
  userProfile,
  onRaiseToast,
  onLogAudit,
}) => {
  // Navigation / Active View Mode
  const [activeSubTab, setActiveSubTab] = useState<'students' | 'parents'>(
    currentTab === 'parents' ? 'parents' : 'students'
  );

  // Sync subtab when currentTab prop changes
  React.useEffect(() => {
    if (currentTab === 'parents' || currentTab === 'students') {
      setActiveSubTab(currentTab);
    }
  }, [currentTab]);

  // Permission helpers
  const isWritable = currentRole === 'ADMIN' || currentRole === 'OWNER' || currentRole === 'ACADEMIC_STAFF';

  // --- STUDENT FILTERS & SEARCH ---
  const [studentSearch, setStudentSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL'); // ALL, 6, 7, 8, 9
  const [statusFilter, setStatusFilter] = useState<string>('ALL'); // ALL, ACTIVE, INACTIVE, TRANSFERRED, GRADUATED

  // --- PARENT FILTERS & SEARCH ---
  const [parentSearch, setParentSearch] = useState('');

  // --- MODAL STATES ---
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailStudentOpen, setIsDetailStudentOpen] = useState(false);
  const [isCreateStudentOpen, setIsCreateStudentOpen] = useState(false);
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student>>({});

  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [isDetailParentOpen, setIsDetailParentOpen] = useState(false);
  const [isCreateParentOpen, setIsCreateParentOpen] = useState(false);
  const [isEditParentOpen, setIsEditParentOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Partial<Parent>>({});

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkingStudentId, setLinkingStudentId] = useState<string>('');
  const [selectedParentIdToLink, setSelectedParentIdToLink] = useState<string>('');

  const [isGrantAccountOpen, setIsGrantAccountOpen] = useState(false);
  const [accountTargetType, setAccountTargetType] = useState<'STUDENT' | 'PARENT'>('STUDENT');
  const [grantingTargetId, setGrantingTargetId] = useState<string>('');

  // New Student Form State
  const [newStudent, setNewStudent] = useState({
    name: '',
    dateOfBirth: '2012-05-15',
    gender: 'Nam' as 'Nam' | 'Nữ' | 'Khác',
    phone: '',
    email: '',
    address: 'Hà Nội',
    grade: 6 as number,
    status: 'ACTIVE' as StudentStatus,
    parentId: '',
  });

  // New Parent Form State
  const [newParent, setNewParent] = useState({
    name: '',
    relationship: 'Cha' as ParentRelationship,
    phone: '',
    email: '',
    address: 'Hà Nội',
    job: 'Kinh doanh',
    studentIds: [] as string[],
  });

  // --- RBAC SCOPED FILTERING ---
  // If currentRole is STUDENT: only show self
  // If currentRole is PARENT: only show linked children
  const filteredStudents = useMemo(() => {
    let result = students;

    // RBAC Scope
    if (currentRole === 'STUDENT') {
      const userEmail = currentUser?.email?.toLowerCase();
      result = result.filter(s => s.userId === currentUser?.uid || s.email?.toLowerCase() === userEmail || s.id === userProfile?.id);
    } else if (currentRole === 'PARENT') {
      const userEmail = currentUser?.email?.toLowerCase();
      const parentDoc = parents.find(p => p.userId === currentUser?.uid || p.email?.toLowerCase() === userEmail);
      if (parentDoc) {
        const childIds = parentDoc.studentIds || parentDoc.childIds || [];
        result = result.filter(s => childIds.includes(s.id) || s.parentId === parentDoc.id || s.parentIds?.includes(parentDoc.id));
      } else {
        result = [];
      }
    }

    // Search filter
    if (studentSearch.trim()) {
      const q = studentSearch.toLowerCase().trim();
      result = result.filter(s => 
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.parentName && s.parentName.toLowerCase().includes(q))
      );
    }

    // Grade filter (Strict THCS: 6, 7, 8, 9)
    if (gradeFilter !== 'ALL') {
      const g = parseInt(gradeFilter, 10);
      result = result.filter(s => s.grade === g);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(s => {
        if (statusFilter === 'ACTIVE') return s.status === 'ACTIVE' || s.status === 'Đang học';
        if (statusFilter === 'INACTIVE') return s.status === 'INACTIVE' || s.status === 'Tạm ngừng';
        if (statusFilter === 'TRANSFERRED') return s.status === 'TRANSFERRED' || s.status === 'Chuyển trường';
        if (statusFilter === 'GRADUATED') return s.status === 'GRADUATED' || s.status === 'Đã tốt nghiệp';
        return s.status === statusFilter;
      });
    }

    return result;
  }, [students, parents, currentRole, currentUser, userProfile, studentSearch, gradeFilter, statusFilter]);

  const filteredParents = useMemo(() => {
    let result = parents;

    if (currentRole === 'PARENT') {
      const userEmail = currentUser?.email?.toLowerCase();
      result = result.filter(p => p.userId === currentUser?.uid || p.email?.toLowerCase() === userEmail);
    } else if (currentRole === 'STUDENT') {
      // Find student's parent
      const studentDoc = students.find(s => s.userId === currentUser?.uid || s.email?.toLowerCase() === currentUser?.email?.toLowerCase());
      if (studentDoc) {
        const pIds = studentDoc.parentIds || (studentDoc.parentId ? [studentDoc.parentId] : []);
        result = result.filter(p => pIds.includes(p.id) || p.studentIds?.includes(studentDoc.id));
      } else {
        result = [];
      }
    }

    if (parentSearch.trim()) {
      const q = parentSearch.toLowerCase().trim();
      result = result.filter(p => 
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.phone && p.phone.includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q))
      );
    }

    return result;
  }, [parents, students, currentRole, currentUser, parentSearch]);

  // Helper formatting status text
  const formatStudentStatus = (status: string) => {
    if (status === 'ACTIVE' || status === 'Đang học') return { text: 'Đang học', status: 'Low' as const };
    if (status === 'INACTIVE' || status === 'Tạm ngừng') return { text: 'Tạm ngừng', status: 'High' as const };
    if (status === 'TRANSFERRED' || status === 'Chuyển trường') return { text: 'Chuyển trường', status: 'Medium' as const };
    if (status === 'GRADUATED' || status === 'Đã tốt nghiệp') return { text: 'Đã tốt nghiệp', status: 'Low' as const };
    return { text: status || 'Đang học', status: 'Low' as const };
  };

  // --- ACTIONS: CREATE STUDENT ---
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name.trim()) {
      onRaiseToast('⚠️ Vui lòng nhập họ và tên học sinh.', 'warning');
      return;
    }
    if (![6, 7, 8, 9].includes(Number(newStudent.grade))) {
      onRaiseToast('❌ Khối lớp không hợp lệ. Chỉ chấp nhận Khối 6, 7, 8, 9 (THCS).', 'error');
      return;
    }

    // Auto generate STU-2026-XXX ID
    const nextSeq = (students.length + 1).toString().padStart(3, '0');
    const autoId = `STU-2026-${nextSeq}`;

    // Find linked parent if selected
    let parentDoc = parents.find(p => p.id === newStudent.parentId);
    const parentIds = parentDoc ? [parentDoc.id] : [];
    const parentName = parentDoc ? parentDoc.name : '';

    const createdStudent: Student = {
      id: autoId,
      studentId: autoId,
      userId: null,
      name: newStudent.name.trim(),
      fullName: newStudent.name.trim(),
      dateOfBirth: newStudent.dateOfBirth,
      gender: newStudent.gender,
      phone: newStudent.phone || `0985000${nextSeq}`,
      email: newStudent.email || `hs.${parseInt(nextSeq, 10)}@smartedu.vn`,
      address: newStudent.address,
      grade: Number(newStudent.grade),
      status: newStudent.status,
      parentIds: parentIds,
      parentId: parentDoc ? parentDoc.id : undefined,
      parentName: parentName,
      className: `Lớp ${newStudent.grade}A1`,
      classId: `class_${newStudent.grade}A1`,
      course: `Khối ${newStudent.grade} Toàn diện`,
      gpa: 8.0,
      attendanceRate: 100,
      homeworkCompletion: 100,
      riskScore: 10,
      riskLevel: 'Low',
      tuitionPaid: 4500000,
      tuitionOwed: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const batch = writeBatch(db);
      const studentRef = doc(db, 'students', autoId);
      batch.set(studentRef, createdStudent);

      // If parent selected, sync parent's studentIds
      if (parentDoc) {
        const parentRef = doc(db, 'parents', parentDoc.id);
        const existingChildIds = parentDoc.studentIds || parentDoc.childIds || [];
        if (!existingChildIds.includes(autoId)) {
          const updatedChildIds = [...existingChildIds, autoId];
          batch.update(parentRef, { 
            studentIds: updatedChildIds, 
            childIds: updatedChildIds,
            updatedAt: new Date().toISOString()
          });
        }
      }

      await batch.commit();

      await onLogAudit(
        'CREATE_STUDENT',
        `students/${autoId}`,
        'Success',
        `Tạo hồ sơ học sinh mới ${createdStudent.name} (${autoId}) Khối ${createdStudent.grade}`
      );

      onRaiseToast(`✓ Đã tạo thành công học sinh ${createdStudent.name} (${autoId}).`, 'success');
      setIsCreateStudentOpen(false);
      setNewStudent({
        name: '',
        dateOfBirth: '2012-05-15',
        gender: 'Nam',
        phone: '',
        email: '',
        address: 'Hà Nội',
        grade: 6,
        status: 'ACTIVE',
        parentId: '',
      });
    } catch (err: any) {
      console.error('Error creating student:', err);
      onRaiseToast(`❌ Tạo học sinh thất bại: ${err?.message || 'Lỗi hệ thống'}`, 'error');
    }
  };

  // --- ACTIONS: EDIT STUDENT ---
  const handleOpenEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setEditingStudent({ ...student });
    setIsEditStudentOpen(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !editingStudent.name?.trim()) {
      onRaiseToast('⚠️ Vui lòng nhập họ tên hợp lệ.', 'warning');
      return;
    }
    if (editingStudent.grade && ![6, 7, 8, 9].includes(Number(editingStudent.grade))) {
      onRaiseToast('❌ Khối lớp không hợp lệ. Chỉ chấp nhận Khối 6, 7, 8, 9 (THCS).', 'error');
      return;
    }

    try {
      const studentRef = doc(db, 'students', selectedStudent.id);
      const updatedData = {
        name: editingStudent.name.trim(),
        fullName: editingStudent.name.trim(),
        dateOfBirth: editingStudent.dateOfBirth || selectedStudent.dateOfBirth,
        gender: editingStudent.gender || selectedStudent.gender,
        phone: editingStudent.phone || selectedStudent.phone,
        email: editingStudent.email || selectedStudent.email,
        address: editingStudent.address || selectedStudent.address,
        grade: Number(editingStudent.grade || selectedStudent.grade),
        status: editingStudent.status || selectedStudent.status,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(studentRef, updatedData);

      await onLogAudit(
        'UPDATE_STUDENT',
        `students/${selectedStudent.id}`,
        'Success',
        `Cập nhật thông tin học sinh ${editingStudent.name} (${selectedStudent.id})`
      );

      onRaiseToast(`✓ Đã cập nhật học sinh ${editingStudent.name}.`, 'success');
      setIsEditStudentOpen(false);
    } catch (err: any) {
      console.error('Error updating student:', err);
      onRaiseToast(`❌ Cập nhật thất bại: ${err?.message || 'Lỗi Firestore'}`, 'error');
    }
  };

  // --- ACTIONS: TOGGLE STUDENT STATUS (SOFT DELETE) ---
  const handleToggleStudentStatus = async (student: Student) => {
    if (!isWritable) return;
    const isCurrentlyActive = student.status === 'ACTIVE' || student.status === 'Đang học';
    const nextStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    const actionText = isCurrentlyActive ? 'ngừng học (INACTIVE)' : 'kích hoạt lại (ACTIVE)';

    if (!window.confirm(`Xác nhận chuyển trạng thái học sinh ${student.name} sang ${actionText}?`)) {
      return;
    }

    try {
      const studentRef = doc(db, 'students', student.id);
      await updateDoc(studentRef, { 
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });

      await onLogAudit(
        isCurrentlyActive ? 'DEACTIVATE_STUDENT' : 'ACTIVATE_STUDENT',
        `students/${student.id}`,
        'Success',
        `Chuyển trạng thái học sinh ${student.name} (${student.id}) sang ${nextStatus}`
      );

      onRaiseToast(`✓ Đã cập nhật trạng thái học sinh sang ${nextStatus}.`, 'success');
    } catch (err: any) {
      console.error('Error toggling status:', err);
      onRaiseToast(`❌ Lỗi cập nhật trạng thái: ${err?.message}`, 'error');
    }
  };

  // --- ACTIONS: CREATE PARENT ---
  const handleCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParent.name.trim() || !newParent.phone.trim()) {
      onRaiseToast('⚠️ Vui lòng điền họ tên và số điện thoại phụ huynh.', 'warning');
      return;
    }

    const nextSeq = (parents.length + 1).toString().padStart(3, '0');
    const autoId = `PAR-2026-${nextSeq}`;

    const createdParent: Parent = {
      id: autoId,
      parentId: autoId,
      userId: null,
      name: newParent.name.trim(),
      fullName: newParent.name.trim(),
      relationship: newParent.relationship,
      phone: newParent.phone.trim(),
      email: newParent.email || `ph.${parseInt(nextSeq, 10)}@smartedu.vn`,
      address: newParent.address,
      job: newParent.job,
      studentIds: newParent.studentIds,
      childIds: newParent.studentIds,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const batch = writeBatch(db);
      const parentRef = doc(db, 'parents', autoId);
      batch.set(parentRef, createdParent);

      // Bidirectional sync for linked students
      newParent.studentIds.forEach(stuId => {
        const studentDoc = students.find(s => s.id === stuId);
        if (studentDoc) {
          const studentRef = doc(db, 'students', stuId);
          const existingParents = studentDoc.parentIds || (studentDoc.parentId ? [studentDoc.parentId] : []);
          if (!existingParents.includes(autoId)) {
            batch.update(studentRef, {
              parentIds: [...existingParents, autoId],
              parentId: autoId,
              parentName: createdParent.name,
              updatedAt: new Date().toISOString()
            });
          }
        }
      });

      await batch.commit();

      await onLogAudit(
        'CREATE_PARENT',
        `parents/${autoId}`,
        'Success',
        `Tạo hồ sơ phụ huynh mới ${createdParent.name} (${autoId})`
      );

      onRaiseToast(`✓ Đã tạo phụ huynh ${createdParent.name} (${autoId}).`, 'success');
      setIsCreateParentOpen(false);
      setNewParent({
        name: '',
        relationship: 'Cha',
        phone: '',
        email: '',
        address: 'Hà Nội',
        job: 'Kinh doanh',
        studentIds: [],
      });
    } catch (err: any) {
      console.error('Error creating parent:', err);
      onRaiseToast(`❌ Tạo phụ huynh thất bại: ${err?.message}`, 'error');
    }
  };

  // --- ACTIONS: LINK PARENT ↔ STUDENT ---
  const handleOpenLinkModal = (studentId: string) => {
    setLinkingStudentId(studentId);
    setSelectedParentIdToLink('');
    setIsLinkModalOpen(true);
  };

  const handlePerformLinkParentStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkingStudentId || !selectedParentIdToLink) {
      onRaiseToast('⚠️ Vui lòng chọn phụ huynh để liên kết.', 'warning');
      return;
    }

    const studentDoc = students.find(s => s.id === linkingStudentId);
    const parentDoc = parents.find(p => p.id === selectedParentIdToLink);

    if (!studentDoc || !parentDoc) {
      onRaiseToast('❌ Dữ liệu không hợp lệ.', 'error');
      return;
    }

    try {
      const batch = writeBatch(db);

      // 1. Update Student
      const studentRef = doc(db, 'students', studentDoc.id);
      const existingParentIds = studentDoc.parentIds || (studentDoc.parentId ? [studentDoc.parentId] : []);
      if (!existingParentIds.includes(parentDoc.id)) {
        const newParentIds = [...existingParentIds, parentDoc.id];
        batch.update(studentRef, {
          parentIds: newParentIds,
          parentId: parentDoc.id,
          parentName: parentDoc.name,
          updatedAt: new Date().toISOString()
        });
      }

      // 2. Update Parent
      const parentRef = doc(db, 'parents', parentDoc.id);
      const existingChildIds = parentDoc.studentIds || parentDoc.childIds || [];
      if (!existingChildIds.includes(studentDoc.id)) {
        const newChildIds = [...existingChildIds, studentDoc.id];
        batch.update(parentRef, {
          studentIds: newChildIds,
          childIds: newChildIds,
          updatedAt: new Date().toISOString()
        });
      }

      await batch.commit();

      await onLogAudit(
        'LINK_PARENT_STUDENT',
        `students/${studentDoc.id}`,
        'Success',
        `Liên kết phụ huynh ${parentDoc.name} (${parentDoc.id}) với học sinh ${studentDoc.name} (${studentDoc.id})`
      );

      onRaiseToast(`✓ Đã liên kết phụ huynh ${parentDoc.name} với học sinh ${studentDoc.name}.`, 'success');
      setIsLinkModalOpen(false);
    } catch (err: any) {
      console.error('Error linking parent and student:', err);
      onRaiseToast(`❌ Liên kết thất bại: ${err?.message}`, 'error');
    }
  };

  const handleUnlinkParentStudent = async (studentId: string, parentIdToUnlink: string) => {
    if (!isWritable) return;
    const studentDoc = students.find(s => s.id === studentId);
    const parentDoc = parents.find(p => p.id === parentIdToUnlink);
    if (!studentDoc || !parentDoc) return;

    if (!window.confirm(`Xác nhận hủy liên kết giữa học sinh ${studentDoc.name} và phụ huynh ${parentDoc.name}?`)) {
      return;
    }

    try {
      const batch = writeBatch(db);

      // Unlink student side
      const studentRef = doc(db, 'students', studentDoc.id);
      const updatedParentIds = (studentDoc.parentIds || []).filter(pid => pid !== parentIdToUnlink);
      batch.update(studentRef, {
        parentIds: updatedParentIds,
        parentId: updatedParentIds[0] || null,
        parentName: updatedParentIds[0] ? (parents.find(p => p.id === updatedParentIds[0])?.name || '') : '',
        updatedAt: new Date().toISOString()
      });

      // Unlink parent side
      const parentRef = doc(db, 'parents', parentDoc.id);
      const updatedChildIds = (parentDoc.studentIds || parentDoc.childIds || []).filter(cid => cid !== studentDoc.id);
      batch.update(parentRef, {
        studentIds: updatedChildIds,
        childIds: updatedChildIds,
        updatedAt: new Date().toISOString()
      });

      await batch.commit();

      await onLogAudit(
        'UNLINK_PARENT_STUDENT',
        `students/${studentDoc.id}`,
        'Success',
        `Hủy liên kết phụ huynh ${parentDoc.name} (${parentDoc.id}) khỏi học sinh ${studentDoc.name} (${studentDoc.id})`
      );

      onRaiseToast(`✓ Đã hủy liên kết thành công.`, 'success');
    } catch (err: any) {
      console.error('Error unlinking:', err);
      onRaiseToast(`❌ Hủy liên kết thất bại: ${err?.message}`, 'error');
    }
  };

  // Single-use Credentials Modal State
  const [credentialsModal, setCredentialsModal] = useState<{
    isOpen: boolean;
    name: string;
    username: string;
    tempPass: string;
    role: 'STUDENT' | 'PARENT';
    isReset?: boolean;
  } | null>(null);

  // --- ACTIONS: GRANT USER ACCOUNT ---
  const handleGrantUserAccount = async (targetId: string, targetType: 'STUDENT' | 'PARENT') => {
    // Role restriction: Only ADMIN, OWNER, ACADEMIC_STAFF can provision accounts
    if (!isWritable) {
      onRaiseToast('❌ Bạn không có quyền cấp tài khoản hệ thống.', 'error');
      return;
    }

    const isStu = targetType === 'STUDENT';
    const targetDoc = isStu ? students.find(s => s.id === targetId) : parents.find(p => p.id === targetId);

    if (!targetDoc) return;

    // Duplicate account prevention check
    if (targetDoc.userId) {
      onRaiseToast(isStu ? 'Học sinh đã có tài khoản.' : 'Phụ huynh đã có tài khoản.', 'error');
      return;
    }

    // Collect existing usernames to guarantee uniqueness
    const existingUsernames: string[] = [
      ...students.map(s => s.username).filter(Boolean) as string[],
      ...parents.map(p => p.username).filter(Boolean) as string[],
    ];

    const username = generateUniqueUsername(isStu, targetId, existingUsernames);
    const tempPass = generateTempPassword(8);
    const passwordHash = hashPassword(tempPass);

    const email = targetDoc.email || `${username}@smartedu.vn`;
    const generatedUid = `USR-${isStu ? 'STUDENT' : 'PARENT'}-${targetId}`;

    try {
      const userPayload: UserType = {
        id: generatedUid,
        username: username,
        passwordHash: passwordHash,
        mustChangePassword: true,
        studentId: isStu ? targetId : undefined,
        parentId: !isStu ? targetId : undefined,
        email: email,
        name: targetDoc.name,
        role: isStu ? 'STUDENT' : 'PARENT',
        department: isStu ? `Học sinh Khối ${(targetDoc as Student).grade || 6}` : 'Phụ huynh học sinh',
        school: 'Trụ sở chính',
        status: 'Đang hoạt động',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (auth.currentUser) {
        const batch = writeBatch(db);
        const userRef = doc(db, 'users', generatedUid);
        batch.set(userRef, userPayload);

        const docRef = doc(db, isStu ? 'students' : 'parents', targetId);
        batch.update(docRef, {
          userId: generatedUid,
          username: username,
          updatedAt: new Date().toISOString()
        });

        await batch.commit();
      } else {
        try {
          const userRef = doc(db, 'users', generatedUid);
          await setDoc(userRef, userPayload);
          const docRef = doc(db, isStu ? 'students' : 'parents', targetId);
          await updateDoc(docRef, {
            userId: generatedUid,
            username: username,
            updatedAt: new Date().toISOString()
          });
        } catch (simErr) {
          console.warn('Simulated mode Firestore write warning:', simErr);
        }
      }

      // Sync local target doc properties
      targetDoc.userId = generatedUid;
      targetDoc.username = username;

      // Audit Log requirement: CREATE_USER (No plaintext password logged!)
      await onLogAudit(
        'CREATE_USER',
        `users/${generatedUid}`,
        'Success',
        `Cấp tài khoản ${isStu ? 'Học sinh' : 'Phụ huynh'} cho ${targetDoc.name} (username: ${username})`
      );

      // Display Credentials Modal once
      setCredentialsModal({
        isOpen: true,
        name: targetDoc.name,
        username,
        tempPass,
        role: isStu ? 'STUDENT' : 'PARENT',
        isReset: false
      });

      onRaiseToast(`✓ Đã cấp tài khoản thành công cho ${targetDoc.name}.`, 'success');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `users/${generatedUid}`);
      onRaiseToast(`❌ Cấp tài khoản thất bại: ${err?.message}`, 'error');
    }
  };

  // --- ACTIONS: RESET USER PASSWORD ---
  const handleResetUserPassword = async (targetId: string, targetType: 'STUDENT' | 'PARENT') => {
    if (!isWritable) {
      onRaiseToast('❌ Bạn không có quyền đặt lại mật khẩu.', 'error');
      return;
    }

    const isStu = targetType === 'STUDENT';
    const targetDoc = isStu ? students.find(s => s.id === targetId) : parents.find(p => p.id === targetId);

    if (!targetDoc || !targetDoc.userId) {
      onRaiseToast('❌ Tài khoản không tồn tại hoặc chưa được khởi tạo.', 'error');
      return;
    }

    const uid = targetDoc.userId;
    const existingUsername = targetDoc.username || (isStu ? `hs_${targetId.replace(/[^0-9]/g, '').padStart(4, '0')}` : `ph_${targetId.replace(/[^0-9]/g, '').padStart(4, '0')}`);
    const newTempPass = generateTempPassword(8);
    const newHash = hashPassword(newTempPass);

    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        passwordHash: newHash,
        mustChangePassword: true,
        updatedAt: new Date().toISOString()
      });

      // Audit Log requirement: RESET_USER_PASSWORD (No plaintext password logged!)
      await onLogAudit(
        'RESET_USER_PASSWORD',
        `users/${uid}`,
        'Success',
        `Đặt lại mật khẩu cho ${isStu ? 'Học sinh' : 'Phụ huynh'} ${targetDoc.name} (username: ${existingUsername})`
      );

      // Display Credentials Modal once
      setCredentialsModal({
        isOpen: true,
        name: targetDoc.name,
        username: existingUsername,
        tempPass: newTempPass,
        role: isStu ? 'STUDENT' : 'PARENT',
        isReset: true
      });

      onRaiseToast(`✓ Đã đặt lại mật khẩu thành công cho ${targetDoc.name}.`, 'success');
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      onRaiseToast(`❌ Đặt lại mật khẩu thất bại: ${err?.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER WITH SUBTAB SWITCHER */}
      <PageHeader 
        breadcrumbs={[{ label: 'Quản lý' }, { label: activeSubTab === 'students' ? 'Danh sách Học sinh' : 'Danh sách Phụ huynh', active: true }]}
        title={activeSubTab === 'students' ? 'Quản Lý Học Sinh & Hồ Sơ Đào Tạo' : 'Quản Lý Phụ Huynh & Gia Đình'}
        description="Quản lý tập trung hồ sơ học viên THCS (Khối 6, 7, 8, 9), phụ huynh liên kết và tài khoản hệ thống."
        action={
          <div className="flex items-center space-x-2">
            <div className="bg-[#EDF2F7] p-1 rounded-lg flex items-center space-x-1">
              <button
                onClick={() => setActiveSubTab('students')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'students' 
                    ? 'bg-white text-[#2F80ED] shadow-xs' 
                    : 'text-[#718096] hover:text-[#2D3748]'
                }`}
              >
                Học sinh ({students.length})
              </button>
              <button
                onClick={() => setActiveSubTab('parents')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'parents' 
                    ? 'bg-white text-[#2F80ED] shadow-xs' 
                    : 'text-[#718096] hover:text-[#2D3748]'
                }`}
              >
                Phụ huynh ({parents.length})
              </button>
            </div>

            {isWritable && (
              activeSubTab === 'students' ? (
                <Button variant="primary" size="sm" onClick={() => setIsCreateStudentOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Thêm học sinh
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={() => setIsCreateParentOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Thêm phụ huynh
                </Button>
              )
            )}
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* 1. VIEW SUBTAB: STUDENTS */}
      {/* ========================================================================= */}
      {activeSubTab === 'students' && (
        <div className="space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <div className="bg-white p-3.5 rounded-xl border border-[#DCE7F3]">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Tổng học sinh</span>
              <span className="text-xl font-bold text-[#2D3748] mt-1 block">{students.length} em</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-[#DCE7F3]">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Khối 6</span>
              <span className="text-xl font-bold text-[#1C6DD0] mt-1 block">{students.filter(s => s.grade === 6).length} em</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-[#DCE7F3]">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Khối 7</span>
              <span className="text-xl font-bold text-[#1C6DD0] mt-1 block">{students.filter(s => s.grade === 7).length} em</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-[#DCE7F3]">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Khối 8</span>
              <span className="text-xl font-bold text-[#1C6DD0] mt-1 block">{students.filter(s => s.grade === 8).length} em</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-[#DCE7F3]">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Khối 9</span>
              <span className="text-xl font-bold text-[#1C6DD0] mt-1 block">{students.filter(s => s.grade === 9).length} em</span>
            </div>
          </div>

          {/* Controls: Search & Filters */}
          <div className="flex flex-col gap-3 rounded-xl border border-[#DCE7F3] bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput 
              placeholder="Tìm theo Mã HS, Tên, SĐT, Email..."
              value={studentSearch}
              onSearchChange={setStudentSearch}
            />

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-[#718096]">Lọc Khối:</span>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="h-9 rounded-lg border border-[#DCE7F3] bg-white px-3 text-xs text-[#2D3748] focus:border-[#2F80ED] font-medium"
              >
                <option value="ALL">Tất cả khối (6-9)</option>
                <option value="6">Khối 6</option>
                <option value="7">Khối 7</option>
                <option value="8">Khối 8</option>
                <option value="9">Khối 9</option>
              </select>

              <span className="text-xs font-bold text-[#718096] ml-2">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-[#DCE7F3] bg-white px-3 text-xs text-[#2D3748] focus:border-[#2F80ED] font-medium"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang học (ACTIVE)</option>
                <option value="INACTIVE">Tạm ngừng (INACTIVE)</option>
                <option value="TRANSFERRED">Chuyển trường</option>
                <option value="GRADUATED">Đã tốt nghiệp</option>
              </select>
            </div>
          </div>

          {/* Student High-Density ERP Table */}
          <div className="rounded-xl border border-[#DCE7F3] bg-white overflow-hidden shadow-xs">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-[#718096]">
                <AlertCircle className="h-8 w-8 mx-auto text-[#94A3B8] mb-2" />
                <p className="font-bold text-sm">Không tìm thấy học sinh phù hợp.</p>
                <p className="text-xs text-[#94A3B8] mt-1">Thử thay đổi từ khóa hoặc bộ lọc khối/trạng thái.</p>
              </div>
            ) : (
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] h-10">
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Mã HS</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Họ tên học sinh</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Khối / Lớp</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Phụ huynh đại diện</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Số điện thoại</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Trạng thái</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s) => {
                    const statusObj = formatStudentStatus(s.status);
                    const pDoc = parents.find(p => p.id === s.parentId || s.parentIds?.includes(p.id));

                    return (
                      <tr key={s.id} className="border-b border-[#EDF2F7] hover:bg-[#F7FAFC] transition-colors h-12">
                        <td className="p-3 font-mono text-xs font-bold text-[#2D3748]">{s.id}</td>
                        <td className="p-3 text-xs font-bold text-[#2D3748]">
                          <div className="flex items-center space-x-2">
                            <div className="h-7 w-7 rounded-full bg-[#EAF4FF] text-[#1C6DD0] font-bold text-xs flex items-center justify-center">
                              {s.name.charAt(0)}
                            </div>
                            <div>
                              <span>{s.name}</span>
                              {s.userId && (
                                <span className="ml-1.5 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold">
                                  Account Linked
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-xs text-[#2D3748]">
                          <span className="font-bold text-[#1C6DD0]">Khối {s.grade}</span>
                          <span className="text-[#718096] ml-1">({s.className || `Lớp ${s.grade}A1`})</span>
                        </td>
                        <td className="p-3 text-xs text-[#2D3748]">
                          {pDoc ? (
                            <span className="font-medium text-[#2D3748]">{pDoc.name} ({pDoc.phone})</span>
                          ) : s.parentName ? (
                            <span className="font-medium text-[#2D3748]">{s.parentName}</span>
                          ) : (
                            <span className="text-[#94A3B8] italic">Chưa liên kết</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-xs text-[#718096]">{s.phone || 'N/A'}</td>
                        <td className="p-3 text-xs">
                          <Badge status={statusObj.status}>{statusObj.text}</Badge>
                        </td>
                        <td className="p-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1">
                            <Button 
                              variant="soft" 
                              size="sm" 
                              title="Xem chi tiết"
                              onClick={() => {
                                setSelectedStudent(s);
                                setIsDetailStudentOpen(true);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            {isWritable && (
                              <>
                                {!s.userId ? (
                                  <Button 
                                    variant="soft" 
                                    size="sm" 
                                    title="Cấp tài khoản hệ thống"
                                    onClick={() => handleGrantUserAccount(s.id, 'STUDENT')}
                                  >
                                    <Key className="h-3.5 w-3.5 text-amber-600" />
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="soft" 
                                    size="sm" 
                                    title="Đặt lại mật khẩu"
                                    onClick={() => handleResetUserPassword(s.id, 'STUDENT')}
                                  >
                                    <RefreshCw className="h-3.5 w-3.5 text-amber-600" />
                                  </Button>
                                )}

                                <Button 
                                  variant="soft" 
                                  size="sm" 
                                  title="Chỉnh sửa"
                                  onClick={() => handleOpenEditStudent(s)}
                                >
                                  <Edit2 className="h-3.5 w-3.5 text-[#1C6DD0]" />
                                </Button>

                                <Button 
                                  variant="soft" 
                                  size="sm" 
                                  title="Liên kết phụ huynh"
                                  onClick={() => handleOpenLinkModal(s.id)}
                                >
                                  <Link className="h-3.5 w-3.5 text-indigo-600" />
                                </Button>

                                <Button 
                                  variant="soft" 
                                  size="sm" 
                                  title={s.status === 'ACTIVE' || s.status === 'Đang học' ? 'Khóa/Ngừng học' : 'Kích hoạt lại'}
                                  onClick={() => handleToggleStudentStatus(s)}
                                >
                                  {s.status === 'ACTIVE' || s.status === 'Đang học' ? (
                                    <UserX className="h-3.5 w-3.5 text-rose-600" />
                                  ) : (
                                    <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW SUBTAB: PARENTS */}
      {/* ========================================================================= */}
      {activeSubTab === 'parents' && (
        <div className="space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="bg-white p-3.5 rounded-xl border border-[#DCE7F3]">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Tổng số phụ huynh</span>
              <span className="text-xl font-bold text-[#2D3748] mt-1 block">{parents.length} người</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-[#DCE7F3]">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Có nhiều con theo học</span>
              <span className="text-xl font-bold text-indigo-600 mt-1 block">
                {parents.filter(p => (p.studentIds?.length || p.childIds?.length || 0) > 1).length} phụ huynh
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-[#DCE7F3]">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Tài khoản active</span>
              <span className="text-xl font-bold text-emerald-600 mt-1 block">
                {parents.filter(p => p.status === 'ACTIVE' || p.status === 'Đang hoạt động').length} phụ huynh
              </span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-[#DCE7F3]">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Đã cấp User Auth</span>
              <span className="text-xl font-bold text-[#1C6DD0] mt-1 block">
                {parents.filter(p => p.userId).length} tài khoản
              </span>
            </div>
          </div>

          {/* Controls: Search */}
          <div className="flex flex-col gap-3 rounded-xl border border-[#DCE7F3] bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput 
              placeholder="Tìm theo Mã PH, Họ tên, SĐT, Email..."
              value={parentSearch}
              onSearchChange={setParentSearch}
            />
          </div>

          {/* Parent High-Density ERP Table */}
          <div className="rounded-xl border border-[#DCE7F3] bg-white overflow-hidden shadow-xs">
            {filteredParents.length === 0 ? (
              <div className="p-8 text-center text-[#718096]">
                <AlertCircle className="h-8 w-8 mx-auto text-[#94A3B8] mb-2" />
                <p className="font-bold text-sm">Không tìm thấy phụ huynh phù hợp.</p>
              </div>
            ) : (
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] h-10">
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Mã PH</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Họ tên phụ huynh</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Quan hệ</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Số điện thoại</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Email</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Số con theo học</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Trạng thái</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParents.map((p) => {
                    const childIds = p.studentIds || p.childIds || [];
                    const childrenList = students.filter(s => childIds.includes(s.id) || s.parentId === p.id);

                    return (
                      <tr key={p.id} className="border-b border-[#EDF2F7] hover:bg-[#F7FAFC] transition-colors h-12">
                        <td className="p-3 font-mono text-xs font-bold text-[#2D3748]">{p.id}</td>
                        <td className="p-3 text-xs font-bold text-[#2D3748]">
                          <div className="flex items-center space-x-2">
                            <div className="h-7 w-7 rounded-full bg-purple-50 text-purple-700 font-bold text-xs flex items-center justify-center">
                              {p.name.charAt(0)}
                            </div>
                            <div>
                              <span>{p.name}</span>
                              {p.userId && (
                                <span className="ml-1.5 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold">
                                  Auth
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-xs font-medium text-[#2D3748]">
                          {p.relationship === 'CHA' ? 'Cha' : p.relationship === 'ME' ? 'Mẹ' : p.relationship || 'Phụ huynh'}
                        </td>
                        <td className="p-3 font-mono text-xs text-[#718096]">{p.phone}</td>
                        <td className="p-3 text-xs text-[#718096]">{p.email}</td>
                        <td className="p-3 text-xs">
                          <span className="font-bold text-[#1C6DD0]">{childrenList.length} học sinh</span>
                        </td>
                        <td className="p-3 text-xs">
                          <Badge status={p.status === 'ACTIVE' || p.status === 'Đang hoạt động' ? 'Low' : 'High'}>
                            {p.status === 'ACTIVE' || p.status === 'Đang hoạt động' ? 'Đang hoạt động' : 'Tạm ngừng'}
                          </Badge>
                        </td>
                        <td className="p-2 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1">
                            <Button 
                              variant="soft" 
                              size="sm" 
                              title="Xem chi tiết & danh sách con"
                              onClick={() => {
                                setSelectedParent(p);
                                setIsDetailParentOpen(true);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            {isWritable && (
                              !p.userId ? (
                                <Button 
                                  variant="soft" 
                                  size="sm" 
                                  title="Cấp tài khoản hệ thống"
                                  onClick={() => handleGrantUserAccount(p.id, 'PARENT')}
                                >
                                  <Key className="h-3.5 w-3.5 text-amber-600" />
                                </Button>
                              ) : (
                                <Button 
                                  variant="soft" 
                                  size="sm" 
                                  title="Đặt lại mật khẩu"
                                  onClick={() => handleResetUserPassword(p.id, 'PARENT')}
                                >
                                  <RefreshCw className="h-3.5 w-3.5 text-amber-600" />
                                </Button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: STUDENT DETAIL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDetailStudentOpen}
        onClose={() => setIsDetailStudentOpen(false)}
        title={`Chi tiết Học sinh: ${selectedStudent?.name || ''}`}
        size="lg"
      >
        {selectedStudent && (
          <div className="space-y-5 text-xs text-[#2D3748]">
            {/* Header Identity Block */}
            <div className="flex items-center justify-between p-4 bg-[#F7FAFC] rounded-xl border border-[#DCE7F3]">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-[#2F80ED] text-white font-extrabold text-lg flex items-center justify-center">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#2D3748]">{selectedStudent.name}</h3>
                  <p className="text-[#718096] font-mono">Mã HS: {selectedStudent.id} • Khối {selectedStudent.grade}</p>
                </div>
              </div>
              <Badge status={formatStudentStatus(selectedStudent.status).status}>
                {formatStudentStatus(selectedStudent.status).text}
              </Badge>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 p-3 bg-white border border-[#DCE7F3] rounded-lg">
                <p className="font-bold text-[11px] text-[#94A3B8] uppercase">Thông tin cá nhân</p>
                <p><span className="text-[#718096]">Ngày sinh:</span> <span className="font-semibold">{selectedStudent.dateOfBirth || 'Chưa cập nhật'}</span></p>
                <p><span className="text-[#718096]">Giới tính:</span> <span className="font-semibold">{selectedStudent.gender || 'Nam'}</span></p>
                <p><span className="text-[#718096]">Số điện thoại:</span> <span className="font-semibold">{selectedStudent.phone || 'N/A'}</span></p>
                <p><span className="text-[#718096]">Email:</span> <span className="font-semibold">{selectedStudent.email || 'N/A'}</span></p>
                <p><span className="text-[#718096]">Địa chỉ:</span> <span className="font-semibold">{selectedStudent.address || 'Chưa có'}</span></p>
              </div>

              <div className="space-y-2 p-3 bg-white border border-[#DCE7F3] rounded-lg">
                <p className="font-bold text-[11px] text-[#94A3B8] uppercase">Tài khoản & Học vụ</p>
                <p><span className="text-[#718096]">Khối lớp THCS:</span> <span className="font-bold text-[#1C6DD0]">Khối {selectedStudent.grade}</span></p>
                <p><span className="text-[#718096]">Lớp học:</span> <span className="font-semibold">{selectedStudent.className || `Lớp ${selectedStudent.grade}A1`}</span></p>
                <p><span className="text-[#718096]">GPA học tập:</span> <span className="font-bold">{selectedStudent.gpa} / 10</span></p>
                <p><span className="text-[#718096]">Tỷ lệ chuyên cần:</span> <span className="font-semibold text-emerald-600">{selectedStudent.attendanceRate}%</span></p>
                <p><span className="text-[#718096]">User Auth UID:</span> <span className="font-mono text-[10px] text-[#718096]">{selectedStudent.userId || 'Chưa cấp tài khoản'}</span></p>
              </div>
            </div>

            {/* Linked Parent Information */}
            <div className="p-3 bg-[#F7FAFC] border border-[#DCE7F3] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-[11px] text-[#94A3B8] uppercase">Phụ huynh liên kết</p>
                {isWritable && (
                  <Button variant="soft" size="sm" onClick={() => { setIsDetailStudentOpen(false); handleOpenLinkModal(selectedStudent.id); }}>
                    <Plus className="h-3 w-3 mr-1" /> Thêm phụ huynh
                  </Button>
                )}
              </div>

              {selectedStudent.parentIds && selectedStudent.parentIds.length > 0 ? (
                <div className="space-y-2">
                  {selectedStudent.parentIds.map(pid => {
                    const pDoc = parents.find(p => p.id === pid);
                    return (
                      <div key={pid} className="flex items-center justify-between p-2 bg-white rounded border border-[#DCE7F3]">
                        <div>
                          <p className="font-bold text-[#2D3748]">{pDoc ? pDoc.name : pid}</p>
                          <p className="text-[10px] text-[#718096]">{pDoc ? `${pDoc.relationship || 'Phụ huynh'} • SĐT: ${pDoc.phone}` : ''}</p>
                        </div>
                        {isWritable && (
                          <Button variant="soft" size="sm" onClick={() => handleUnlinkParentStudent(selectedStudent.id, pid)}>
                            <Unlink className="h-3 w-3 text-rose-600" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : selectedStudent.parentName ? (
                <p className="font-medium">{selectedStudent.parentName}</p>
              ) : (
                <p className="text-[#94A3B8] italic">Chưa liên kết hồ sơ phụ huynh.</p>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#DCE7F3]">
              {isWritable && (
                !selectedStudent.userId ? (
                  <Button variant="soft" size="sm" onClick={() => { setIsDetailStudentOpen(false); handleGrantUserAccount(selectedStudent.id, 'STUDENT'); }}>
                    <Key className="h-3.5 w-3.5 mr-1 text-amber-600" /> Cấp tài khoản học sinh
                  </Button>
                ) : (
                  <Button variant="soft" size="sm" onClick={() => { setIsDetailStudentOpen(false); handleResetUserPassword(selectedStudent.id, 'STUDENT'); }}>
                    <RefreshCw className="h-3.5 w-3.5 mr-1 text-amber-600" /> Đặt lại mật khẩu
                  </Button>
                )
              )}
              <Button variant="secondary" size="sm" onClick={() => setIsDetailStudentOpen(false)} className="ml-auto">
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: CREATE STUDENT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateStudentOpen}
        onClose={() => setIsCreateStudentOpen(false)}
        title="Thêm Hồ Sơ Học Sinh Mới"
        size="md"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#2D3748] mb-1">Họ và tên học sinh *</label>
            <input 
              type="text" 
              required
              placeholder="VD: Nguyễn Văn Minh"
              value={newStudent.name}
              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
              className="w-full h-9 px-3 border border-[#DCE7F3] rounded-lg focus:border-[#2F80ED]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2D3748] mb-1">Ngày sinh *</label>
              <input 
                type="date" 
                required
                value={newStudent.dateOfBirth}
                onChange={(e) => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })}
                className="w-full h-9 px-3 border border-[#DCE7F3] rounded-lg focus:border-[#2F80ED]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#2D3748] mb-1">Giới tính</label>
              <select
                value={newStudent.gender}
                onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value as any })}
                className="w-full h-9 px-3 border border-[#DCE7F3] rounded-lg focus:border-[#2F80ED]"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2D3748] mb-1">Khối lớp (THCS 6-9) *</label>
              <select
                value={newStudent.grade}
                onChange={(e) => setNewStudent({ ...newStudent, grade: Number(e.target.value) })}
                className="w-full h-9 px-3 border border-[#DCE7F3] rounded-lg focus:border-[#2F80ED] font-bold text-[#1C6DD0]"
              >
                <option value={6}>Khối 6</option>
                <option value={7}>Khối 7</option>
                <option value={8}>Khối 8</option>
                <option value={9}>Khối 9</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#2D3748] mb-1">Trạng thái</label>
              <select
                value={newStudent.status}
                onChange={(e) => setNewStudent({ ...newStudent, status: e.target.value as any })}
                className="w-full h-9 px-3 border border-[#DCE7F3] rounded-lg focus:border-[#2F80ED]"
              >
                <option value="ACTIVE">Đang học (ACTIVE)</option>
                <option value="INACTIVE">Tạm ngừng (INACTIVE)</option>
                <option value="TRANSFERRED">Chuyển trường</option>
                <option value="GRADUATED">Đã tốt nghiệp</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2D3748] mb-1">Số điện thoại</label>
              <input 
                type="text" 
                placeholder="VD: 0985123456"
                value={newStudent.phone}
                onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                className="w-full h-9 px-3 border border-[#DCE7F3] rounded-lg focus:border-[#2F80ED]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#2D3748] mb-1">Email</label>
              <input 
                type="email" 
                placeholder="VD: minhnv@smartedu.vn"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                className="w-full h-9 px-3 border border-[#DCE7F3] rounded-lg focus:border-[#2F80ED]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#2D3748] mb-1">Phụ huynh liên kết (Tùy chọn)</label>
            <select
              value={newStudent.parentId}
              onChange={(e) => setNewStudent({ ...newStudent, parentId: e.target.value })}
              className="w-full h-9 px-3 border border-[#DCE7F3] rounded-lg focus:border-[#2F80ED]"
            >
              <option value="">-- Chưa liên kết (Thêm sau) --</option>
              {parents.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#DCE7F3]">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsCreateStudentOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              <Check className="h-4 w-4 mr-1" /> Lưu học sinh
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: EDIT STUDENT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditStudentOpen}
        onClose={() => setIsEditStudentOpen(false)}
        title={`Chỉnh Sửa Học Sinh: ${selectedStudent?.name || ''}`}
        size="md"
      >
        <form onSubmit={handleUpdateStudent} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#2D3748] mb-1">Họ và tên học sinh *</label>
            <input 
              type="text" 
              required
              value={editingStudent.name || ''}
              onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
              className="w-full h-9 px-3 border border-[#DCE7F3] rounded-lg focus:border-[#2F80ED]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2D3748] mb-1">Ngày sinh</label>
              <input 
                type="date" 
                value={editingStudent.dateOfBirth || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, dateOfBirth: e.target.value })}
                className="w-full h-9 px-3 border border-[#DCE7F3] rounded-lg focus:border-[#2F80ED]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#2D3748] mb-1">Khối lớp (THCS 6-9)</label>
              <select
                value={editingStudent.grade || 6}
                onChange={(e) => setEditingStudent({ ...editingStudent, grade: Number(e.target.value) })}
                className="w-full h-9 px-3 border border-[#DCE7F3] rounded-lg focus:border-[#2F80ED] font-bold text-[#1C6DD0]"
              >
                <option value={6}>Khối 6</option>
                <option value={7}>Khối 7</option>
                <option value={8}>Khối 8</option>
                <option value={9}>Khối 9</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2D3748] mb-1">Số điện thoại</label>
              <input 
                type="text" 
                value={editingStudent.phone || ''}
                onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                className="w-full h-9 px-3 border border-[#DCE7F3] rounded-lg focus:border-[#2F80ED]"
              />
            </div>
            <div>
              <label className="block font-bold text-[#2D3748] mb-1">Trạng thái học tập</label>
              <select
                value={editingStudent.status || 'ACTIVE'}
                onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value })}
                className="w-full h-9 px-3 border border-[#DCE7F3] rounded-lg focus:border-[#2F80ED]"
              >
                <option value="ACTIVE">Đang học (ACTIVE)</option>
                <option value="INACTIVE">Tạm ngừng (INACTIVE)</option>
                <option value="TRANSFERRED">Chuyển trường</option>
                <option value="GRADUATED">Đã tốt nghiệp</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#DCE7F3]">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsEditStudentOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              <Check className="h-4 w-4 mr-1" /> Cập nhật
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: CREATE PARENT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateParentOpen}
        onClose={() => setIsCreateParentOpen(false)}
        title="Thêm Hồ Sơ Phụ Huynh Mới"
        size="md"
      >
        <form onSubmit={handleCreateParent} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[#2D3748] mb-1">Họ và tên phụ huynh *</label>
            <input 
              type="text" 
              required
              placeholder="VD: Nguyễn Văn Hùng"
              value={newParent.name}
              onChange={(e) => setNewParent({ ...newParent, name: e.target.value })}
              className="w-full h-9 px-3 border border-[#DCE7F3] rounded-lg focus:border-[#2F80ED]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[#2D3748] mb-1">Quan hệ với học sinh *</label>
              <select
                value={newParent.relationship}
                onChange={(e) => setNewParent({ ...newParent, relationship: e.target.value as any })}
                className="w-full h-9 px-3 border border-[#DCE7F3] rounded-lg focus:border-[#2F80ED]"
              >
                <option value="Cha">Cha</option>
                <option value="Mẹ">Mẹ</option>
                <option value="Người giám hộ">Người giám hộ</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-[#2D3748] mb-1">Số điện thoại *</label>
              <input 
                type="text" 
                required
                placeholder="VD: 0937123456"
                value={newParent.phone}
                onChange={(e) => setNewParent({ ...newParent, phone: e.target.value })}
                className="w-full h-9 px-3 border border-[#DCE7F3] rounded-lg focus:border-[#2F80ED]"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[#2D3748] mb-1">Email liên hệ</label>
            <input 
              type="email" 
              placeholder="VD: parent@gmail.com"
              value={newParent.email}
              onChange={(e) => setNewParent({ ...newParent, email: e.target.value })}
              className="w-full h-9 px-3 border border-[#DCE7F3] rounded-lg focus:border-[#2F80ED]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#2D3748] mb-1">Chọn con theo học (Có thể chọn nhiều)</label>
            <div className="max-h-36 overflow-y-auto border border-[#DCE7F3] rounded-lg p-2 space-y-1 bg-[#F7FAFC]">
              {students.map(s => {
                const isSelected = newParent.studentIds.includes(s.id);
                return (
                  <label key={s.id} className="flex items-center space-x-2 text-xs hover:bg-white p-1 rounded cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewParent({ ...newParent, studentIds: [...newParent.studentIds, s.id] });
                        } else {
                          setNewParent({ ...newParent, studentIds: newParent.studentIds.filter(id => id !== s.id) });
                        }
                      }}
                      className="rounded border-[#DCE7F3]"
                    />
                    <span className="font-bold text-[#2D3748]">{s.name}</span>
                    <span className="text-[#718096]">({s.id} • Khối {s.grade})</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#DCE7F3]">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsCreateParentOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              <Check className="h-4 w-4 mr-1" /> Lưu phụ huynh
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: LINK PARENT ↔ STUDENT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        title="Liên Kết Phụ Huynh ↔ Học Sinh"
        size="sm"
      >
        <form onSubmit={handlePerformLinkParentStudent} className="space-y-4 text-xs">
          <div>
            <p className="text-[#718096] mb-2">
              Học sinh đang chọn: <strong className="text-[#2D3748]">{students.find(s => s.id === linkingStudentId)?.name}</strong> ({linkingStudentId})
            </p>
            <label className="block font-bold text-[#2D3748] mb-1">Chọn Phụ Huynh trong hệ thống *</label>
            <select
              required
              value={selectedParentIdToLink}
              onChange={(e) => setSelectedParentIdToLink(e.target.value)}
              className="w-full h-9 px-3 border border-[#DCE7F3] rounded-lg focus:border-[#2F80ED]"
            >
              <option value="">-- Chọn phụ huynh --</option>
              {parents.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.relationship || 'Phụ huynh'} • SĐT: {p.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#DCE7F3]">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsLinkModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              <Link className="h-4 w-4 mr-1" /> Xác nhận liên kết
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: PARENT DETAIL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDetailParentOpen}
        onClose={() => setIsDetailParentOpen(false)}
        title={`Chi tiết Phụ huynh: ${selectedParent?.name || ''}`}
        size="md"
      >
        {selectedParent && (
          <div className="space-y-4 text-xs text-[#2D3748]">
            <div className="p-3 bg-[#F7FAFC] rounded-lg border border-[#DCE7F3]">
              <h4 className="font-bold text-sm text-[#2D3748]">{selectedParent.name}</h4>
              <p className="text-[#718096]">Mã PH: {selectedParent.id} • Quan hệ: {selectedParent.relationship || 'Phụ huynh'}</p>
              <p className="text-[#718096]">SĐT: {selectedParent.phone} • Email: {selectedParent.email}</p>
            </div>

            <div>
              <h5 className="font-bold text-xs uppercase text-[#94A3B8] mb-2">Danh sách con theo học ({
                students.filter(s => (selectedParent.studentIds || selectedParent.childIds || []).includes(s.id) || s.parentId === selectedParent.id).length
              })</h5>

              <div className="space-y-2">
                {students
                  .filter(s => (selectedParent.studentIds || selectedParent.childIds || []).includes(s.id) || s.parentId === selectedParent.id)
                  .map(child => (
                    <div key={child.id} className="p-3 bg-white border border-[#DCE7F3] rounded-lg flex items-center justify-between">
                      <div>
                        <p className="font-bold text-[#2D3748]">{child.name} ({child.id})</p>
                        <p className="text-[11px] text-[#718096]">Khối {child.grade} • Lớp {child.className || `${child.grade}A1`}</p>
                      </div>
                      <Button 
                        variant="soft" 
                        size="sm"
                        onClick={() => {
                          setIsDetailParentOpen(false);
                          setSelectedStudent(child);
                          setIsDetailStudentOpen(true);
                        }}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> Profile con
                      </Button>
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#DCE7F3]">
              {isWritable && (
                !selectedParent.userId ? (
                  <Button 
                    variant="soft" 
                    size="sm" 
                    onClick={() => { setIsDetailParentOpen(false); handleGrantUserAccount(selectedParent.id, 'PARENT'); }}
                  >
                    <Key className="h-3.5 w-3.5 mr-1 text-amber-600" /> Cấp tài khoản phụ huynh
                  </Button>
                ) : (
                  <Button 
                    variant="soft" 
                    size="sm" 
                    onClick={() => { setIsDetailParentOpen(false); handleResetUserPassword(selectedParent.id, 'PARENT'); }}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1 text-amber-600" /> Đặt lại mật khẩu
                  </Button>
                )
              )}
              <Button variant="secondary" size="sm" onClick={() => setIsDetailParentOpen(false)} className="ml-auto">
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* SINGLE-USE CREDENTIALS DISPLAY MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={credentialsModal?.isOpen || false}
        onClose={() => setCredentialsModal(null)}
        title={credentialsModal?.isReset ? 'ĐẶT LẠI MẬT KHẨU THÀNH CÔNG' : 'CẤP TÀI KHOẢN THÀNH CÔNG'}
        size="md"
      >
        {credentialsModal && (
          <div className="space-y-4 text-xs text-[#2D3748]">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800">
              <p className="font-bold text-sm">
                ✓ {credentialsModal.isReset ? 'Đã đặt lại mật khẩu thành công!' : 'Đã tạo tài khoản thành công!'}
              </p>
              <p className="mt-0.5 text-[11px] text-emerald-700">
                Tài khoản cho người dùng <strong>{credentialsModal.name}</strong> ({credentialsModal.role}) đã được cập nhật.
              </p>
            </div>

            <div className="space-y-3 p-4 bg-[#F7FAFC] border border-[#DCE7F3] rounded-xl font-mono">
              <div>
                <span className="text-[#718096] text-[10px] uppercase font-sans font-bold block mb-1">Tài khoản:</span>
                <span className="font-bold text-sm text-[#2D3748] font-sans">{credentialsModal.name}</span>
              </div>

              <div>
                <span className="text-[#718096] text-[10px] uppercase font-sans font-bold block mb-1">Tên đăng nhập:</span>
                <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#DCE7F3]">
                  <span className="font-bold text-sm text-[#1C6DD0]">{credentialsModal.username}</span>
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(credentialsModal.username);
                      onRaiseToast('✓ Đã sao chép tên đăng nhập!', 'success');
                    }}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" /> Sao chép tên đăng nhập
                  </Button>
                </div>
              </div>

              <div>
                <span className="text-[#718096] text-[10px] uppercase font-sans font-bold block mb-1">Mật khẩu tạm thời:</span>
                <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#DCE7F3]">
                  <span className="font-bold text-sm text-rose-600 tracking-wider">{credentialsModal.tempPass}</span>
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(credentialsModal.tempPass);
                      onRaiseToast('✓ Đã sao chép mật khẩu!', 'success');
                    }}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" /> Sao chép mật khẩu
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] space-y-1">
              <p className="font-bold flex items-center">
                <AlertCircle className="h-4 w-4 text-amber-600 mr-1.5 shrink-0" /> Vui lòng cung cấp thông tin này cho người dùng.
              </p>
              <p className="pl-5 text-amber-700">
                Mật khẩu tạm thời chỉ hiển thị trong lần này. Người dùng sẽ phải đổi mật khẩu khi đăng nhập lần đầu.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#DCE7F3]">
              <Button variant="primary" size="sm" onClick={() => setCredentialsModal(null)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

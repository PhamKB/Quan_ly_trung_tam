import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  ArrowRightLeft, 
  History, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  GraduationCap, 
  School, 
  Clock, 
  MapPin, 
  Calendar, 
  UserCheck, 
  AlertTriangle,
  FileText,
  X,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { 
  Class, 
  ClassEnrollment, 
  Student, 
  Role, 
  User 
} from '../types';
import { 
  calculateClassCurrentSize, 
  validateGrade, 
  validateCapacity, 
  validateAcademicYear, 
  validateClassCodeUniqueness, 
  validateClassEditCapacity, 
  validateEnrollmentEligibility, 
  validateTransferEligibility, 
  getStudentEnrollmentHistory, 
  canManageClasses, 
  executeClassTransfer, 
  executeEnrollStudent, 
  TRANSFER_REASONS,
  DEFAULT_CAPACITY,
  DEFAULT_ACADEMIC_YEAR,
  VALID_GRADES
} from '../lib/classEnrollmentService';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ClassManagementProps {
  classes: Class[];
  setClasses: React.Dispatch<React.SetStateAction<Class[]>>;
  enrollments: ClassEnrollment[];
  setEnrollments: React.Dispatch<React.SetStateAction<ClassEnrollment[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  currentUser: any;
  userProfile: User | null;
  currentRole: Role;
  triggerToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  logAuditEvent: (
    actorName: string,
    userId: string,
    action: string,
    target: string,
    status: 'Success' | 'Warning' | 'Critical',
    details: string
  ) => Promise<void>;
}

export const ClassManagement: React.FC<ClassManagementProps> = ({
  classes,
  setClasses,
  enrollments,
  setEnrollments,
  students,
  setStudents,
  currentUser,
  userProfile,
  currentRole,
  triggerToast,
  logAuditEvent,
}) => {
  const isManager = canManageClasses(currentRole);

  // Filters and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [yearFilter, setYearFilter] = useState<string>(DEFAULT_ACADEMIC_YEAR);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isClassDetailOpen, setIsClassDetailOpen] = useState(false);
  
  // Create / Edit Class
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  
  const [classForm, setClassForm] = useState({
    classCode: '',
    className: '',
    grade: 6,
    academicYear: DEFAULT_ACADEMIC_YEAR,
    capacity: DEFAULT_CAPACITY,
    room: 'Phòng 101',
    schedule: 'Thứ 2 - Thứ 4 - Thứ 6 · 08:00',
    teacher: 'Trần Quốc Việt',
    status: 'Đang hoạt động' as Class['status'],
  });

  // Transfer Modal State
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferStudent, setTransferStudent] = useState<Student | null>(null);
  const [transferFromClass, setTransferFromClass] = useState<Class | null>(null);
  const [targetClassId, setTargetClassId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>(TRANSFER_REASONS[0]);
  const [transferNote, setTransferNote] = useState<string>('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Enroll Student Modal State
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [enrollStudentId, setEnrollStudentId] = useState<string>('');
  const [isSubmittingEnroll, setIsSubmittingEnroll] = useState(false);

  // History Modal State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null);

  // Calculated Class Sĩ Số Map
  const classSizeMap = useMemo(() => {
    const map: Record<string, number> = {};
    classes.forEach((c) => {
      map[c.id] = calculateClassCurrentSize(c.id, c.academicYear || DEFAULT_ACADEMIC_YEAR, enrollments);
    });
    return map;
  }, [classes, enrollments]);

  // Filtered Classes
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      const matchesSearch = 
        (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.classCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.room || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.teacher || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesGrade = gradeFilter === 'ALL' || c.grade === Number(gradeFilter);
      const matchesYear = yearFilter === 'ALL' || (c.academicYear || DEFAULT_ACADEMIC_YEAR) === yearFilter;
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter || 
        (statusFilter === 'ACTIVE' && (c.status === 'ACTIVE' || c.status === 'Đang hoạt động'));

      return matchesSearch && matchesGrade && matchesYear && matchesStatus;
    });
  }, [classes, searchTerm, gradeFilter, yearFilter, statusFilter]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalClasses = classes.length;
    const totalActiveEnrollments = enrollments.filter(
      (e) => (e.status === 'ACTIVE' || e.status === 'Đang học') && (e.academicYear === yearFilter || yearFilter === 'ALL')
    ).length;
    const totalCapacity = classes.reduce((sum, c) => sum + (c.capacity || DEFAULT_CAPACITY), 0);
    const totalTransfers = enrollments.filter((e) => e.status === 'TRANSFERRED' || e.status === 'Đã chuyển lớp').length;
    const fillRate = totalCapacity > 0 ? Math.round((totalActiveEnrollments / totalCapacity) * 100) : 0;

    return { totalClasses, totalActiveEnrollments, totalCapacity, totalTransfers, fillRate };
  }, [classes, enrollments, yearFilter]);

  // Eligible students for enrollment into selected class
  const eligibleStudentsForEnrollment = useMemo(() => {
    if (!selectedClass) return [];
    return students.filter((s) => {
      // Must be same grade
      if (Number(s.grade) !== Number(selectedClass.grade)) return false;
      // Must not have an active enrollment in this academic year
      const hasActive = enrollments.some(
        (e) => e.studentId === s.id && 
               e.academicYear === (selectedClass.academicYear || DEFAULT_ACADEMIC_YEAR) &&
               (e.status === 'ACTIVE' || e.status === 'Đang học')
      );
      return !hasActive;
    });
  }, [students, selectedClass, enrollments]);

  // Eligible destination classes for transfer
  const eligibleDestinationClasses = useMemo(() => {
    if (!transferStudent || !transferFromClass) return [];
    return classes.filter((c) => {
      if (c.id === transferFromClass.id) return false;
      if (Number(c.grade) !== Number(transferStudent.grade)) return false;
      if ((c.academicYear || DEFAULT_ACADEMIC_YEAR) !== (transferFromClass.academicYear || DEFAULT_ACADEMIC_YEAR)) return false;
      const isActive = c.status === 'ACTIVE' || c.status === 'Đang hoạt động';
      return isActive;
    });
  }, [classes, transferStudent, transferFromClass]);

  // Open Create Class Modal
  const handleOpenCreateClass = () => {
    if (!isManager) {
      triggerToast('Bạn không có quyền tạo lớp học mới.', 'error');
      return;
    }
    setClassForm({
      classCode: '',
      className: '',
      grade: 6,
      academicYear: DEFAULT_ACADEMIC_YEAR,
      capacity: DEFAULT_CAPACITY,
      room: 'Phòng 101',
      schedule: 'Thứ 2 - Thứ 4 - Thứ 6 · 08:00',
      teacher: 'Trần Quốc Việt',
      status: 'Đang hoạt động',
    });
    setIsCreateClassOpen(true);
  };

  // Open Edit Class Modal
  const handleOpenEditClass = (cls: Class) => {
    if (!isManager) {
      triggerToast('Bạn không có quyền chỉnh sửa lớp học.', 'error');
      return;
    }
    setEditingClass(cls);
    setClassForm({
      classCode: cls.classCode || cls.name,
      className: cls.className || cls.name,
      grade: cls.grade,
      academicYear: cls.academicYear || DEFAULT_ACADEMIC_YEAR,
      capacity: cls.capacity || DEFAULT_CAPACITY,
      room: cls.room || 'Phòng 101',
      schedule: cls.schedule || 'Thứ 2 - Thứ 4 - Thứ 6 · 08:00',
      teacher: cls.teacher || 'Trần Quốc Việt',
      status: cls.status,
    });
    setIsEditClassOpen(true);
  };

  // Handle Save Class (Create or Update)
  const handleSaveClass = async (isUpdate: boolean) => {
    if (!isManager) {
      triggerToast('Bạn không có quyền thực hiện thao tác này.', 'error');
      return;
    }

    // Validations
    const gradeCheck = validateGrade(classForm.grade);
    if (!gradeCheck.valid) {
      triggerToast(gradeCheck.error!, 'error');
      return;
    }

    const capCheck = validateCapacity(classForm.capacity);
    if (!capCheck.valid) {
      triggerToast(capCheck.error!, 'error');
      return;
    }

    const yearCheck = validateAcademicYear(classForm.academicYear);
    if (!yearCheck.valid) {
      triggerToast(yearCheck.error!, 'error');
      return;
    }

    if (!classForm.classCode.trim()) {
      triggerToast('Vui lòng nhập mã lớp (ví dụ: 6A1, 7A2).', 'error');
      return;
    }

    if (isUpdate && editingClass) {
      // Edit capacity validation
      const editCapCheck = validateClassEditCapacity(editingClass, classForm.capacity, enrollments);
      if (!editCapCheck.valid) {
        triggerToast(editCapCheck.error!, 'error');
        return;
      }

      // Check unique code excluding current class
      const codeCheck = validateClassCodeUniqueness(classForm.classCode, classForm.academicYear, classes, editingClass.id);
      if (!codeCheck.valid) {
        triggerToast(codeCheck.error!, 'error');
        return;
      }

      const updatedClass: Class = {
        ...editingClass,
        classCode: classForm.classCode.trim().toUpperCase(),
        className: classForm.className.trim() || `Lớp ${classForm.classCode.trim().toUpperCase()}`,
        name: classForm.className.trim() || `Lớp ${classForm.classCode.trim().toUpperCase()}`,
        grade: Number(classForm.grade),
        academicYear: classForm.academicYear.trim(),
        capacity: Number(classForm.capacity),
        room: classForm.room,
        schedule: classForm.schedule,
        teacher: classForm.teacher,
        status: classForm.status,
        updatedAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'classes', editingClass.id), updatedClass, { merge: true });
        setClasses(prev => prev.map(c => c.id === editingClass.id ? updatedClass : c));
        if (selectedClass?.id === editingClass.id) {
          setSelectedClass(updatedClass);
        }
        await logAuditEvent(
          userProfile?.name || currentUser?.email || 'Admin',
          currentUser?.uid || 'user_admin',
          'UPDATE_CLASS',
          `Lớp: ${updatedClass.name} (${updatedClass.id})`,
          'Success',
          `Cập nhật thông tin lớp học: Sức chứa ${updatedClass.capacity}, Phòng ${updatedClass.room}`
        );
        triggerToast('✓ Đã cập nhật thông tin lớp học thành công!', 'success');
        setIsEditClassOpen(false);
      } catch (err: any) {
        triggerToast('Lỗi khi lưu lớp học: ' + (err?.message || err), 'error');
      }
    } else {
      // Create new class
      const codeCheck = validateClassCodeUniqueness(classForm.classCode, classForm.academicYear, classes);
      if (!codeCheck.valid) {
        triggerToast(codeCheck.error!, 'error');
        return;
      }

      const newId = `class_${classForm.classCode.trim().toUpperCase()}`;
      const newClassItem: Class = {
        id: newId,
        classId: newId,
        classCode: classForm.classCode.trim().toUpperCase(),
        className: classForm.className.trim() || `Lớp ${classForm.classCode.trim().toUpperCase()}`,
        name: classForm.className.trim() || `Lớp ${classForm.classCode.trim().toUpperCase()}`,
        grade: Number(classForm.grade),
        academicYear: classForm.academicYear.trim(),
        capacity: Number(classForm.capacity),
        room: classForm.room,
        schedule: classForm.schedule,
        teacher: classForm.teacher,
        status: 'Đang hoạt động',
        course: `Khối ${classForm.grade} Toàn diện`,
        studentsCount: 0,
        averageGpa: 8.0,
        subject: 'Tổng hợp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(db, 'classes', newId), newClassItem);
        setClasses(prev => [...prev, newClassItem]);
        await logAuditEvent(
          userProfile?.name || currentUser?.email || 'Admin',
          currentUser?.uid || 'user_admin',
          'CREATE_CLASS',
          `Lớp: ${newClassItem.name} (${newClassItem.id})`,
          'Success',
          `Tạo mới lớp học ${newClassItem.name}, Khối ${newClassItem.grade}, Sức chứa ${newClassItem.capacity}`
        );
        triggerToast('✓ Đã tạo lớp học mới thành công!', 'success');
        setIsCreateClassOpen(false);
      } catch (err: any) {
        triggerToast('Lỗi khi tạo lớp học: ' + (err?.message || err), 'error');
      }
    }
  };

  // Soft Delete / Toggle Class Status
  const handleToggleClassStatus = async (cls: Class) => {
    if (!isManager) {
      triggerToast('Bạn không có quyền thay đổi trạng thái lớp học.', 'error');
      return;
    }
    const isCurrentlyActive = cls.status === 'ACTIVE' || cls.status === 'Đang hoạt động';
    const nextStatus: Class['status'] = isCurrentlyActive ? 'Tạm ngừng' : 'Đang hoạt động';

    try {
      await updateDoc(doc(db, 'classes', cls.id), {
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });
      setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, status: nextStatus } : c));
      if (selectedClass?.id === cls.id) {
        setSelectedClass({ ...selectedClass, status: nextStatus });
      }
      await logAuditEvent(
        userProfile?.name || currentUser?.email || 'Admin',
        currentUser?.uid || 'user_admin',
        'TOGGLE_CLASS_STATUS',
        `Lớp: ${cls.name} (${cls.id})`,
        'Success',
        `Chuyển trạng thái lớp sang: ${nextStatus}`
      );
      triggerToast(`✓ Đã chuyển trạng thái lớp sang "${nextStatus}".`, 'success');
    } catch (err: any) {
      triggerToast('Lỗi khi cập nhật trạng thái lớp: ' + (err?.message || err), 'error');
    }
  };

  // Open Transfer Modal for a Student
  const handleOpenTransfer = (student: Student, fromCls: Class) => {
    if (!isManager) {
      triggerToast('Chỉ Quản trị viên và Giáo vụ mới có quyền thực hiện chuyển lớp.', 'error');
      return;
    }
    setTransferStudent(student);
    setTransferFromClass(fromCls);
    setTargetClassId('');
    setTransferReason(TRANSFER_REASONS[0]);
    setTransferNote('');
    setIsTransferOpen(true);
  };

  // Submit Class Transfer (Atomic)
  const handleSubmitTransfer = async () => {
    if (!transferStudent || !transferFromClass || !targetClassId) {
      triggerToast('Vui lòng chọn lớp học đích cần chuyển đến.', 'error');
      return;
    }

    const targetClass = classes.find(c => c.id === targetClassId);
    if (!targetClass) {
      triggerToast('Không tìm thấy thông tin lớp đích.', 'error');
      return;
    }

    setIsSubmittingTransfer(true);
    const actor = {
      id: currentUser?.uid || 'user_admin',
      name: userProfile?.name || currentUser?.email || 'Giáo vụ',
      role: currentRole,
    };

    const result = await executeClassTransfer({
      student: transferStudent,
      fromClass: transferFromClass,
      toClass: targetClass,
      reason: transferReason,
      note: transferNote,
      actor,
      enrollments,
      onLocalUpdate: (nextEnrollments, updatedStudent) => {
        setEnrollments(nextEnrollments);
        setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      }
    });

    setIsSubmittingTransfer(false);

    if (result.success) {
      triggerToast(`✓ Đã chuyển học sinh ${transferStudent.name} sang [${targetClass.name}] thành công!`, 'success');
      setIsTransferOpen(false);
      // If we are in class detail modal, refresh selectedClass if needed
      if (selectedClass?.id === transferFromClass.id) {
        // Keep modal open, student list will auto re-render
      }
    } else {
      triggerToast(`❌ ${result.error}`, 'error');
    }
  };

  // Open Enroll Modal
  const handleOpenEnroll = () => {
    if (!isManager) {
      triggerToast('Bạn không có quyền ghi danh học sinh vào lớp.', 'error');
      return;
    }
    if (!selectedClass) return;
    const currentSize = classSizeMap[selectedClass.id] || 0;
    if (currentSize >= (selectedClass.capacity || DEFAULT_CAPACITY)) {
      triggerToast(`Lớp ${selectedClass.name} đã đủ sĩ số (${currentSize}/${selectedClass.capacity}). Không thể thêm học sinh.`, 'error');
      return;
    }
    setEnrollStudentId('');
    setIsEnrollOpen(true);
  };

  // Submit Direct Enrollment
  const handleSubmitEnroll = async () => {
    if (!selectedClass || !enrollStudentId) {
      triggerToast('Vui lòng chọn học sinh cần ghi danh.', 'error');
      return;
    }

    const student = students.find(s => s.id === enrollStudentId);
    if (!student) {
      triggerToast('Không tìm thấy thông tin học sinh.', 'error');
      return;
    }

    setIsSubmittingEnroll(true);
    const actor = {
      id: currentUser?.uid || 'user_admin',
      name: userProfile?.name || currentUser?.email || 'Giáo vụ',
      role: currentRole,
    };

    const result = await executeEnrollStudent({
      student,
      targetClass: selectedClass,
      actor,
      enrollments,
      onLocalUpdate: (nextEnrollments, updatedStudent) => {
        setEnrollments(nextEnrollments);
        setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      }
    });

    setIsSubmittingEnroll(false);

    if (result.success) {
      triggerToast(`✓ Đã ghi danh học sinh ${student.name} vào [${selectedClass.name}] thành công!`, 'success');
      setIsEnrollOpen(false);
    } else {
      triggerToast(`❌ ${result.error}`, 'error');
    }
  };

  // Open History Modal for Student
  const handleOpenHistory = (student: Student) => {
    setHistoryStudent(student);
    setIsHistoryOpen(true);
  };

  // Get active students for selected class in detail modal
  const selectedClassStudents = useMemo(() => {
    if (!selectedClass) return [];
    const activeEnrollmentStudentIds = enrollments
      .filter((e) => e.classId === selectedClass.id && 
                     e.academicYear === (selectedClass.academicYear || DEFAULT_ACADEMIC_YEAR) &&
                     (e.status === 'ACTIVE' || e.status === 'Đang học'))
      .map((e) => e.studentId);

    return students.filter((s) => activeEnrollmentStudentIds.includes(s.id));
  }, [selectedClass, enrollments, students]);

  return (
    <div className="space-y-6" id="class-management-module">
      {/* Top Banner / Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#DCE7F3] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#718096] mb-1 font-medium">
            <span>Học vụ</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-[#1C6DD0] font-semibold">Quản lý Lớp học & Enrollment</span>
          </div>
          <h1 className="text-2xl font-black text-[#1A202C] tracking-tight font-display">
            Danh Mục Lớp Học & Quản Trị Enrollment
          </h1>
          <p className="text-xs text-[#718096] mt-0.5 max-w-3xl leading-relaxed">
            Nguồn lịch sử chính thức từ <code className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-mono text-[11px]">classEnrollments</code>. Kiểm soát sĩ số tiêu chuẩn 18 học sinh/lớp, khối 6-9, chuyển lớp nguyên tử và bảo toàn lịch sử.
          </p>
        </div>

        {isManager && (
          <button
            id="btn-create-class"
            onClick={handleOpenCreateClass}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1C6DD0] hover:bg-[#1557A6] text-white text-xs font-bold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <Plus className="h-4 w-4" />
            + Tạo lớp học mới
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#DCE7F3] shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 text-[#1C6DD0] rounded-xl">
            <School className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#718096] uppercase tracking-wider">Tổng số lớp</div>
            <div className="text-xl font-black text-[#1A202C] font-display">{stats.totalClasses} <span className="text-xs font-normal text-[#718096]">lớp THCS</span></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DCE7F3] shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#718096] uppercase tracking-wider">Học sinh đang học</div>
            <div className="text-xl font-black text-[#1A202C] font-display">{stats.totalActiveEnrollments} <span className="text-xs font-normal text-[#718096]">/ {stats.totalCapacity} chỗ</span></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DCE7F3] shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#718096] uppercase tracking-wider">Tỷ lệ lấp đầy</div>
            <div className="text-xl font-black text-[#1A202C] font-display">{stats.fillRate}% <span className="text-xs font-normal text-emerald-600 font-semibold">Chuẩn 18/lớp</span></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DCE7F3] shadow-xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[#718096] uppercase tracking-wider">Lịch sử chuyển lớp</div>
            <div className="text-xl font-black text-[#1A202C] font-display">{stats.totalTransfers} <span className="text-xs font-normal text-[#718096]">lượt ghi nhận</span></div>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#DCE7F3] shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
            <input
              type="text"
              id="input-search-classes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên lớp, mã lớp, phòng học, giáo viên..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-[#F8FAFC]"
            />
          </div>

          {/* Grade Filter */}
          <div className="md:col-span-2">
            <select
              id="select-grade-filter"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-[#F8FAFC] font-medium text-[#2D3748]"
            >
              <option value="ALL">Tất cả Khối (6, 7, 8, 9)</option>
              <option value="6">Khối 6</option>
              <option value="7">Khối 7</option>
              <option value="8">Khối 8</option>
              <option value="9">Khối 9</option>
            </select>
          </div>

          {/* Academic Year Filter */}
          <div className="md:col-span-2">
            <select
              id="select-year-filter"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-[#F8FAFC] font-medium text-[#2D3748]"
            >
              <option value="ALL">Tất cả năm học</option>
              <option value="2026-2027">Năm học 2026-2027</option>
              <option value="2025-2026">Năm học 2025-2026</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-[#F8FAFC] font-medium text-[#2D3748]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="Tạm ngừng">Tạm ngừng</option>
              <option value="Đã kết thúc">Đã kết thúc</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="md:col-span-2 flex justify-end gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'grid' ? 'bg-[#1C6DD0] text-white shadow-xs' : 'bg-gray-100 text-[#718096] hover:bg-gray-200'
              }`}
            >
              Dạng Thẻ
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                viewMode === 'table' ? 'bg-[#1C6DD0] text-white shadow-xs' : 'bg-gray-100 text-[#718096] hover:bg-gray-200'
              }`}
            >
              Dạng Bảng
            </button>
          </div>
        </div>
      </div>

      {/* Grid or Table View */}
      {filteredClasses.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#DCE7F3]">
          <AlertCircle className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#2D3748]">Không tìm thấy lớp học nào</h3>
          <p className="text-xs text-[#718096] mt-1">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => {
            const currentSize = classSizeMap[cls.id] || 0;
            const capacity = cls.capacity || DEFAULT_CAPACITY;
            const isFull = currentSize >= capacity;
            const fillPercent = Math.min(100, Math.round((currentSize / capacity) * 100));
            const isActive = cls.status === 'ACTIVE' || cls.status === 'Đang hoạt động';

            return (
              <div 
                key={cls.id} 
                id={`card-class-${cls.id}`}
                className="bg-white rounded-2xl border border-[#DCE7F3] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#1C6DD0] border border-blue-100">
                      Khối {cls.grade}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {isActive ? '● Đang hoạt động' : '○ Tạm ngừng'}
                    </span>
                  </div>

                  {/* Class Title & Code */}
                  <div className="flex items-baseline justify-between mb-2">
                    <h3 className="text-lg font-extrabold text-[#1A202C] font-display">
                      {cls.name}
                    </h3>
                    <span className="text-xs font-mono font-semibold text-[#718096]">
                      {cls.academicYear || DEFAULT_ACADEMIC_YEAR}
                    </span>
                  </div>

                  {/* Sĩ số Capacity Meter */}
                  <div className="space-y-1.5 mb-4 bg-[#F8FAFC] p-3 rounded-xl border border-[#EDF2F7]">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#718096] font-medium flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-[#1C6DD0]" /> Sĩ số thực tế:
                      </span>
                      <span className="font-bold text-[#1A202C]">
                        {currentSize} / {capacity} học sinh
                        {isFull && <span className="ml-1.5 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Đầy</span>}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-[#E2E8F0] h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          isFull ? 'bg-indigo-600' : fillPercent > 80 ? 'bg-amber-500' : 'bg-[#1C6DD0]'
                        }`}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Details list */}
                  <div className="space-y-2 text-xs text-[#4A5568] border-t border-[#EDF2F7] pt-3 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-[#718096] shrink-0" />
                      <span className="text-[#718096]">Phòng:</span>
                      <span className="font-semibold text-[#1A202C]">{cls.room || 'Phòng 101'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-[#718096] shrink-0" />
                      <span className="text-[#718096]">Lịch học:</span>
                      <span className="font-semibold text-[#1A202C]">{cls.schedule || 'T2-T4-T6'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-3.5 w-3.5 text-[#718096] shrink-0" />
                      <span className="text-[#718096]">Giáo viên:</span>
                      <span className="font-semibold text-[#1A202C]">{cls.teacher || 'Chưa phân công'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between gap-2 border-t border-[#EDF2F7] pt-3 mt-2">
                  <button
                    onClick={() => {
                      setSelectedClass(cls);
                      setIsClassDetailOpen(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#1C6DD0] text-xs font-bold rounded-xl transition-all"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Xem danh sách ({currentSize})
                  </button>

                  {isManager && (
                    <button
                      onClick={() => handleOpenEditClass(cls)}
                      title="Chỉnh sửa thông tin lớp"
                      className="p-2 text-[#718096] hover:text-[#1C6DD0] hover:bg-gray-100 rounded-xl transition-all"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-[#DCE7F3] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] text-[11px] font-bold uppercase text-[#718096]">
                  <th className="py-3 px-4">Mã lớp</th>
                  <th className="py-3 px-4">Tên lớp</th>
                  <th className="py-3 px-4 text-center">Khối</th>
                  <th className="py-3 px-4">Năm học</th>
                  <th className="py-3 px-4 text-center">Sĩ số thực tế</th>
                  <th className="py-3 px-4 text-center">Sức chứa</th>
                  <th className="py-3 px-4">Phòng</th>
                  <th className="py-3 px-4">Lịch học</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF2F7]">
                {filteredClasses.map((cls) => {
                  const currentSize = classSizeMap[cls.id] || 0;
                  const capacity = cls.capacity || DEFAULT_CAPACITY;
                  const isFull = currentSize >= capacity;
                  const isActive = cls.status === 'ACTIVE' || cls.status === 'Đang hoạt động';

                  return (
                    <tr key={cls.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#1C6DD0]">{cls.classCode || cls.name}</td>
                      <td className="py-3 px-4 font-bold text-[#1A202C]">{cls.name}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1C6DD0]">
                          Khối {cls.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#718096]">{cls.academicYear || DEFAULT_ACADEMIC_YEAR}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-bold ${isFull ? 'text-indigo-600' : 'text-[#1A202C]'}`}>
                          {currentSize} học sinh
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-[#718096]">{capacity}</td>
                      <td className="py-3 px-4 text-[#4A5568]">{cls.room || '-'}</td>
                      <td className="py-3 px-4 text-[#4A5568]">{cls.schedule || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {isActive ? 'Hoạt động' : 'Tạm ngừng'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedClass(cls);
                              setIsClassDetailOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-[#1C6DD0] bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
                          >
                            Học viên ({currentSize})
                          </button>
                          {isManager && (
                            <button
                              onClick={() => handleOpenEditClass(cls)}
                              className="p-1 text-[#718096] hover:text-[#1C6DD0] rounded-md transition-all"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CLASS DETAIL & STUDENT LIST VIEW                                  */}
      {/* ========================================================================= */}
      {isClassDetailOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#DCE7F3] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#EDF2F7] flex items-center justify-between bg-[#F8FAFC]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-[#1C6DD0] rounded-md uppercase">
                    Khối {selectedClass.grade}
                  </span>
                  <span className="text-xs font-mono text-[#718096]">{selectedClass.academicYear || DEFAULT_ACADEMIC_YEAR}</span>
                </div>
                <h2 className="text-xl font-black text-[#1A202C] font-display mt-1">
                  Danh Sách Học Sinh: {selectedClass.name}
                </h2>
                <p className="text-xs text-[#718096] mt-0.5">
                  Sĩ số: <strong className="text-[#1A202C]">{selectedClassStudents.length} / {selectedClass.capacity || DEFAULT_CAPACITY}</strong> học sinh (Nguồn: classEnrollments)
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isManager && (
                  <button
                    id="btn-add-student-to-class"
                    onClick={handleOpenEnroll}
                    disabled={selectedClassStudents.length >= (selectedClass.capacity || DEFAULT_CAPACITY)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1C6DD0] hover:bg-[#1557A6] disabled:bg-gray-300 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    + Thêm học sinh
                  </button>
                )}
                <button
                  onClick={() => setIsClassDetailOpen(false)}
                  className="p-2 text-[#718096] hover:bg-gray-200 rounded-xl transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedClassStudents.length === 0 ? (
                <div className="text-center py-12 text-[#718096]">
                  <Users className="h-8 w-8 mx-auto mb-2 text-[#CBD5E1]" />
                  <p className="text-sm font-semibold">Chưa có học sinh nào ghi danh vào lớp này.</p>
                  {isManager && (
                    <button
                      onClick={handleOpenEnroll}
                      className="mt-3 text-xs text-[#1C6DD0] font-bold hover:underline"
                    >
                      + Bấm vào đây để ghi danh học sinh
                    </button>
                  )}
                </div>
              ) : (
                <div className="border border-[#DCE7F3] rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] text-[10px] font-bold uppercase text-[#718096]">
                        <th className="py-2.5 px-3 text-center">STT</th>
                        <th className="py-2.5 px-3">Mã HS</th>
                        <th className="py-2.5 px-3">Họ và tên</th>
                        <th className="py-2.5 px-3 text-center">Khối</th>
                        <th className="py-2.5 px-3 text-center">Điểm TB</th>
                        <th className="py-2.5 px-3 text-center">Trạng thái</th>
                        <th className="py-2.5 px-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF2F7]">
                      {selectedClassStudents.map((stu, idx) => (
                        <tr key={stu.id} className="hover:bg-[#F8FAFC]">
                          <td className="py-2.5 px-3 text-center font-mono text-[#718096]">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#1C6DD0]">{stu.id}</td>
                          <td className="py-2.5 px-3 font-bold text-[#1A202C]">{stu.name}</td>
                          <td className="py-2.5 px-3 text-center font-semibold text-[#718096]">{stu.grade}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-indigo-600">{stu.gpa || '8.0'}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                              Đang học
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isManager && (
                                <button
                                  id={`btn-transfer-${stu.id}`}
                                  onClick={() => handleOpenTransfer(stu, selectedClass)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[11px] font-bold rounded-lg transition-all"
                                  title="Chuyển lớp cho học sinh này"
                                >
                                  <ArrowRightLeft className="h-3 w-3" />
                                  Chuyển lớp
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenHistory(stu)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-[#4A5568] text-[11px] font-semibold rounded-lg transition-all"
                                title="Xem lịch sử chuyển lớp và enrollment"
                              >
                                <History className="h-3 w-3" />
                                Lịch sử
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TRANSFER STUDENT (CHUYỂN LỚP NGUYÊN TỬ)                           */}
      {/* ========================================================================= */}
      {isTransferOpen && transferStudent && transferFromClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#DCE7F3] space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Title */}
            <div className="flex justify-between items-start border-b border-[#EDF2F7] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1A202C] font-display">
                    Chuyển Lớp Học Sinh
                  </h3>
                  <p className="text-xs text-[#718096]">
                    Nghiệp vụ chuyển lớp nguyên tử (Atomic Transfer) bảo toàn toàn bộ lịch sử.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsTransferOpen(false)} className="p-1.5 text-[#718096] hover:bg-gray-100 rounded-xl">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Current Student & Class info box */}
            <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#EDF2F7] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#718096]">Học sinh:</span>
                <span className="font-bold text-[#1A202C]">{transferStudent.name} ({transferStudent.id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#718096]">Khối lớp:</span>
                <span className="font-bold text-blue-600">Khối {transferStudent.grade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#718096]">Lớp hiện tại:</span>
                <span className="font-bold text-red-600">{transferFromClass.name} ({transferFromClass.academicYear || DEFAULT_ACADEMIC_YEAR})</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              {/* Destination Class Select */}
              <div>
                <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
                  Chọn lớp đích (Cùng Khối {transferStudent.grade}) <span className="text-red-500">*</span>
                </label>
                <select
                  id="select-target-class"
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-medium text-[#1A202C]"
                >
                  <option value="">-- Chọn lớp học đích --</option>
                  {eligibleDestinationClasses.map((cls) => {
                    const currentSize = classSizeMap[cls.id] || 0;
                    const capacity = cls.capacity || DEFAULT_CAPACITY;
                    const isFull = currentSize >= capacity;

                    return (
                      <option key={cls.id} value={cls.id} disabled={isFull}>
                        {cls.name} (Sĩ số: {currentSize}/{capacity} {isFull ? ' - ĐÃ ĐẦY' : ''})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Transfer Reason */}
              <div>
                <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
                  Lý do chuyển lớp <span className="text-red-500">*</span>
                </label>
                <select
                  id="select-transfer-reason"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-medium text-[#1A202C]"
                >
                  {TRANSFER_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Transfer Note */}
              <div>
                <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
                  Ghi chú chi tiết (Tùy chọn)
                </label>
                <textarea
                  id="textarea-transfer-note"
                  rows={2}
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Nhập chi tiết ghi chú quyết định chuyển lớp..."
                  className="w-full px-3.5 py-2 border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                />
              </div>

              {/* Informational Alert */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2 text-[11px] text-amber-800 leading-relaxed">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Hệ thống sẽ cập nhật trạng thái enrollment cũ thành <strong className="font-mono">TRANSFERRED</strong>, tạo enrollment mới <strong className="font-mono">ACTIVE</strong> và ghi nhật ký kiểm toán không thể xóa.
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 border-t border-[#EDF2F7] pt-4">
              <button
                onClick={() => setIsTransferOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#718096] hover:bg-gray-100 rounded-xl transition-all"
              >
                Hủy bỏ
              </button>
              <button
                id="btn-confirm-transfer"
                onClick={handleSubmitTransfer}
                disabled={isSubmittingTransfer || !targetClassId}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                {isSubmittingTransfer ? 'Đang xử lý...' : 'Xác nhận Chuyển lớp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DIRECT ENROLL STUDENT (GHI DANH HỌC SINH MỚI VÀO LỚP)              */}
      {/* ========================================================================= */}
      {isEnrollOpen && selectedClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#DCE7F3] space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start border-b border-[#EDF2F7] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 text-[#1C6DD0] rounded-xl">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1A202C] font-display">
                    Ghi Danh Học Sinh Vào Lớp
                  </h3>
                  <p className="text-xs text-[#718096]">
                    Thêm học sinh khối {selectedClass.grade} vào lớp {selectedClass.name}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsEnrollOpen(false)} className="p-1.5 text-[#718096] hover:bg-gray-100 rounded-xl">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
                  Chọn học sinh Khối {selectedClass.grade} chưa có lớp <span className="text-red-500">*</span>
                </label>
                {eligibleStudentsForEnrollment.length === 0 ? (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-[#718096]">
                    Tất cả học sinh khối {selectedClass.grade} hiện đã có lớp trong năm học này.
                  </div>
                ) : (
                  <select
                    id="select-enroll-student"
                    value={enrollStudentId}
                    onChange={(e) => setEnrollStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-medium text-[#1A202C]"
                  >
                    <option value="">-- Chọn học sinh --</option>
                    {eligibleStudentsForEnrollment.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.id}) - Khối {s.grade}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#EDF2F7] pt-4">
              <button
                onClick={() => setIsEnrollOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#718096] hover:bg-gray-100 rounded-xl transition-all"
              >
                Hủy
              </button>
              <button
                id="btn-confirm-enroll"
                onClick={handleSubmitEnroll}
                disabled={isSubmittingEnroll || !enrollStudentId}
                className="px-4 py-2 bg-[#1C6DD0] hover:bg-[#1557A6] disabled:bg-gray-300 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                {isSubmittingEnroll ? 'Đang ghi danh...' : 'Xác nhận Ghi danh'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: STUDENT ENROLLMENT HISTORY (LỊCH SỬ CHUYỂN LỚP & ĐÀO TẠO)          */}
      {/* ========================================================================= */}
      {isHistoryOpen && historyStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#DCE7F3] space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start border-b border-[#EDF2F7] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <History className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1A202C] font-display">
                    Lịch Sử Enrollment: {historyStudent.name}
                  </h3>
                  <p className="text-xs text-[#718096]">
                    Mã HS: <span className="font-mono font-bold text-[#1C6DD0]">{historyStudent.id}</span> · Khối {historyStudent.grade}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="p-1.5 text-[#718096] hover:bg-gray-100 rounded-xl">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Timeline History List */}
            <div className="max-h-[60vh] overflow-y-auto space-y-3">
              {getStudentEnrollmentHistory(historyStudent.id, enrollments).length === 0 ? (
                <div className="text-center py-8 text-[#718096] text-xs">
                  Chưa có bản ghi enrollment nào cho học sinh này.
                </div>
              ) : (
                getStudentEnrollmentHistory(historyStudent.id, enrollments).map((enr, i) => {
                  const isActive = enr.status === 'ACTIVE' || enr.status === 'Đang học';
                  const isTransferred = enr.status === 'TRANSFERRED' || enr.status === 'Đã chuyển lớp';

                  return (
                    <div key={enr.id || i} className="p-4 rounded-2xl border border-[#EDF2F7] bg-[#F8FAFC] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[#1A202C]">
                          {enr.className || enr.classId}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          isTransferred ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {isActive ? '✓ Đang học' : isTransferred ? '⇄ Đã chuyển lớp' : enr.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-[#718096]">
                        <div>Năm học: <strong className="text-[#2D3748]">{enr.academicYear || DEFAULT_ACADEMIC_YEAR}</strong></div>
                        <div>Ngày bắt đầu: <strong className="text-[#2D3748]">{enr.startDate ? new Date(enr.startDate).toLocaleDateString('vi-VN') : '-'}</strong></div>
                        {enr.endDate && (
                          <div>Ngày kết thúc: <strong className="text-[#2D3748]">{new Date(enr.endDate).toLocaleDateString('vi-VN')}</strong></div>
                        )}
                      </div>

                      {enr.reason && (
                        <div className="text-xs bg-white p-2.5 rounded-xl border border-[#EDF2F7] text-[#4A5568]">
                          <span className="text-[#718096] font-semibold">Lý do:</span> {enr.reason}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end border-t border-[#EDF2F7] pt-3">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded-xl text-[#2D3748] transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: CREATE / EDIT CLASS MODAL                                        */}
      {/* ========================================================================= */}
      {(isCreateClassOpen || isEditClassOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#DCE7F3] space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start border-b border-[#EDF2F7] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 text-[#1C6DD0] rounded-xl">
                  <School className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1A202C] font-display">
                    {isEditClassOpen ? 'Chỉnh Sửa Lớp Học' : 'Tạo Lớp Học Mới'}
                  </h3>
                  <p className="text-xs text-[#718096]">
                    Thiết lập thông tin quy chuẩn THCS (Khối 6, 7, 8, 9 - Sĩ số 18)
                  </p>
                </div>
              </div>
              <button onClick={() => { setIsCreateClassOpen(false); setIsEditClassOpen(false); }} className="p-1.5 text-[#718096] hover:bg-gray-100 rounded-xl">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D3748] mb-1">Mã lớp (VD: 6A1, 7A3) *</label>
                  <input
                    type="text"
                    id="input-class-code"
                    value={classForm.classCode}
                    onChange={(e) => setClassForm({ ...classForm, classCode: e.target.value })}
                    placeholder="VD: 6A1"
                    className="w-full px-3 py-2 border border-[#DCE7F3] rounded-xl font-mono uppercase bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D3748] mb-1">Tên lớp hiển thị *</label>
                  <input
                    type="text"
                    id="input-class-name"
                    value={classForm.className}
                    onChange={(e) => setClassForm({ ...classForm, className: e.target.value })}
                    placeholder="VD: Lớp 6A1"
                    className="w-full px-3 py-2 border border-[#DCE7F3] rounded-xl bg-[#F8FAFC]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#2D3748] mb-1">Khối lớp *</label>
                  <select
                    id="select-class-grade"
                    value={classForm.grade}
                    disabled={isEditClassOpen} // Grade is locked on edit to prevent data mismatch
                    onChange={(e) => setClassForm({ ...classForm, grade: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#DCE7F3] rounded-xl bg-[#F8FAFC]"
                  >
                    <option value={6}>Khối 6</option>
                    <option value={7}>Khối 7</option>
                    <option value={8}>Khối 8</option>
                    <option value={9}>Khối 9</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#2D3748] mb-1">Sức chứa (Max) *</label>
                  <input
                    type="number"
                    id="input-class-capacity"
                    min={1}
                    max={50}
                    value={classForm.capacity}
                    onChange={(e) => setClassForm({ ...classForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-[#DCE7F3] rounded-xl bg-[#F8FAFC]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#2D3748] mb-1">Năm học *</label>
                  <input
                    type="text"
                    id="input-academic-year"
                    value={classForm.academicYear}
                    onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border border-[#DCE7F3] rounded-xl bg-[#F8FAFC]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#2D3748] mb-1">Phòng học</label>
                  <input
                    type="text"
                    id="input-class-room"
                    value={classForm.room}
                    onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                    placeholder="VD: Phòng 101"
                    className="w-full px-3 py-2 border border-[#DCE7F3] rounded-xl bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#2D3748] mb-1">Lịch học</label>
                  <input
                    type="text"
                    id="input-class-schedule"
                    value={classForm.schedule}
                    onChange={(e) => setClassForm({ ...classForm, schedule: e.target.value })}
                    placeholder="VD: T2 - T4 - T6 · 08:00"
                    className="w-full px-3 py-2 border border-[#DCE7F3] rounded-xl bg-[#F8FAFC]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#2D3748] mb-1">Trạng thái lớp</label>
                <select
                  id="select-class-status"
                  value={classForm.status}
                  onChange={(e) => setClassForm({ ...classForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-[#DCE7F3] rounded-xl bg-[#F8FAFC]"
                >
                  <option value="Đang hoạt động">Đang hoạt động</option>
                  <option value="Tạm ngừng">Tạm ngừng</option>
                  <option value="Đã kết thúc">Đã kết thúc</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#EDF2F7] pt-4">
              <button
                onClick={() => { setIsCreateClassOpen(false); setIsEditClassOpen(false); }}
                className="px-4 py-2 text-xs font-semibold text-[#718096] hover:bg-gray-100 rounded-xl transition-all"
              >
                Hủy
              </button>
              <button
                id="btn-save-class-submit"
                onClick={() => handleSaveClass(isEditClassOpen)}
                className="px-4 py-2 bg-[#1C6DD0] hover:bg-[#1557A6] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                {isEditClassOpen ? 'Lưu thay đổi' : 'Tạo lớp học'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

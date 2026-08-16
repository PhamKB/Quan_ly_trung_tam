import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  GraduationCap, 
  BookOpen, 
  School, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  UserMinus, 
  History, 
  ShieldAlert, 
  X, 
  ChevronRight, 
  Phone, 
  Mail, 
  Briefcase,
  AlertTriangle
} from 'lucide-react';
import { 
  Teacher, 
  TeacherAssignment, 
  Subject, 
  Class, 
  Role, 
  User 
} from '../types';
import { 
  STANDARD_SUBJECTS, 
  DEFAULT_ACADEMIC_YEAR,
  canManageTeachers,
  canManageAssignments,
  validateTeacherData,
  validateAssignmentEligibility,
  getTeacherActiveAssignments,
  getTeacherAssignmentHistory,
  saveTeacherToFirestore,
  executeAssignTeacher,
  executeUnassignTeacher
} from '../lib/teacherAssignmentService';

interface TeacherManagementProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  assignments: TeacherAssignment[];
  setAssignments: React.Dispatch<React.SetStateAction<TeacherAssignment[]>>;
  classes: Class[];
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

export const TeacherManagement: React.FC<TeacherManagementProps> = ({
  teachers,
  setTeachers,
  assignments,
  setAssignments,
  classes,
  currentUser,
  userProfile,
  currentRole,
  triggerToast,
  logAuditEvent,
}) => {
  const isManager = canManageTeachers(currentRole);
  const isTeacher = currentRole === 'TEACHER';

  // Filters & search
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isUnassignConfirmOpen, setIsUnassignConfirmOpen] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState<TeacherAssignment | null>(null);

  // Forms
  const [teacherForm, setTeacherForm] = useState<Partial<Teacher>>({
    teacherId: '',
    name: '',
    fullName: '',
    email: '',
    phone: '',
    subjectId: 'toan',
    department: 'Tổ Tự Nhiên',
    status: 'ACTIVE',
  });

  const [assignClassId, setAssignClassId] = useState('');
  const [assignYear, setAssignYear] = useState(DEFAULT_ACADEMIC_YEAR);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      // Role scope: Teacher can only view self if restricted
      if (isTeacher && userProfile?.email) {
        if (t.email !== userProfile.email && t.id !== userProfile.id) {
          // Allow viewing all in directory, but highlighted
        }
      }

      const matchSearch = 
        (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.teacherId || t.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.phone || '').includes(searchTerm);

      const matchSubject = subjectFilter === 'ALL' || t.subjectId.toLowerCase() === subjectFilter.toLowerCase();
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;

      return matchSearch && matchSubject && matchStatus;
    });
  }, [teachers, searchTerm, subjectFilter, statusFilter, isTeacher, userProfile]);

  // Statistics
  const stats = useMemo(() => {
    const totalTeachers = teachers.length;
    const activeTeachers = teachers.filter(t => t.status === 'ACTIVE' || t.status === 'Đang làm việc').length;
    const activeAssignmentsCount = assignments.filter(a => a.status === 'ACTIVE' || a.status === 'Đang dạy').length;

    const subjectCounts: Record<string, number> = {
      toan: 0,
      van: 0,
      anh: 0,
      ly: 0,
      hoa: 0,
    };

    teachers.forEach(t => {
      const sub = t.subjectId.toLowerCase();
      if (subjectCounts[sub] !== undefined) {
        subjectCounts[sub]++;
      }
    });

    return {
      totalTeachers,
      activeTeachers,
      activeAssignmentsCount,
      subjectCounts,
    };
  }, [teachers, assignments]);

  // Teacher active assignments helper
  const getTeacherClasses = (teacherId: string) => {
    const activeAssigns = getTeacherActiveAssignments(teacherId, assignments, DEFAULT_ACADEMIC_YEAR);
    return activeAssigns.map(a => {
      const cls = classes.find(c => c.id === a.classId || c.classId === a.classId);
      return {
        assignment: a,
        classInfo: cls,
      };
    });
  };

  // Open Create Teacher Modal
  const handleOpenCreate = () => {
    const nextIdx = teachers.length + 1;
    const generatedId = `TCH-2026-${nextIdx.toString().padStart(3, '0')}`;
    setTeacherForm({
      teacherId: generatedId,
      id: generatedId,
      employeeCode: generatedId,
      name: '',
      fullName: '',
      email: '',
      phone: '',
      subjectId: 'toan',
      department: 'Tổ Tự Nhiên',
      status: 'ACTIVE',
    });
    setIsCreateOpen(true);
  };

  // Open Edit Teacher Modal
  const handleOpenEdit = (t: Teacher) => {
    setSelectedTeacher(t);
    setTeacherForm({
      ...t,
      teacherId: t.teacherId || t.id,
      name: t.name || t.fullName,
      fullName: t.fullName || t.name,
    });
    setIsEditOpen(true);
  };

  // Handle Save Teacher (Create / Edit)
  const handleSaveTeacher = async (isEdit = false) => {
    const validation = validateTeacherData(teacherForm, teachers, isEdit);
    if (!validation.isValid) {
      triggerToast(`⚠️ ${validation.error}`, 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const teacherToSave: Teacher = {
        id: teacherForm.teacherId || teacherForm.id!,
        teacherId: teacherForm.teacherId || teacherForm.id!,
        employeeCode: teacherForm.employeeCode || teacherForm.teacherId || teacherForm.id!,
        name: teacherForm.fullName || teacherForm.name || '',
        fullName: teacherForm.fullName || teacherForm.name || '',
        email: teacherForm.email!,
        phone: teacherForm.phone || '',
        subjectId: teacherForm.subjectId!,
        department: teacherForm.department || 'Tổ Bộ Môn',
        status: teacherForm.status || 'ACTIVE',
      };

      const res = await saveTeacherToFirestore(teacherToSave, isEdit);
      if (!res.success) {
        throw new Error(res.error);
      }

      // Update local state
      setTeachers(prev => {
        if (isEdit) {
          return prev.map(t => (t.id === teacherToSave.id || t.teacherId === teacherToSave.teacherId ? teacherToSave : t));
        }
        return [...prev, teacherToSave];
      });

      await logAuditEvent(
        userProfile?.name || 'Giáo vụ',
        currentUser?.uid || 'system',
        isEdit ? 'CẬP NHẬT GIÁO VIÊN' : 'TẠO GIÁO VIÊN MỚI',
        `Giáo viên ${teacherToSave.name} (${teacherToSave.teacherId})`,
        'Success',
        `${isEdit ? 'Cập nhật thông tin' : 'Tạo mới'} giáo viên bộ môn ${teacherToSave.subjectId.toUpperCase()}`
      );

      triggerToast(`✓ ${isEdit ? 'Cập nhật' : 'Thêm mới'} giáo viên ${teacherToSave.name} thành công!`, 'success');
      setIsCreateOpen(false);
      setIsEditOpen(false);
      if (selectedTeacher && selectedTeacher.id === teacherToSave.id) {
        setSelectedTeacher(teacherToSave);
      }
    } catch (err: any) {
      triggerToast(`❌ Lỗi: ${err.message || 'Không thể lưu giáo viên'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Assign Teacher Modal
  const handleOpenAssign = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setAssignClassId('');
    setAssignYear(DEFAULT_ACADEMIC_YEAR);
    setIsAssignOpen(true);
  };

  // Execute Assign Teacher to Class
  const handleExecuteAssign = async () => {
    if (!selectedTeacher || !assignClassId) {
      triggerToast('⚠️ Vui lòng chọn lớp học cần phân công.', 'warning');
      return;
    }

    const targetClass = classes.find(c => c.id === assignClassId || c.classId === assignClassId);
    if (!targetClass) {
      triggerToast('❌ Không tìm thấy thông tin lớp học.', 'error');
      return;
    }

    // Invariant check: validateAssignmentEligibility
    const eligibility = validateAssignmentEligibility(
      selectedTeacher,
      targetClass,
      selectedTeacher.subjectId,
      assignYear,
      assignments
    );

    if (!eligibility.isValid) {
      triggerToast(`⚠️ ${eligibility.error}`, 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await executeAssignTeacher(selectedTeacher, targetClass, assignYear);
      if (!res.success) {
        throw new Error(res.error);
      }

      const now = new Date().toISOString();
      const newAssign: TeacherAssignment = {
        id: res.assignmentId!,
        assignmentId: res.assignmentId!,
        teacherId: selectedTeacher.teacherId || selectedTeacher.id,
        teacherName: selectedTeacher.name || selectedTeacher.fullName,
        classId: targetClass.id,
        className: targetClass.name,
        subjectId: selectedTeacher.subjectId,
        subjectName: selectedTeacher.subjectName || selectedTeacher.subjectId,
        academicYear: assignYear,
        status: 'ACTIVE',
        startDate: now,
        createdAt: now,
        updatedAt: now,
      };

      setAssignments(prev => [...prev, newAssign]);

      await logAuditEvent(
        userProfile?.name || 'Giáo vụ',
        currentUser?.uid || 'system',
        'PHÂN CÔNG GIÁO VIÊN',
        `Lớp ${targetClass.name} - Môn ${selectedTeacher.subjectId.toUpperCase()}`,
        'Success',
        `Phân công GV ${selectedTeacher.name} giảng dạy môn ${selectedTeacher.subjectName || selectedTeacher.subjectId} cho lớp ${targetClass.name} (Năm học ${assignYear})`
      );

      triggerToast(`✓ Đã phân công GV ${selectedTeacher.name} dạy lớp ${targetClass.name} thành công!`, 'success');
      setIsAssignOpen(false);
    } catch (err: any) {
      triggerToast(`❌ Lỗi phân công: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Unassign (Gỡ phân công)
  const handleOpenUnassign = (assignment: TeacherAssignment) => {
    setUnassignTarget(assignment);
    setIsUnassignConfirmOpen(true);
  };

  const handleExecuteUnassign = async () => {
    if (!unassignTarget) return;

    setIsSubmitting(true);
    try {
      const res = await executeUnassignTeacher(unassignTarget.id);
      if (!res.success) {
        throw new Error(res.error);
      }

      const now = new Date().toISOString();
      setAssignments(prev => prev.map(a => a.id === unassignTarget.id ? { ...a, status: 'INACTIVE', endDate: now } : a));

      await logAuditEvent(
        userProfile?.name || 'Giáo vụ',
        currentUser?.uid || 'system',
        'GỠ PHÂN CÔNG GIÁO VIÊN',
        `Phân công ${unassignTarget.id}`,
        'Success',
        `Gỡ phân công GV ${unassignTarget.teacherName} khỏi lớp ${unassignTarget.className} môn ${unassignTarget.subjectId.toUpperCase()}`
      );

      triggerToast(`✓ Đã gỡ phân công giảng dạy cho lớp ${unassignTarget.className}. Toàn bộ lịch sử được lưu vết bảo toàn.`, 'success');
      setIsUnassignConfirmOpen(false);
      setUnassignTarget(null);
    } catch (err: any) {
      triggerToast(`❌ Lỗi: ${err.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Subject badge color helper
  const getSubjectBadge = (subId: string) => {
    const s = subId.toLowerCase();
    switch (s) {
      case 'toan':
        return { label: 'Toán học', bg: 'bg-blue-50 text-[#1C6DD0] border-blue-200' };
      case 'van':
        return { label: 'Ngữ văn', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'anh':
        return { label: 'Tiếng Anh', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'ly':
        return { label: 'Vật lý', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'hoa':
        return { label: 'Hóa học', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: subId, bg: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-[#718096] font-medium mb-1">
            <span>Học vụ</span>
            <ChevronRight className="h-3 w-3 text-[#CBD5E0]" />
            <span className="text-[#1C6DD0] font-bold">Giáo viên & Phân công bộ môn</span>
          </div>
          <h1 className="text-2xl font-black text-[#1A202C] font-display tracking-tight">
            Quản Lý Giáo Viên & Phân Công Môn/Lớp
          </h1>
          <p className="text-xs text-[#718096] mt-0.5">
            Nguyên tắc bất biến: <strong>1 Giáo viên → 1 Môn → Nhiều Lớp</strong>. Phụ trách 5 bộ môn tiêu chuẩn THCS.
          </p>
        </div>

        {isManager && (
          <button
            id="btn-add-teacher"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#1C6DD0] hover:bg-[#1557A6] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            + Thêm giáo viên mới
          </button>
        )}
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-3.5 rounded-2xl border border-[#DCE7F3] shadow-xs">
          <div className="text-[10px] font-bold text-[#718096] uppercase tracking-wider">Tổng giáo viên</div>
          <div className="text-xl font-black text-[#1A202C] font-display mt-0.5">{stats.totalTeachers} <span className="text-xs font-normal text-emerald-600">({stats.activeTeachers} Active)</span></div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-[#DCE7F3] shadow-xs">
          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">GV Toán học</div>
          <div className="text-xl font-black text-[#1A202C] font-display mt-0.5">{stats.subjectCounts.toan} <span className="text-xs font-normal text-[#718096]">thành viên</span></div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-[#DCE7F3] shadow-xs">
          <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">GV Ngữ văn</div>
          <div className="text-xl font-black text-[#1A202C] font-display mt-0.5">{stats.subjectCounts.van} <span className="text-xs font-normal text-[#718096]">thành viên</span></div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-[#DCE7F3] shadow-xs">
          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">GV Tiếng Anh</div>
          <div className="text-xl font-black text-[#1A202C] font-display mt-0.5">{stats.subjectCounts.anh} <span className="text-xs font-normal text-[#718096]">thành viên</span></div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-[#DCE7F3] shadow-xs">
          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">GV Vật lý</div>
          <div className="text-xl font-black text-[#1A202C] font-display mt-0.5">{stats.subjectCounts.ly} <span className="text-xs font-normal text-[#718096]">thành viên</span></div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-[#DCE7F3] shadow-xs">
          <div className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">GV Hóa học</div>
          <div className="text-xl font-black text-[#1A202C] font-display mt-0.5">{stats.subjectCounts.hoa} <span className="text-xs font-normal text-[#718096]">thành viên</span></div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#DCE7F3] shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
            <input
              type="text"
              id="input-search-teachers"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã GV, họ tên, email, SĐT, chuyên môn..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-[#F8FAFC]"
            />
          </div>

          {/* Subject Filter */}
          <div className="md:col-span-3">
            <select
              id="select-subject-filter"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-[#F8FAFC] font-medium text-[#2D3748]"
            >
              <option value="ALL">Tất cả 5 môn học</option>
              <option value="toan">Toán học (TOAN)</option>
              <option value="van">Ngữ văn (NGU_VAN)</option>
              <option value="anh">Tiếng Anh (TIENG_ANH)</option>
              <option value="ly">Vật lý (VAT_LY)</option>
              <option value="hoa">Hóa học (HOA_HOC)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              id="select-teacher-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-[#F8FAFC] font-medium text-[#2D3748]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang làm việc (ACTIVE)</option>
              <option value="INACTIVE">Tạm nghỉ (INACTIVE)</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="md:col-span-2 flex justify-end gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-[#1C6DD0] text-white shadow-xs' : 'bg-gray-100 text-[#718096] hover:bg-gray-200'
              }`}
            >
              Dạng Thẻ
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-[#1C6DD0] text-white shadow-xs' : 'bg-gray-100 text-[#718096] hover:bg-gray-200'
              }`}
            >
              Dạng Bảng
            </button>
          </div>
        </div>
      </div>

      {/* Main Teachers List View */}
      {filteredTeachers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#DCE7F3]">
          <AlertCircle className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#2D3748]">Không tìm thấy giáo viên nào</h3>
          <p className="text-xs text-[#718096] mt-1">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeachers.map((t) => {
            const subBadge = getSubjectBadge(t.subjectId);
            const teacherClasses = getTeacherClasses(t.teacherId || t.id);
            const isActive = t.status === 'ACTIVE' || t.status === 'Đang làm việc' || t.status === 'Đang hoạt động';

            return (
              <div 
                key={t.id}
                id={`card-teacher-${t.id}`}
                className="bg-white rounded-2xl border border-[#DCE7F3] p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Subject Badge & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${subBadge.bg}`}>
                      {subBadge.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {isActive ? '● Đang làm việc' : '○ Tạm nghỉ'}
                    </span>
                  </div>

                  {/* Teacher Info */}
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="h-11 w-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1C6DD0] font-black text-sm shrink-0 font-display">
                      {t.name ? t.name.split(' ').slice(-1)[0][0] : 'GV'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold text-[#1A202C] font-display truncate">
                        {t.name || t.fullName}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-xs font-bold text-[#1C6DD0]">{t.teacherId || t.id}</span>
                        <span className="text-[11px] text-[#718096]">• {t.department || 'Tổ Tự Nhiên'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-[#4A5568] bg-[#F8FAFC] p-3 rounded-xl border border-[#EDF2F7] mb-3">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="h-3.5 w-3.5 text-[#718096] shrink-0" />
                      <span className="truncate">{t.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-[#718096] shrink-0" />
                      <span>{t.phone || '0913-xxx-xxx'}</span>
                    </div>
                  </div>

                  {/* Teaching Load (Assigned Classes) */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[#718096] font-medium flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5 text-[#1C6DD0]" /> Lớp đang phụ trách ({teacherClasses.length}):
                      </span>
                      <span className="font-bold text-[#1A202C]">{DEFAULT_ACADEMIC_YEAR}</span>
                    </div>
                    {teacherClasses.length === 0 ? (
                      <p className="text-[11px] text-[#94A3B8] italic">Chưa phân công lớp nào</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {teacherClasses.map(({ assignment, classInfo }) => (
                          <span 
                            key={assignment.id} 
                            className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-[#1C6DD0] text-[11px] font-bold rounded-md border border-blue-100"
                          >
                            {classInfo?.name || assignment.className || assignment.classId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 border-t border-[#EDF2F7] pt-3 mt-2">
                  <button
                    onClick={() => {
                      setSelectedTeacher(t);
                      setIsDetailOpen(true);
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#1C6DD0] text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <GraduationCap className="h-3.5 w-3.5" />
                    Chi tiết & Lịch sử
                  </button>

                  {isManager && (
                    <>
                      <button
                        onClick={() => handleOpenAssign(t)}
                        title="Phân công lớp giảng dạy"
                        className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer font-bold text-xs flex items-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Gán lớp
                      </button>
                      <button
                        onClick={() => handleOpenEdit(t)}
                        title="Chỉnh sửa thông tin"
                        className="p-2 text-[#718096] hover:text-[#1C6DD0] hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    </>
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
                  <th className="py-3 px-4">Mã GV</th>
                  <th className="py-3 px-4">Họ và tên</th>
                  <th className="py-3 px-4">Môn phụ trách</th>
                  <th className="py-3 px-4">Bộ phận</th>
                  <th className="py-3 px-4">Liên hệ</th>
                  <th className="py-3 px-4 text-center">Số lớp đang dạy</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDF2F7]">
                {filteredTeachers.map((t) => {
                  const subBadge = getSubjectBadge(t.subjectId);
                  const teacherClasses = getTeacherClasses(t.teacherId || t.id);
                  const isActive = t.status === 'ACTIVE' || t.status === 'Đang làm việc';

                  return (
                    <tr key={t.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#1C6DD0]">{t.teacherId || t.id}</td>
                      <td className="py-3 px-4 font-bold text-[#1A202C]">{t.name || t.fullName}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${subBadge.bg}`}>
                          {subBadge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#718096]">{t.department || 'Tổ Bộ Môn'}</td>
                      <td className="py-3 px-4 text-[#718096]">
                        <div>{t.email}</div>
                        <div className="text-[11px] text-[#94A3B8]">{t.phone}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-[#1A202C]">{teacherClasses.length} lớp</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {isActive ? 'Hoạt động' : 'Tạm nghỉ'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedTeacher(t);
                              setIsDetailOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-[#1C6DD0] bg-blue-50 hover:bg-blue-100 rounded-lg transition-all cursor-pointer"
                          >
                            Chi tiết
                          </button>
                          {isManager && (
                            <>
                              <button
                                onClick={() => handleOpenAssign(t)}
                                className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all cursor-pointer"
                              >
                                Gán lớp
                              </button>
                              <button
                                onClick={() => handleOpenEdit(t)}
                                className="p-1 text-[#718096] hover:text-[#1C6DD0] rounded-md transition-all cursor-pointer"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                            </>
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
      {/* MODAL 1: TEACHER DETAIL & ACTIVE ASSIGNMENTS VIEW                          */}
      {/* ========================================================================= */}
      {isDetailOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#DCE7F3] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#EDF2F7] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-[#1C6DD0] font-black text-base font-display">
                  {selectedTeacher.name ? selectedTeacher.name.split(' ').slice(-1)[0][0] : 'GV'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#1C6DD0]">{selectedTeacher.teacherId || selectedTeacher.id}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getSubjectBadge(selectedTeacher.subjectId).bg}`}>
                      {getSubjectBadge(selectedTeacher.subjectId).label}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-[#1A202C] font-display mt-0.5">
                    {selectedTeacher.name || selectedTeacher.fullName}
                  </h2>
                  <p className="text-xs text-[#718096]">
                    {selectedTeacher.department} • {selectedTeacher.email} • {selectedTeacher.phone || '0913-xxx-xxx'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isManager && (
                  <button
                    onClick={() => handleOpenAssign(selectedTeacher)}
                    className="inline-flex items-center gap-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    + Phân công lớp
                  </button>
                )}
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="p-2 text-[#718096] hover:bg-gray-200 rounded-xl transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Active Assignments Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-extrabold text-[#1A202C] font-display flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[#1C6DD0]" /> Các Lớp Đang Giảng Dạy ({DEFAULT_ACADEMIC_YEAR})
                  </h3>
                  <span className="text-xs text-[#718096]">
                    {getTeacherClasses(selectedTeacher.teacherId || selectedTeacher.id).length} lớp phụ trách
                  </span>
                </div>

                {getTeacherClasses(selectedTeacher.teacherId || selectedTeacher.id).length === 0 ? (
                  <div className="p-8 text-center bg-[#F8FAFC] rounded-2xl border border-dashed border-[#CBD5E1] text-[#718096]">
                    <School className="h-8 w-8 mx-auto mb-2 text-[#CBD5E1]" />
                    <p className="text-xs font-semibold">Giáo viên hiện chưa được phân công giảng dạy lớp nào.</p>
                    {isManager && (
                      <button
                        onClick={() => handleOpenAssign(selectedTeacher)}
                        className="mt-2 text-xs text-[#1C6DD0] font-bold hover:underline"
                      >
                        + Bấm vào đây để phân công lớp ngay
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="border border-[#DCE7F3] rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] text-[10px] font-bold uppercase text-[#718096]">
                          <th className="py-2.5 px-3">Lớp học</th>
                          <th className="py-2.5 px-3 text-center">Khối</th>
                          <th className="py-2.5 px-3">Phòng học</th>
                          <th className="py-2.5 px-3">Lịch học</th>
                          <th className="py-2.5 px-3 text-center">Trạng thái</th>
                          {isManager && <th className="py-2.5 px-3 text-right">Thao tác</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EDF2F7]">
                        {getTeacherClasses(selectedTeacher.teacherId || selectedTeacher.id).map(({ assignment, classInfo }) => (
                          <tr key={assignment.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-2.5 px-3 font-bold text-[#1A202C]">
                              {classInfo?.name || assignment.className || assignment.classId}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 bg-blue-50 text-[#1C6DD0] font-bold text-[10px] rounded-md">
                                Khối {classInfo?.grade || assignment.className?.slice(0, 1) || 'THCS'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[#718096]">{classInfo?.room || 'Phòng 101'}</td>
                            <td className="py-2.5 px-3 text-[#718096]">{classInfo?.schedule || 'T2-T4-T6'}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-md">
                                Đang dạy
                              </span>
                            </td>
                            {isManager && (
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => handleOpenUnassign(assignment)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                                  title="Gỡ phân công lớp này"
                                >
                                  <UserMinus className="h-3 w-3" />
                                  Gỡ phân công
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Assignment History Section */}
              <div>
                <h3 className="text-sm font-extrabold text-[#1A202C] font-display flex items-center gap-2 mb-3">
                  <History className="h-4 w-4 text-[#718096]" /> Lịch Sử Phân Công Giảng Dạy
                </h3>

                <div className="space-y-2">
                  {getTeacherAssignmentHistory(selectedTeacher.teacherId || selectedTeacher.id, assignments).map((h) => {
                    const isHistActive = h.status === 'ACTIVE' || h.status === 'Đang dạy';
                    return (
                      <div 
                        key={h.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          isHistActive ? 'bg-white border-[#DCE7F3]' : 'bg-gray-50 border-gray-200 opacity-75'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={`h-2 w-2 rounded-full ${isHistActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          <div>
                            <span className="font-bold text-[#1A202C]">{h.className || h.classId}</span>
                            <span className="text-[#718096] text-[11px] ml-2">Môn: {h.subjectName || h.subjectId.toUpperCase()}</span>
                            <span className="text-[#94A3B8] text-[11px] ml-2">({h.academicYear})</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-[#718096]">
                          {isHistActive ? (
                            <span className="text-emerald-700 font-semibold">Bắt đầu: {h.startDate ? new Date(h.startDate).toLocaleDateString('vi-VN') : 'Đầu năm học'}</span>
                          ) : (
                            <span className="text-gray-500">Đã kết thúc: {h.endDate ? new Date(h.endDate).toLocaleDateString('vi-VN') : 'Hết nhiệm kỳ'}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREATE / EDIT TEACHER                                             */}
      {/* ========================================================================= */}
      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#DCE7F3] space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Title */}
            <div className="flex justify-between items-start border-b border-[#EDF2F7] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-blue-50 text-[#1C6DD0] rounded-xl">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1A202C] font-display">
                    {isEditOpen ? 'Cập Nhật Hồ Sơ Giáo Viên' : 'Thêm Giáo Viên Mới'}
                  </h3>
                  <p className="text-xs text-[#718096]">
                    1 giáo viên phụ trách 1 môn học tiêu chuẩn trong 5 môn THCS.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }} 
                className="p-1.5 text-[#718096] hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
                    Mã Giáo Viên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="input-teacher-id"
                    disabled={isEditOpen}
                    value={teacherForm.teacherId || ''}
                    onChange={(e) => setTeacherForm({ ...teacherForm, teacherId: e.target.value })}
                    placeholder="TCH-2026-XXX"
                    className="w-full px-3.5 py-2.5 border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-mono font-bold text-[#1C6DD0] disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
                    Trạng Thái <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="select-teacher-status"
                    value={teacherForm.status || 'ACTIVE'}
                    onChange={(e) => setTeacherForm({ ...teacherForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-medium text-[#1A202C]"
                  >
                    <option value="ACTIVE">ACTIVE (Đang làm việc)</option>
                    <option value="INACTIVE">INACTIVE (Tạm nghỉ / Đã nghỉ)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
                  Họ và Tên Giáo Viên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="input-teacher-name"
                  value={teacherForm.fullName || teacherForm.name || ''}
                  onChange={(e) => setTeacherForm({ ...teacherForm, fullName: e.target.value, name: e.target.value })}
                  placeholder="Ví dụ: Trần Quốc Việt"
                  className="w-full px-3.5 py-2.5 border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-medium text-[#1A202C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
                    Email Công Vụ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="input-teacher-email"
                    value={teacherForm.email || ''}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    placeholder="gv.viettoan@smartedu.vn"
                    className="w-full px-3.5 py-2.5 border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-medium text-[#1A202C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
                    Số Điện Thoại
                  </label>
                  <input
                    type="text"
                    id="input-teacher-phone"
                    value={teacherForm.phone || ''}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    placeholder="0913000101"
                    className="w-full px-3.5 py-2.5 border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-medium text-[#1A202C]"
                  />
                </div>
              </div>

              {/* Strict Subject Selection (Exactly 1 subject) */}
              <div>
                <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
                  Môn Học Phụ Trách (Quy tắc bất biến: Chỉ 1 môn) <span className="text-red-500">*</span>
                </label>
                <select
                  id="select-teacher-subject"
                  value={teacherForm.subjectId || 'toan'}
                  onChange={(e) => {
                    const selectedSub = STANDARD_SUBJECTS.find(s => s.id === e.target.value);
                    setTeacherForm({
                      ...teacherForm,
                      subjectId: e.target.value,
                      subjectCode: selectedSub?.code,
                      subjectName: selectedSub?.name,
                      department: selectedSub?.category === 'Tự nhiên' ? 'Tổ Tự Nhiên' : selectedSub?.category === 'Xã hội' ? 'Tổ Xã Hội' : 'Tổ Ngoại Ngữ'
                    });
                  }}
                  className="w-full px-3.5 py-2.5 border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-bold text-[#1C6DD0]"
                >
                  <option value="toan">Toán học (TOAN) - Tổ Tự Nhiên</option>
                  <option value="van">Ngữ văn (NGU_VAN) - Tổ Xã Hội</option>
                  <option value="anh">Tiếng Anh (TIENG_ANH) - Tổ Ngoại Ngữ</option>
                  <option value="ly">Vật lý (VAT_LY) - Tổ Tự Nhiên</option>
                  <option value="hoa">Hóa học (HOA_HOC) - Tổ Tự Nhiên</option>
                </select>
                <p className="text-[11px] text-[#718096] mt-1">
                  Mỗi giáo viên chỉ được phụ trách đúng 1 chuyên môn trong 5 môn học chính khóa của trung tâm.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
                  Tổ Bộ Môn
                </label>
                <input
                  type="text"
                  id="input-teacher-department"
                  value={teacherForm.department || ''}
                  onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
                  placeholder="Tổ Tự Nhiên / Tổ Xã Hội / Tổ Ngoại Ngữ"
                  className="w-full px-3.5 py-2.5 border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-medium text-[#1A202C]"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EDF2F7]">
              <button
                type="button"
                onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#4A5568] text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                id="btn-submit-teacher"
                disabled={isSubmitting}
                onClick={() => handleSaveTeacher(isEditOpen)}
                className="px-5 py-2.5 bg-[#1C6DD0] hover:bg-[#1557A6] disabled:bg-gray-300 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {isSubmitting ? 'Đang lưu...' : isEditOpen ? 'Lưu cập nhật' : 'Tạo giáo viên'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ASSIGN TEACHER TO CLASS                                          */}
      {/* ========================================================================= */}
      {isAssignOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#DCE7F3] space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Title */}
            <div className="flex justify-between items-start border-b border-[#EDF2F7] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1A202C] font-display">
                    Phân Công Lớp Giảng Dạy
                  </h3>
                  <p className="text-xs text-[#718096]">
                    Phân công giáo viên phụ trách bộ môn chuyên môn tại lớp học.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsAssignOpen(false)} className="p-1.5 text-[#718096] hover:bg-gray-100 rounded-xl cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Selected Teacher Summary */}
            <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#EDF2F7] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#718096]">Giáo viên:</span>
                <span className="font-bold text-[#1A202C]">{selectedTeacher.name} ({selectedTeacher.teacherId || selectedTeacher.id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#718096]">Môn chuyên trách (Khóa):</span>
                <span className="font-bold text-[#1C6DD0]">
                  {getSubjectBadge(selectedTeacher.subjectId).label} ({selectedTeacher.subjectId.toUpperCase()})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#718096]">Năm học:</span>
                <span className="font-bold text-[#1A202C]">{assignYear}</span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
                  Chọn Lớp Học Phân Công <span className="text-red-500">*</span>
                </label>
                <select
                  id="select-assign-class"
                  value={assignClassId}
                  onChange={(e) => setAssignClassId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-medium text-[#1A202C]"
                >
                  <option value="">-- Chọn lớp học trong 12 lớp --</option>
                  {classes.map((cls) => {
                    const isAlreadyAssigned = assignments.some(
                      a => (a.status === 'ACTIVE' || a.status === 'Đang dạy') &&
                           (a.teacherId === selectedTeacher.id || a.teacherId === selectedTeacher.teacherId) &&
                           (a.classId === cls.id || a.classId === cls.classId) &&
                           a.academicYear === assignYear
                    );

                    return (
                      <option key={cls.id} value={cls.id} disabled={isAlreadyAssigned}>
                        {cls.name} (Khối {cls.grade} · {cls.room || 'Phòng 101'}) {isAlreadyAssigned ? ' - ĐÃ PHÂN CÔNG' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D3748] mb-1.5">
                  Năm Học Áp Dụng
                </label>
                <select
                  id="select-assign-year"
                  value={assignYear}
                  onChange={(e) => setAssignYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#DCE7F3] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white font-medium text-[#1A202C]"
                >
                  <option value="2026-2027">Năm học 2026-2027</option>
                  <option value="2025-2026">Năm học 2025-2026</option>
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EDF2F7]">
              <button
                type="button"
                onClick={() => setIsAssignOpen(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#4A5568] text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                id="btn-confirm-assign-teacher"
                disabled={isSubmitting || !assignClassId}
                onClick={handleExecuteAssign}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {isSubmitting ? 'Đang phân công...' : 'Xác nhận phân công'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: CONFIRM UNASSIGN TEACHER                                         */}
      {/* ========================================================================= */}
      {isUnassignConfirmOpen && unassignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#DCE7F3] space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1A202C] font-display">
                  Xác Nhận Gỡ Phân Công
                </h3>
                <p className="text-xs text-[#718096]">
                  Hành động này sẽ cập nhật trạng thái phân công thành INACTIVE.
                </p>
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-3.5 rounded-2xl border border-[#EDF2F7] space-y-1.5 text-xs text-[#2D3748]">
              <p>• Giáo viên: <strong>{unassignTarget.teacherName || unassignTarget.teacherId}</strong></p>
              <p>• Lớp học: <strong>{unassignTarget.className || unassignTarget.classId}</strong></p>
              <p>• Môn học: <strong>{unassignTarget.subjectName || unassignTarget.subjectId.toUpperCase()}</strong></p>
              <p>• Năm học: <strong>{unassignTarget.academicYear}</strong></p>
            </div>

            <p className="text-xs text-[#718096] leading-relaxed">
              Hệ thống áp dụng chính sách <strong>bảo toàn lịch sử (Soft Unassign)</strong>, ghi nhận ngày kết thúc phân công và lưu vết kiểm toán đầy đủ.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EDF2F7]">
              <button
                type="button"
                onClick={() => { setIsUnassignConfirmOpen(false); setUnassignTarget(null); }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#4A5568] text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                id="btn-confirm-unassign-teacher"
                disabled={isSubmitting}
                onClick={handleExecuteUnassign}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white text-xs font-bold rounded-xl transition-all cursor-pointer font-bold"
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận gỡ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

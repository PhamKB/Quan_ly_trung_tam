import React, { useState, useMemo } from 'react';
import { 
  Users, BookOpen, Calendar, CheckSquare, Award, Clock, DollarSign, 
  Brain, ShieldAlert, Settings, LogOut, Menu, Bell, User as UserIcon, 
  Check, Sliders, Sparkles, CreditCard, Activity, Briefcase, ChevronRight,
  Plus, Search, X, Shield, Lock, Trash2, Eye, Download, Info, RefreshCw,
  FolderOpen, Key, BellRing, ListTodo, FileText, GraduationCap
} from 'lucide-react';
import { 
  Role, Student, Parent, Class, ClassEnrollment, Course, Invoice, Payment, Refund, 
  Homework, Score, User, Employee, AuditLog, AppNotification, ReportItem,
  Teacher, TeacherAssignment
} from './types';
import { 
  formatVND, INITIAL_STUDENTS, INITIAL_PARENTS, INITIAL_CLASSES, INITIAL_CLASS_ENROLLMENTS, INITIAL_COURSES, 
  INITIAL_INVOICES, INITIAL_PAYMENTS, INITIAL_REFUNDS, INITIAL_HOMEWORKS, 
  INITIAL_SCORES, INITIAL_USERS, INITIAL_EMPLOYEES, INITIAL_NOTIFICATIONS, 
  INITIAL_AUDIT_LOGS, INITIAL_REPORTS, INITIAL_TEACHERS, INITIAL_TEACHER_ASSIGNMENTS, ALLOWED_TABS_BY_ROLE 
} from './data';
import { Button, PageHeader, Badge, SearchInput, Modal, Toast, EmptyState, Card } from './components/Common';
import { ScheduleView } from './components/ScheduleView';
import { AttendanceView } from './components/AttendanceView';
import { AiPlanner } from './components/AiPlanner';
import { ObservabilityView } from './components/ObservabilityView';
import { FinanceView } from './components/FinanceView';
import { DashboardView } from './components/DashboardView';
import { StudentParentManagement } from './components/StudentParentManagement';
import { ClassManagement } from './components/ClassManagement';
import { TeacherManagement } from './components/TeacherManagement';
import { FirstLoginModal } from './components/FirstLoginModal';
import { collection, doc, setDoc, onSnapshot, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db, auth, googleProvider, OperationType, handleFirestoreError } from './lib/firebase';
import { signInWithPopup, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { verifyPassword, hashPassword } from './lib/accountUtils';

export default function App() {
  // 1. Authentication and User Profile states
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  
  // Login input states
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState<string>('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState<boolean>(false);
  
  // First Login Password Change State
  const [pendingFirstLoginUser, setPendingFirstLoginUser] = useState<User | null>(null);
  const [isFirstLoginOpen, setIsFirstLoginOpen] = useState<boolean>(false);

  // 1b. Navigation and UI states
  const [currentRole, setCurrentRole] = useState<Role>('STUDENT');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  
  // Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'warning' | 'error'>('success');

  const triggerToast = (msg: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
  };

  // Helper function to log audit events to firestore
  const logAuditEvent = async (
    actorName: string,
    userId: string,
    action: string,
    target: string,
    status: 'Success' | 'Warning' | 'Critical',
    details: string
  ) => {
    try {
      if (!auth.currentUser) {
        console.log(`[Audit Log Local] ${action} by ${actorName}: ${details}`);
        return;
      }
      const auditId = `AUD-${Date.now().toString().substring(6)}`;
      const audit: AuditLog = {
        id: auditId,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: actorName,
        role: currentRole,
        action: action,
        target: target,
        ip: '127.0.0.1',
        status: status,
        details: details,
        metadata: {
          requestId: `req_${Math.random().toString(36).substring(2, 10)}`,
          before: '-',
          after: '-',
          userAgent: navigator.userAgent
        }
      };
      await setDoc(doc(db, 'auditLogs', auditId), audit);
    } catch (err) {
      console.warn('Failed to write audit log:', err);
    }
  };

  // Auth state change observer and profile loader (Strict Zero-Trust RBAC)
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (!userDocSnap.exists()) {
            // PROFILE MISSING: Do not auto-register or assign default role!
            console.error(`[AUTH_PROFILE_NOT_FOUND] UID: ${firebaseUser.uid}, Email: ${firebaseUser.email}, Time: ${new Date().toISOString()}`);
            await logAuditEvent(
              firebaseUser.email || 'Unknown',
              firebaseUser.uid,
              'AUTH_PROFILE_NOT_FOUND',
              'Hệ thống ERP',
              'Critical',
              'Đăng nhập bị từ chối do không tìm thấy hồ sơ hệ thống users/{uid}'
            );
            triggerToast('❌ Tài khoản chưa được cấp hồ sơ hệ thống. Vui lòng liên hệ giáo vụ hoặc chủ trung tâm.', 'error');
            await auth.signOut();
            setCurrentUser(null);
            setUserProfile(null);
            setAuthLoading(false);
            return;
          }

          const profile = userDocSnap.data() as User;

          // Check if user status is ACTIVE ('Đang hoạt động' / 'ACTIVE')
          if (profile.status !== 'Đang hoạt động' && profile.status !== 'ACTIVE') {
            console.error(`[AUTH_PROFILE_INACTIVE] UID: ${firebaseUser.uid}, Email: ${firebaseUser.email}, Time: ${new Date().toISOString()}`);
            await logAuditEvent(
              profile.name || firebaseUser.email || 'Unknown',
              firebaseUser.uid,
              'AUTH_PROFILE_INACTIVE',
              'Hệ thống ERP',
              'Warning',
              `Tài khoản bị khóa hoặc tạm dừng hoạt động (Trạng thái: ${profile.status})`
            );
            triggerToast('❌ Tài khoản hiện đang bị khóa hoặc không hoạt động.', 'error');
            await auth.signOut();
            setCurrentUser(null);
            setUserProfile(null);
            setAuthLoading(false);
            return;
          }

          // Valid active profile found -> Set role and user state
          setUserProfile(profile);
          setCurrentRole(profile.role);
          setCurrentUser(firebaseUser);
          
          // Ensure activeTab is accessible for this role
          const allowedForRole = ALLOWED_TABS_BY_ROLE[profile.role] || ['dashboard'];
          if (!allowedForRole.includes(activeTab)) {
            setActiveTab('dashboard');
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
          triggerToast('❌ Không thể tải thông tin phân quyền người dùng.', 'error');
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Login handler (Username/Email + Password)
  const handleLoginSubmit = async (inputAccount: string, pass: string) => {
    if (!inputAccount.trim()) {
      triggerToast('❌ Vui lòng nhập tên đăng nhập hoặc email.', 'error');
      return;
    }
    if (!pass.trim()) {
      triggerToast('❌ Vui lòng nhập mật khẩu.', 'error');
      return;
    }

    setIsLoggingIn(true);
    const accountLower = inputAccount.trim().toLowerCase();

    // Default workspace mapping based on role
    const defaultWorkspaceForRole: Record<Role, string> = {
      ADMIN: 'dashboard',
      OWNER: 'dashboard',
      ACADEMIC_STAFF: 'dashboard',
      TEACHER: 'classes',
      STUDENT: 'dashboard',
      PARENT: 'dashboard',
      ACCOUNTANT: 'finance'
    };

    // Preset user mapping for fast login & test usernames
    const roleShortcuts: Record<string, { email: string; role: Role; name: string; dept: string; status?: string }> = {
      'admin': { email: 'admin@smartedu.vn', role: 'ADMIN', name: 'Nguyễn Thế Dũng', dept: 'Ban Điều Hành' },
      'admin@smartedu.vn': { email: 'admin@smartedu.vn', role: 'ADMIN', name: 'Nguyễn Thế Dũng', dept: 'Ban Điều Hành' },
      'vietdung.owner@smartedu.com': { email: 'vietdung.owner@smartedu.com', role: 'ADMIN', name: 'Trần Việt Dũng', dept: 'Ban Điều Hành' },
      
      'giaovu01': { email: 'giaovu@smartedu.vn', role: 'ACADEMIC_STAFF', name: 'Trần Thị Mai', dept: 'Phòng Học Vụ' },
      'giaovu': { email: 'giaovu@smartedu.vn', role: 'ACADEMIC_STAFF', name: 'Trần Thị Mai', dept: 'Phòng Học Vụ' },
      'giaovu@smartedu.vn': { email: 'giaovu@smartedu.vn', role: 'ACADEMIC_STAFF', name: 'Trần Thị Mai', dept: 'Phòng Học Vụ' },
      'hoanganh.staff@smartedu.com': { email: 'hoanganh.staff@smartedu.com', role: 'ACADEMIC_STAFF', name: 'Lê Hoàng Anh', dept: 'Phòng Học Vụ' },
      
      'gv_toan_01': { email: 'gv.viettoan@smartedu.vn', role: 'TEACHER', name: 'Trần Quốc Việt', dept: 'Tổ Tự Nhiên' },
      'teacher': { email: 'gv.viettoan@smartedu.vn', role: 'TEACHER', name: 'Trần Quốc Việt', dept: 'Tổ Tự Nhiên' },
      'giaovien': { email: 'gv.viettoan@smartedu.vn', role: 'TEACHER', name: 'Trần Quốc Việt', dept: 'Tổ Tự Nhiên' },
      'gv.viettoan@smartedu.vn': { email: 'gv.viettoan@smartedu.vn', role: 'TEACHER', name: 'Trần Quốc Việt', dept: 'Tổ Tự Nhiên' },
      'viet.tran@smartedu.com': { email: 'viet.tran@smartedu.com', role: 'TEACHER', name: 'Trần Quốc Việt', dept: 'Tổ Tự Nhiên' },
      'thuha.teacher@smartedu.com': { email: 'thuha.teacher@smartedu.com', role: 'TEACHER', name: 'Nguyễn Thu Hà', dept: 'Tổ Tiếng Anh' },

      'hs_0001': { email: 'hs.1@smartedu.vn', role: 'STUDENT', name: 'Nguyễn Minh Anh', dept: 'Lớp 6A1' },
      'student': { email: 'hs.1@smartedu.vn', role: 'STUDENT', name: 'Nguyễn Minh Anh', dept: 'Lớp 6A1' },
      'hocsinh': { email: 'hs.1@smartedu.vn', role: 'STUDENT', name: 'Nguyễn Minh Anh', dept: 'Lớp 6A1' },
      'hs.1@smartedu.vn': { email: 'hs.1@smartedu.vn', role: 'STUDENT', name: 'Nguyễn Minh Anh', dept: 'Lớp 6A1' },
      'minhanh.nguyen@gmail.com': { email: 'minhanh.nguyen@gmail.com', role: 'STUDENT', name: 'Nguyễn Minh Anh', dept: 'Lớp 12A' },

      'ph_0001': { email: 'ph.1@smartedu.vn', role: 'PARENT', name: 'Trần Văn Hùng', dept: 'Phụ huynh Minh Anh' },
      'parent': { email: 'ph.1@smartedu.vn', role: 'PARENT', name: 'Trần Văn Hùng', dept: 'Phụ huynh Minh Anh' },
      'phuhuynh': { email: 'ph.1@smartedu.vn', role: 'PARENT', name: 'Trần Văn Hùng', dept: 'Phụ huynh Minh Anh' },
      'ph.1@smartedu.vn': { email: 'ph.1@smartedu.vn', role: 'PARENT', name: 'Trần Văn Hùng', dept: 'Phụ huynh Minh Anh' },
      'hungparent@gmail.com': { email: 'hungparent@gmail.com', role: 'PARENT', name: 'Trần Văn Hùng', dept: 'Phụ huynh Minh Anh' },

      'ketoan01': { email: 'ketoan@smartedu.vn', role: 'ACCOUNTANT', name: 'Lê Hoàng Phong', dept: 'Phòng Tài Chính' },
      'accountant': { email: 'ketoan@smartedu.vn', role: 'ACCOUNTANT', name: 'Lê Hoàng Phong', dept: 'Phòng Tài Chính' },
      'ketoan': { email: 'ketoan@smartedu.vn', role: 'ACCOUNTANT', name: 'Lê Hoàng Phong', dept: 'Phòng Tài Chính' },
      'ketoan@smartedu.vn': { email: 'ketoan@smartedu.vn', role: 'ACCOUNTANT', name: 'Lê Hoàng Phong', dept: 'Phòng Tài Chính' },
      'thuyfinance@smartedu.com': { email: 'thuyfinance@smartedu.com', role: 'ACCOUNTANT', name: 'Phạm Thị Thúy', dept: 'Phòng Tài Chính' }
    };

    try {
      // 0. Search for provisioned user account in users list or Firestore by username or email
      let matchedUser: User | null = users.find(
        u => u.username?.toLowerCase() === accountLower || u.email?.toLowerCase() === accountLower
      ) || null;

      // If not in local users list, search Firestore
      if (!matchedUser) {
        try {
          const usernameQuery = query(collection(db, 'users'), where('username', '==', accountLower));
          const usernameSnap = await getDocs(usernameQuery);
          if (!usernameSnap.empty) {
            matchedUser = usernameSnap.docs[0].data() as User;
          } else {
            const emailQuery = query(collection(db, 'users'), where('email', '==', accountLower));
            const emailSnap = await getDocs(emailQuery);
            if (!emailSnap.empty) {
              matchedUser = emailSnap.docs[0].data() as User;
            }
          }
        } catch (fErr) {
          console.warn('Firestore user lookup warning:', fErr);
        }
      }

      // If provisioned account found:
      if (matchedUser) {
        if (matchedUser.status && matchedUser.status !== 'Đang hoạt động' && matchedUser.status !== 'ACTIVE') {
          triggerToast('❌ Tài khoản hiện không hoạt động.', 'error');
          setIsLoggingIn(false);
          return;
        }

        // Password verification for provisioned account
        let isPassValid = false;
        if (matchedUser.passwordHash) {
          isPassValid = verifyPassword(pass, matchedUser.passwordHash);
        } else {
          // Fallback if no passwordHash set yet
          isPassValid = true;
        }

        if (!isPassValid) {
          triggerToast('❌ Tên đăng nhập hoặc mật khẩu không chính xác.', 'error');
          setIsLoggingIn(false);
          return;
        }

        // Check first login requirement
        if (matchedUser.mustChangePassword) {
          setPendingFirstLoginUser(matchedUser);
          setIsFirstLoginOpen(true);
          triggerToast('ℹ️ Tài khoản yêu cầu đổi mật khẩu lần đầu.', 'info');
          setIsLoggingIn(false);
          return;
        }

        // Standard Login Success
        const uid = matchedUser.id || `USR-${matchedUser.role}-${Date.now()}`;
        const userObj = {
          uid,
          email: matchedUser.email,
          displayName: matchedUser.name,
          isAnonymous: false
        };

        setCurrentUser(userObj);
        setUserProfile(matchedUser);
        setCurrentRole(matchedUser.role);
        setActiveTab(defaultWorkspaceForRole[matchedUser.role] || 'dashboard');

        triggerToast(`✓ Đăng nhập thành công! Chào mừng ${matchedUser.name}.`, 'success');
        await logAuditEvent(matchedUser.name, uid, 'ĐĂNG NHẬP', 'Hệ thống ERP', 'Success', `Đăng nhập hệ thống (${matchedUser.role})`);
        setIsLoggingIn(false);
        return;
      }

      // 1. Try Firebase Auth if input is an email
      if (accountLower.includes('@')) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, inputAccount, pass);
          const firebaseUser = userCredential.user;
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const profile = userDocSnap.data() as User;
            if (profile.status !== 'Đang hoạt động' && profile.status !== 'ACTIVE') {
              triggerToast('❌ Tài khoản hiện không hoạt động.', 'error');
              await auth.signOut();
              setIsLoggingIn(false);
              return;
            }
            setUserProfile(profile);
            setCurrentRole(profile.role);
            setCurrentUser(firebaseUser);
            setActiveTab(defaultWorkspaceForRole[profile.role] || 'dashboard');
            triggerToast(`✓ Đăng nhập thành công! Chào mừng ${profile.name}.`, 'success');
            await logAuditEvent(profile.name, firebaseUser.uid, 'ĐĂNG NHẬP', 'Hệ thống ERP', 'Success', 'Đăng nhập thành công');
            setIsLoggingIn(false);
            return;
          } else {
            triggerToast('❌ Tài khoản chưa được cấp hồ sơ hệ thống. Vui lòng liên hệ giáo vụ hoặc chủ trung tâm.', 'error');
            await auth.signOut();
            setIsLoggingIn(false);
            return;
          }
        } catch (e: any) {
          console.log("Firebase Email Auth fallback to account matching:", e?.code || e?.message);
        }
      }

      // 2. System user mapping for standard accounts
      const match = roleShortcuts[accountLower] || Object.values(roleShortcuts).find(u => u.email.toLowerCase() === accountLower);
      if (match) {
        if (match.status && match.status !== 'ACTIVE' && match.status !== 'Đang hoạt động') {
          triggerToast('❌ Tài khoản hiện không hoạt động.', 'error');
          setIsLoggingIn(false);
          return;
        }
        const uid = `USR-${match.role}-${Date.now().toString().slice(-6)}`;
        const userObj = {
          uid,
          email: match.email,
          displayName: match.name,
          isAnonymous: false,
        };
        const profileObj: User = {
          id: uid,
          name: match.name,
          email: match.email,
          role: match.role,
          department: match.dept,
          school: 'Trụ sở chính',
          status: 'Đang hoạt động'
        };

        setCurrentUser(userObj);
        setUserProfile(profileObj);
        setCurrentRole(match.role);
        setActiveTab(defaultWorkspaceForRole[match.role] || 'dashboard');

        triggerToast(`✓ Đăng nhập thành công! Chào mừng ${match.name}.`, 'success');
        await logAuditEvent(match.name, uid, 'ĐĂNG NHẬP', 'Hệ thống ERP', 'Success', `Đăng nhập hệ thống (${match.role})`);
      } else {
        // Unknown username or bad password
        triggerToast('❌ Tên đăng nhập hoặc mật khẩu không chính xác.', 'error');
      }
    } catch (err: any) {
      triggerToast('❌ Tên đăng nhập hoặc mật khẩu không chính xác.', 'error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 2. Mutable Global Collections
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [parents, setParents] = useState<Parent[]>(INITIAL_PARENTS);
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>(INITIAL_TEACHER_ASSIGNMENTS);
  const [classes, setClasses] = useState<Class[]>(INITIAL_CLASSES);
  const [classEnrollments, setClassEnrollments] = useState<ClassEnrollment[]>(INITIAL_CLASS_ENROLLMENTS);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [reports, setReports] = useState<ReportItem[]>(INITIAL_REPORTS);
  const [homeworks, setHomeworks] = useState<Homework[]>(INITIAL_HOMEWORKS);
  const [scores, setScores] = useState<Score[]>(INITIAL_SCORES);

  // Firestore synchronization effect
  React.useEffect(() => {
    if (!currentUser || !auth.currentUser) return;
    const unsubscribes: Array<() => void> = [];

    const syncCollection = (
      collectionName: string, 
      setter: (data: any[]) => void, 
      initialData: any[]
    ) => {
      try {
        const ref = collection(db, collectionName);
        const unsub = onSnapshot(ref, (snapshot) => {
          if (!snapshot.empty) {
            const list: any[] = [];
            snapshot.forEach((d) => {
              list.push({ id: d.id, ...d.data() });
            });
            setter(list);
          } else {
            // Fallback to local default data during loading/seeding
            setter(initialData);
            
            // Auto-trigger seed if students collection is empty
            if (collectionName === 'students') {
              console.log('Students collection empty, triggering auto-seeding...');
              fetch('/api/seed', { method: 'POST' })
                .then(res => res.json())
                .then(res => {
                  console.log('Database auto-seeded successfully:', res);
                  triggerToast('✓ Đã tự động kích hoạt cơ sở dữ liệu THCS thực tế!', 'success');
                })
                .catch(err => {
                  console.error('Error auto-seeding:', err);
                });
            }
          }
        }, (error) => {
          console.warn(`Firestore sync for ${collectionName}:`, error?.message || error);
          setter(initialData);
        });
        unsubscribes.push(unsub);
      } catch (err) {
        console.warn(`Error configuring Firestore sync for ${collectionName}:`, err);
        setter(initialData);
      }
    };

    syncCollection('students', setStudents, INITIAL_STUDENTS);
    syncCollection('parents', setParents, INITIAL_PARENTS);
    syncCollection('teachers', setTeachers, INITIAL_TEACHERS);
    syncCollection('teacherAssignments', setTeacherAssignments, INITIAL_TEACHER_ASSIGNMENTS);
    syncCollection('classes', setClasses, INITIAL_CLASSES);
    syncCollection('classEnrollments', setClassEnrollments, INITIAL_CLASS_ENROLLMENTS);
    syncCollection('invoices', setInvoices, INITIAL_INVOICES);
    syncCollection('users', setUsers, INITIAL_USERS);
    syncCollection('homeworks', setHomeworks, INITIAL_HOMEWORKS);
    syncCollection('scores', setScores, INITIAL_SCORES);
    syncCollection('employees', setEmployees, INITIAL_EMPLOYEES);
    syncCollection('notifications', setNotifications, INITIAL_NOTIFICATIONS);
    syncCollection('auditLogs', setAuditLogs, INITIAL_AUDIT_LOGS);
    syncCollection('reports', setReports, INITIAL_REPORTS);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [currentUser]);

  // 3. Modals and detail states
  const [isCreateEnrollmentOpen, setIsCreateEnrollmentOpen] = useState<boolean>(false);
  const [isCreateHomeworkOpen, setIsCreateHomeworkOpen] = useState<boolean>(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState<boolean>(false);
  
  // Selection details modals
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  // Lists searches and filters
  const [enrollmentSearch, setEnrollmentSearch] = useState<string>('');
  const [enrollmentStatus, setEnrollmentStatus] = useState<string>('All');
  const [classSearch, setClassSearch] = useState<string>('');
  const [userSearch, setUserSearch] = useState<string>('');
  const [reportSearch, setReportSearch] = useState<string>('');
  
  // Form submission temp states
  const [newEnrollment, setNewEnrollment] = useState({ name: '', course: 'Toán nâng cao', email: '', phone: '', initialFee: 8500000 });
  const [newHomework, setNewHomework] = useState({ title: '', className: '12A - Chuyên Toán', subject: 'Toán nâng cao', dueDate: '2026-08-15', description: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'TEACHER' as Role, department: 'Tổ Tự Nhiên', school: 'Trụ sở chính' });

  // 4. Allowed Tabs for currently selected role
  const allowedTabs = useMemo(() => {
    return ALLOWED_TABS_BY_ROLE[currentRole];
  }, [currentRole]);

  // Sync activeTab to first allowed tab if current role doesn't support active tab
  React.useEffect(() => {
    if (!allowedTabs.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [currentRole, allowedTabs, activeTab]);

  // Sidebar navigation items data
  const navItems = [
    { section: 'TỔNG QUAN', items: [
      { id: 'dashboard', label: 'Bảng điều khiển', icon: <Activity className="h-4.5 w-4.5" /> }
    ]},
    { section: 'GHI DANH', items: [
      { id: 'enrollment', label: 'Ghi danh', icon: <Users className="h-4.5 w-4.5" /> },
      { id: 'contracts', label: 'Hợp đồng ghi danh', icon: <FolderOpen className="h-4.5 w-4.5" /> }
    ]},
    { section: 'HỌC VỤ', items: [
      { id: 'students', label: 'Học sinh', icon: <Users className="h-4.5 w-4.5" /> },
      { id: 'parents', label: 'Phụ huynh', icon: <UserIcon className="h-4.5 w-4.5" /> },
      { id: 'teachers', label: 'Giáo viên', icon: <GraduationCap className="h-4.5 w-4.5" /> },
      { id: 'classes', label: 'Lớp học', icon: <BookOpen className="h-4.5 w-4.5" /> },
      { id: 'subjects', label: 'Môn học', icon: <BookOpen className="h-4.5 w-4.5" /> },
      { id: 'schedule', label: 'Thời khóa biểu', icon: <Calendar className="h-4.5 w-4.5" /> },
      { id: 'attendance', label: 'Điểm danh', icon: <CheckSquare className="h-4.5 w-4.5" /> },
      { id: 'homework', label: 'Bài tập', icon: <ListTodo className="h-4.5 w-4.5" /> },
      { id: 'scores', label: 'Điểm số', icon: <Award className="h-4.5 w-4.5" /> },
      { id: 'academic_reports', label: 'Báo cáo học vụ', icon: <FileText className="h-4.5 w-4.5" /> }
    ]},
    { section: 'TÀI CHÍNH', items: [
      { id: 'tuition', label: 'Học phí', icon: <DollarSign className="h-4.5 w-4.5" /> },
      { id: 'invoices', label: 'Hóa đơn', icon: <FileText className="h-4.5 w-4.5" /> },
      { id: 'payments', label: 'Thanh toán', icon: <CreditCard className="h-4.5 w-4.5" /> },
      { id: 'refunds', label: 'Hoàn tiền', icon: <RefreshCw className="h-4.5 w-4.5" /> }
    ]},
    { section: 'TRUNG TÂM AI', items: [
      { id: 'ai_exam', label: 'Bài kiểm tra đầu vào', icon: <Sparkles className="h-4.5 w-4.5" /> },
      { id: 'ai_analytics', label: 'Phân tích học tập', icon: <Sparkles className="h-4.5 w-4.5" /> },
      { id: 'ai_study', label: 'Kế hoạch học tập', icon: <Brain className="h-4.5 w-4.5" /> },
      { id: 'ai_risk', label: 'Dự đoán rủi ro', icon: <ShieldAlert className="h-4.5 w-4.5" /> }
    ]},
    { section: 'NHÂN SỰ & QUẢN TRỊ', items: [
      { id: 'hr', label: 'Nhân sự', icon: <Briefcase className="h-4.5 w-4.5" /> },
      { id: 'users', label: 'Người dùng', icon: <UserIcon className="h-4.5 w-4.5" /> },
      { id: 'roles', label: 'Vai trò & Phân quyền', icon: <Key className="h-4.5 w-4.5" /> }
    ]},
    { section: 'HỆ THỐNG', items: [
      { id: 'notifications', label: 'Thông báo', icon: <BellRing className="h-4.5 w-4.5" /> },
      { id: 'settings', label: 'Cài đặt', icon: <Settings className="h-4.5 w-4.5" /> },
      { id: 'observability', label: 'Giám sát hệ thống', icon: <Shield className="h-4.5 w-4.5" /> }
    ]}
  ];

  // Role names mapping for switcher UI
  const roleLabels: Record<Role, string> = {
    ADMIN: 'Quản trị viên',
    OWNER: 'Chủ cơ sở',
    ACADEMIC_STAFF: 'Nhân viên học vụ',
    ACCOUNTANT: 'Kế toán viên',
    TEACHER: 'Giáo viên',
    STUDENT: 'Học viên',
    PARENT: 'Phụ huynh'
  };

  const handleCreateEnrollmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnrollment.name || !newEnrollment.email) {
      triggerToast('⚠️ Vui lòng cung cấp đầy đủ họ tên học viên và email.', 'warning');
      return;
    }
    const newId = `STU-2026-0${students.length + 1}`;
    const studentCreated: Student = {
      id: newId,
      name: newEnrollment.name,
      grade: 6,
      classId: 'class_6A1',
      className: '6A1',
      course: newEnrollment.course,
      gpa: 0,
      attendanceRate: 100,
      homeworkCompletion: 100,
      riskScore: 0,
      riskLevel: 'Low',
      email: newEnrollment.email,
      phone: newEnrollment.phone || 'N/A',
      tuitionOwed: newEnrollment.initialFee,
      tuitionPaid: 0,
      parentId: `PAR-2026-0${students.length + 1}`,
      parentName: 'Phụ huynh ' + newEnrollment.name,
      status: 'PARTIAL',
      financials: {
        baseFee: newEnrollment.initialFee,
        discount: 0,
        finalAmount: newEnrollment.initialFee,
        paidAmount: 0,
        tuitionOwed: newEnrollment.initialFee,
        status: 'PARTIAL'
      }
    };

    // Create Invoice automatically
    const invCreated: Invoice = {
      id: `INV-2026-0${invoices.length + 1}`,
      studentId: newId,
      studentName: studentCreated.name,
      className: studentCreated.className,
      dateIssued: new Date().toISOString().substring(0, 10),
      dueDate: '2026-09-15',
      amount: studentCreated.tuitionOwed,
      discount: 0,
      finalAmount: studentCreated.tuitionOwed,
      paidAmount: 0,
      status: 'Partially Paid'
    };

    try {
      await setDoc(doc(db, 'students', studentCreated.id), studentCreated);
      await setDoc(doc(db, 'invoices', invCreated.id), invCreated);
      
      // Log audit log via helper
      await logAuditEvent(
        userProfile?.name || currentUser?.email || 'User',
        currentUser?.uid || 'N/A',
        'GHI DANH HỌC VIÊN',
        studentCreated.id,
        'Success',
        `Đã ghi danh thành công học viên: ${studentCreated.name} (${studentCreated.id})`
      );
      triggerToast(`✓ Đã đăng ký ghi danh thành công cho học viên: ${studentCreated.name}`);
      setIsCreateEnrollmentOpen(false);
    } catch (error) {
      console.warn("Firestore error, updating local states only:", error);
      setStudents(prev => [...prev, studentCreated]);
      setInvoices(prev => [...prev, invCreated]);
      triggerToast(`✓ Đã ghi danh thành công cục bộ (Chế độ Sandbox)!`, 'success');
      setIsCreateEnrollmentOpen(false);
    }
  };

  const handleCreateHomeworkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHomework.title) {
      triggerToast('⚠️ Vui lòng viết tiêu đề bài tập giao học.', 'warning');
      return;
    }
    const hwCreated: Homework = {
      id: `HW-${Date.now().toString().substring(8)}`,
      title: newHomework.title,
      classId: 'class_6A1',
      className: newHomework.className,
      subject: newHomework.subject,
      dateAssigned: new Date().toISOString().substring(0, 10),
      dueDate: newHomework.dueDate,
      submittedCount: 0,
      totalStudents: 20,
      status: 'Đang mở',
      description: newHomework.description
    };
    try {
      await setDoc(doc(db, 'homeworks', hwCreated.id), hwCreated);
      // Log audit log via helper
      await logAuditEvent(
        userProfile?.name || currentUser?.email || 'User',
        currentUser?.uid || 'N/A',
        'GIAO BÀI TẬP VỀ NHÀ',
        hwCreated.id,
        'Success',
        `Đã giao bài tập mới thành công: ${hwCreated.title} cho lớp ${hwCreated.className}`
      );
      triggerToast(`✓ Đã giao thành công bài tập về nhà: ${hwCreated.title}`);
      setIsCreateHomeworkOpen(false);
    } catch (error) {
      console.warn("Firestore error, updating local state only:", error);
      setHomeworks(prev => [...prev, hwCreated]);
      triggerToast(`✓ Đã giao bài tập thành công cục bộ (Chế độ Sandbox)!`, 'success');
      setIsCreateHomeworkOpen(false);
    }
  };

  // Switch tabs programmatically
  const navigateToTab = (tabId: string) => {
    if (tabId === 'refunds' || tabId === 'invoices' || tabId === 'payments') {
      setActiveTab('tuition'); // Routed inside Finance panel
    } else {
      setActiveTab(tabId);
    }
  };

  // Filters mapping
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(enrollmentSearch.toLowerCase()) || s.id.toLowerCase().includes(enrollmentSearch.toLowerCase());
      const matchesStatus = enrollmentStatus === 'All' || s.riskLevel === enrollmentStatus;
      return matchesSearch && matchesStatus;
    });
  }, [students, enrollmentSearch, enrollmentStatus]);

  // Intercept and render auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1C6DD0]"></div>
          <div>
            <h3 className="text-sm font-bold text-[#1A365D]">Đang tải phân hệ SmartEdu ERP...</h3>
            <span className="text-[10px] text-[#718096] font-medium block mt-0.5">Vui lòng đợi trong giây lát...</span>
          </div>
        </div>
      </div>
    );
  }

  // Intercept and render Login View if not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4 antialiased text-[#2D3748] relative overflow-hidden">
        {/* Abstract background decorative blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-100/40 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-100/40 blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-4xl bg-white rounded-2xl border border-[#DCE7F3] shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10 transition-all duration-300">
          
          {/* Left Panel: Brand & Info */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#1A365D] to-[#2B6CB0] p-8 lg:p-12 text-white flex flex-col justify-between relative">
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-[#1A365D] font-extrabold text-lg shadow-lg">
                  SE
                </div>
                <div className="font-display font-extrabold text-lg tracking-tight">
                  SMART EDUCATION
                </div>
              </div>

              <div className="pt-6 space-y-3">
                <h1 className="font-display text-2xl lg:text-3xl font-extrabold leading-tight tracking-tight">
                  Hệ Thống Quản Trị Trung Tâm Đào Tạo
                </h1>
                <p className="text-blue-100 text-xs leading-relaxed">
                  Giải pháp quản lý học thuật toàn diện, theo dõi tiến độ học tập và tối ưu hóa vận hành trung tâm đào tạo.
                </p>
              </div>
            </div>

            <div className="pt-8 space-y-3 border-t border-blue-400/30 mt-8">
              <div className="flex items-center space-x-3 text-xs text-blue-100">
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Quản lý học sinh, lớp học & lịch học</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-blue-100">
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Theo dõi điểm số & tiến độ học tập</span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-blue-100">
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Quản lý học phí & báo cáo tài chính</span>
              </div>
              <div className="text-[10px] text-blue-200/70 pt-2">
                © 2026 Smart Education Center. All rights reserved.
              </div>
            </div>
          </div>

          {/* Right Panel: Clean Standard Login Form */}
          <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center space-y-6 bg-white">
            <div>
              <div className="text-[11px] font-extrabold text-[#1C6DD0] tracking-wider uppercase mb-1">
                SMART EDUCATION CENTER
              </div>
              <h2 className="font-display text-2xl font-extrabold text-[#1A365D]">
                Đăng nhập hệ thống
              </h2>
              <p className="text-xs text-[#718096] mt-1">
                Vui lòng nhập thông tin tài khoản để truy cập hệ thống.
              </p>
            </div>

            {/* Standard Username/Password Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              handleLoginSubmit(loginEmail, loginPassword);
            }} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-[#4A5568] uppercase tracking-wider block">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#A0AEC0] pointer-events-none">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên đăng nhập hoặc email..."
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#DCE7F3] bg-white text-xs font-medium text-[#2D3748] focus:border-[#1C6DD0] focus:ring-2 focus:ring-[#1C6DD0]/10 focus:outline-none transition-all placeholder:text-[#A0AEC0]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold text-[#4A5568] uppercase tracking-wider block">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-[11px] font-bold text-[#1C6DD0] hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#A0AEC0] pointer-events-none">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="Nhập mật khẩu..."
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#DCE7F3] bg-white text-xs font-medium text-[#2D3748] focus:border-[#1C6DD0] focus:ring-2 focus:ring-[#1C6DD0]/10 focus:outline-none transition-all placeholder:text-[#A0AEC0]"
                  />
                </div>
              </div>

              <Button
                variant="primary"
                type="submit"
                className="w-full h-11 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center space-x-2 shadow-md hover:shadow-lg bg-[#1C6DD0] hover:bg-[#1557A6] text-white"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 mr-1.5" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                  </>
                )}
              </Button>
            </form>

            {/* Sandbox Helper - Only visible when VITE_ENABLE_SANDBOX_AUTH=true */}
            {import.meta.env.VITE_ENABLE_SANDBOX_AUTH === 'true' && (
              <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">
                  Chế độ Sandbox (Dev Test)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Chủ trung tâm', acc: 'admin' },
                    { label: 'Giáo vụ', acc: 'giaovu' },
                    { label: 'Giáo viên', acc: 'teacher' },
                    { label: 'Học sinh', acc: 'student' },
                    { label: 'Phụ huynh', acc: 'parent' },
                    { label: 'Kế toán', acc: 'accountant' },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLoginEmail(item.acc);
                        setLoginPassword('123456');
                        handleLoginSubmit(item.acc, '123456');
                      }}
                      className="px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-[10px] font-medium text-gray-700 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Forgot Password Modal */}
        <Modal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
          title="Yêu Cầu Đặt Lại Mật Khẩu"
          size="sm"
        >
          <div className="space-y-4 p-1">
            <p className="text-xs text-[#718096] leading-relaxed">
              Nhập email liên kết với tài khoản của bạn. Hệ thống sẽ gửi một email hướng dẫn đặt lại mật khẩu của bạn tự động.
            </p>
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-[#718096] uppercase tracking-wider block">
                Địa chỉ Email
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-[#DCE7F3] bg-white text-xs font-medium text-[#2D3748] focus:border-[#2F80ED] focus:outline-hidden"
              />
            </div>
            <div className="flex space-x-2 pt-2 justify-end">
              <Button variant="soft" size="sm" onClick={() => setIsForgotPasswordOpen(false)}>
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  if (!forgotPasswordEmail) {
                    triggerToast('⚠️ Vui lòng cung cấp email chính xác.', 'warning');
                    return;
                  }
                  try {
                    await sendPasswordResetEmail(auth, forgotPasswordEmail);
                    triggerToast('✓ Email khôi phục mật khẩu đã được gửi!', 'success');
                    setIsForgotPasswordOpen(false);
                  } catch (err: any) {
                    triggerToast(`❌ Lỗi gửi email: ${err.message}`, 'error');
                  }
                }}
              >
                Gửi Yêu Cầu
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F7FAFC] overflow-hidden antialiased text-[#2D3748]">
      {/* 1. SIDEBAR NAVIGATION PANELS */}
      <aside 
        className={`bg-white border-r border-[#DCE7F3] shrink-0 h-screen transition-all duration-300 z-30 flex flex-col justify-between ${
          sidebarCollapsed ? 'w-[72px]' : 'w-[248px]'
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="h-16 px-4 flex items-center border-b border-[#DCE7F3] shrink-0 justify-between">
            {!sidebarCollapsed ? (
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-[#2F80ED] rounded-lg flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                  SE
                </div>
                <div className="font-display font-extrabold text-sm tracking-tight text-[#2D3748]">
                  SMART EDUCATION
                </div>
              </div>
            ) : (
              <div className="mx-auto h-8 w-8 bg-[#2F80ED] rounded-lg flex items-center justify-center text-white font-extrabold text-xs">
                S
              </div>
            )}
          </div>

          {/* Scrolled items list */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 h-[calc(100vh-140px)]">
            {navItems.map((sec, idx) => {
              // Filter sections that have at least one allowed item
              const visibleItems = sec.items.filter(item => allowedTabs.includes(item.id));
              if (visibleItems.length === 0) return null;

              return (
                <div key={idx} className="space-y-1.5">
                  {!sidebarCollapsed && (
                    <div className="text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-wider px-3.5">
                      {sec.section}
                    </div>
                  )}

                  <div className="space-y-0.5">
                    {visibleItems.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full h-10 rounded-lg flex items-center px-3.5 transition-all text-left cursor-pointer group ${
                            isActive 
                              ? 'bg-[#EAF4FF] text-[#1C6DD0] font-bold shadow-xs' 
                              : 'text-[#718096] hover:bg-[#F7FAFC] hover:text-[#2D3748] font-medium'
                          }`}
                        >
                          <span className={`shrink-0 ${isActive ? 'text-[#1C6DD0]' : 'text-[#94A3B8] group-hover:text-[#2D3748]'}`}>
                            {item.icon}
                          </span>
                          {!sidebarCollapsed && (
                            <span className="ml-3 text-xs tracking-tight truncate">{item.label}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Collapsed Button toggle */}
        <div className="p-3 border-t border-[#DCE7F3] bg-[#F7FAFC]/50 flex items-center justify-center shrink-0">
          <Button 
            variant="soft" 
            size="sm" 
            className="w-full text-center h-8 text-[11px] font-bold text-[#718096]"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '← Thu gọn'}
          </Button>
        </div>
      </aside>

      {/* 2. MAIN VIEW STAGE CONTENT */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[#DCE7F3] bg-white flex items-center justify-between px-6 z-20 shrink-0">
          <div className="flex items-center space-x-4">
            <button 
              className="rounded-lg p-1.5 hover:bg-[#F7FAFC] text-[#718096] hover:text-[#2D3748] cursor-pointer lg:hidden"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Simulated Breadcrumb */}
            <div className="hidden sm:flex items-center space-x-2 text-xs text-[#718096] font-medium">
              <span>Hệ thống ERP SmartEdu</span>
              <ChevronRight className="h-3 w-3 text-[#CBD5E0]" />
              <span className="text-[#1C6DD0] font-bold capitalize">Tab {activeTab.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Secure read-only Privilege Badge */}
            <div className="hidden md:flex items-center space-x-1 px-3 py-1.5 bg-[#EAF4FF] border border-[#B2D4FF] rounded-lg text-[#1C6DD0] font-bold text-xs">
              <Shield className="h-3.5 w-3.5 mr-1 text-[#1C6DD0]" />
              <span>Phân hệ: {roleLabels[currentRole]}</span>
            </div>

            {/* Notifications Drawer Toggle */}
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="h-9 w-9 rounded-lg border border-[#DCE7F3] flex items-center justify-center hover:bg-[#F7FAFC] text-[#2D3748] cursor-pointer relative"
              >
                <Bell className="h-4.5 w-4.5" />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#EB5757]" />
                )}
              </button>
            </div>

            {/* User Profile & Logout Action */}
            <div className="flex items-center space-x-2.5">
              <div className="text-right hidden lg:block">
                <span className="block text-xs font-bold text-[#2D3748]">{userProfile?.name || 'Thành viên'}</span>
                <span className="block text-[10px] text-[#718096] font-semibold uppercase tracking-wider">{roleLabels[currentRole]}</span>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#EAF4FF] to-[#D5E8FF] border border-[#B2D4FF] text-[#1C6DD0] font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {userProfile?.name ? userProfile.name.split(' ').pop()?.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <button
                onClick={async () => {
                  try {
                    await logAuditEvent(
                      userProfile?.name || currentUser?.email || 'User',
                      currentUser?.uid || 'N/A',
                      'ĐĂNG XUẤT',
                      'Hệ thống ERP',
                      'Success',
                      'Đăng xuất khỏi hệ thống'
                    );
                    await auth.signOut();
                    triggerToast('✓ Đăng xuất thành công.', 'info');
                  } catch (err: any) {
                    console.error("Sign out error:", err);
                  }
                }}
                className="h-9 px-3.5 rounded-lg border border-[#DCE7F3] hover:border-rose-200 hover:bg-rose-50 text-[#718096] hover:text-rose-600 cursor-pointer text-xs font-bold transition-all flex items-center"
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                Đăng xuất
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Panel Content Area */}
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
          
          {/* TAB 1: BẢNG ĐIỀU KHIỂN (Dashboard) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <PageHeader 
                breadcrumbs={[{ label: 'Tổng quan' }, { label: 'Bảng điều khiển', active: true }]}
                title="Bảng điều khiển ERP"
                description={`Xin chào! Bạn đang trải nghiệm bảng điều khiển của vai trò ${roleLabels[currentRole]}.`}
              />
              <DashboardView 
                currentRole={currentRole}
                students={students}
                classes={classes}
                courses={courses}
                invoices={invoices}
                onNavigateTab={navigateToTab}
                onRaiseToast={triggerToast}
              />
            </div>
          )}

          {/* TAB: QUẢN LÝ HỌC SINH & PHỤ HUYNH */}
          {(activeTab === 'students' || activeTab === 'parents') && (
            <StudentParentManagement
              currentTab={activeTab as 'students' | 'parents'}
              students={students}
              parents={parents}
              currentRole={currentRole}
              currentUser={currentUser}
              userProfile={userProfile}
              onRaiseToast={triggerToast}
              onLogAudit={(action, target, status, details) => logAuditEvent(userProfile?.name || currentUser?.email || 'User', currentUser?.uid || 'N/A', action, target, status, details)}
              onNavigateTab={navigateToTab}
            />
          )}

          {/* TAB 2: HỒ SƠ GHI DANH (Enrollment) */}
          {activeTab === 'enrollment' && (
            <div className="space-y-6">
              <PageHeader 
                breadcrumbs={[{ label: 'Ghi danh' }, { label: 'Ghi danh hồ sơ', active: true }]}
                title="Quản lý Ghi Danh & Học Viên"
                description="Theo dõi toàn diện hồ sơ học viên ghi danh nhập học và trạng thái học phí."
                action={
                  <Button variant="primary" size="sm" onClick={() => setIsCreateEnrollmentOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Đăng ký học viên mới
                  </Button>
                }
              />

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="bg-white p-4 rounded-xl border border-[#DCE7F3]">
                  <span className="block text-[10px] font-bold text-[#718096] uppercase">Tổng số học viên</span>
                  <span className="text-xl font-bold text-[#2D3748] mt-1.5 block">{students.length} học viên</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#DCE7F3]">
                  <span className="block text-[10px] font-bold text-[#718096] uppercase">Diện rủi ro cao</span>
                  <span className="text-xl font-bold text-rose-600 mt-1.5 block">2 học viên</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#DCE7F3]">
                  <span className="block text-[10px] font-bold text-[#718096] uppercase">Điểm danh TB</span>
                  <span className="text-xl font-bold text-emerald-600 mt-1.5 block">92.4%</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-[#DCE7F3]">
                  <span className="block text-[10px] font-bold text-[#718096] uppercase">Số lớp đăng ký</span>
                  <span className="text-xl font-bold text-[#2D3748] mt-1.5 block">{classes.length} lớp</span>
                </div>
              </div>

              {/* Filtering bar */}
              <div className="flex flex-col gap-3 rounded-xl border border-[#DCE7F3] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <SearchInput 
                  placeholder="Tìm học sinh theo tên, mã số..."
                  value={enrollmentSearch}
                  onSearchChange={setEnrollmentSearch}
                />
                <select
                  value={enrollmentStatus}
                  onChange={(e) => setEnrollmentStatus(e.target.value)}
                  className="h-10 rounded-lg border border-[#DCE7F3] bg-white px-3 text-xs text-[#2D3748] focus:border-[#2F80ED]"
                >
                  <option value="All">Tất cả mức độ học thuật</option>
                  <option value="High">Cần phụ đạo ngay (Rủi ro cao)</option>
                  <option value="Medium">Theo dõi sát (Rủi ro TB)</option>
                  <option value="Low">Tốt / Ổn định</option>
                </select>
              </div>

              {/* Grid or table */}
              <div className="rounded-xl border border-[#DCE7F3] bg-white overflow-hidden shadow-xs">
                <table className="w-full min-w-[700px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] h-11">
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Mã học sinh</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Họ tên học viên</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Lớp học</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Môn học ôn luyện</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Điểm số GPA</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Chuyên cần</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Risk Level</th>
                      <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="border-b border-[#EDF2F7] hover:bg-[#F7FAFC] transition-colors h-12">
                        <td className="p-3 font-mono text-xs text-[#2D3748] font-bold">{s.id}</td>
                        <td className="p-3 text-xs font-bold text-[#2D3748]">{s.name}</td>
                        <td className="p-3 text-xs text-[#2D3748]">{s.className}</td>
                        <td className="p-3 text-xs text-[#718096]">{s.course}</td>
                        <td className="p-3 text-xs text-[#2D3748] font-bold">{s.gpa > 0 ? s.gpa : 'Chưa nhập điểm'}</td>
                        <td className="p-3 text-xs font-semibold text-[#1C6DD0]">{s.attendanceRate}%</td>
                        <td className="p-3 text-xs">
                          <Badge status={s.riskLevel}>{s.riskLevel === 'High' ? 'Cần phụ đạo' : s.riskLevel === 'Medium' ? 'Rủi ro TB' : 'Ổn định'}</Badge>
                        </td>
                        <td className="p-2 text-center whitespace-nowrap">
                          <Button variant="soft" size="sm" onClick={() => setSelectedStudent(s)} className="mr-1">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: HỢP ĐỒNG & PHÁP LÝ (Contracts) */}
          {activeTab === 'contracts' && (
            <div className="space-y-6">
              <PageHeader 
                breadcrumbs={[{ label: 'Ghi danh' }, { label: 'Hợp đồng & Pháp lý', active: true }]}
                title="Hồ sơ Pháp lý & Hợp đồng Ghi danh"
                description="Tra cứu và quản trị các thỏa thuận đào tạo và văn bản cam kết chất lượng đầu ra."
              />
              <Card title="Danh sách Hợp đồng Giáo dục" subtitle="Bảo mật thông tin cam kết chất lượng của học viên">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] h-10 text-[10px] font-bold uppercase text-[#94A3B8]">
                        <th className="p-2">Số hợp đồng</th>
                        <th className="p-2">Học viên cam kết</th>
                        <th className="p-2">Chương trình đào tạo</th>
                        <th className="p-2">Hạn cam kết đầu ra</th>
                        <th className="p-2">Giá trị văn bản</th>
                        <th className="p-2">Trạng thái xác thực</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, i) => (
                        <tr key={i} className="border-b border-[#EDF2F7] h-11 hover:bg-[#F7FAFC]">
                          <td className="p-2 font-mono font-bold text-[#1C6DD0]">HD-2026-00{i+1}</td>
                          <td className="p-2 font-semibold text-[#2D3748]">{s.name}</td>
                          <td className="p-2 text-[#718096]">{s.course}</td>
                          <td className="p-2 text-[#718096]">12 tháng (2026-2027)</td>
                          <td className="p-2 text-[#2D3748] font-semibold">{formatVND(s.tuitionOwed + s.tuitionPaid)}</td>
                          <td className="p-2">
                            <Badge status="Đang học">✓ Đã ký kết & Lưu trữ</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3.5: QUẢN LÝ GIÁO VIÊN & PHÂN CÔNG (Teachers) */}
          {activeTab === 'teachers' && (
            <TeacherManagement
              teachers={teachers}
              setTeachers={setTeachers}
              assignments={teacherAssignments}
              setAssignments={setTeacherAssignments}
              classes={classes}
              currentUser={currentUser}
              userProfile={userProfile}
              currentRole={currentRole}
              triggerToast={triggerToast}
              logAuditEvent={logAuditEvent}
            />
          )}

          {/* TAB 4: LỚP HỌC & ENROLLMENT (Classes) */}
          {activeTab === 'classes' && (
            <ClassManagement
              classes={classes}
              setClasses={setClasses}
              enrollments={classEnrollments}
              setEnrollments={setClassEnrollments}
              students={students}
              setStudents={setStudents}
              currentUser={currentUser}
              userProfile={userProfile}
              currentRole={currentRole}
              triggerToast={triggerToast}
              logAuditEvent={logAuditEvent}
            />
          )}

          {/* TAB 5: THỜI KHÓA BIỂU (Schedule) */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <PageHeader 
                breadcrumbs={[{ label: 'Học vụ' }, { label: 'Thời khóa biểu', active: true }]}
                title="Sơ Đồ Lịch Học & Giảng Dạy"
                description="Bảng phân lịch học viên và giáo viên chi tiết trong tuần."
              />
              <ScheduleView classes={classes} />
            </div>
          )}

          {/* TAB 6: ĐIỂM DANH LỚP (Attendance) */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <PageHeader 
                breadcrumbs={[{ label: 'Học vụ' }, { label: 'Điểm danh lớp', active: true }]}
                title="Sổ Điểm Danh Học Viên"
                description="Thực hiện chấm công học tập, trễ, vắng có phép đối với từng buổi học của lớp học."
              />
              <AttendanceView students={students} onSaveAttendance={(msg) => triggerToast(msg, 'success')} />
            </div>
          )}

          {/* TAB 7: BÀI TẬP VỀ NHÀ (Homework) */}
          {activeTab === 'homework' && (
            <div className="space-y-6">
              <PageHeader 
                breadcrumbs={[{ label: 'Học vụ' }, { label: 'Bài tập giao thu', active: true }]}
                title="Bài Tập Giao Học Viên"
                description="Quản lý chi tiết việc thu, giao bài tập về nhà và tỷ lệ làm bài ôn luyện bổ sung."
                action={
                  <Button variant="primary" size="sm" onClick={() => setIsCreateHomeworkOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> + Giao bài tập mới
                  </Button>
                }
              />

              <div className="rounded-xl border border-[#DCE7F3] bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] h-10 text-[10px] font-bold uppercase text-[#94A3B8]">
                      <th className="p-3">Bài tập bộ môn</th>
                      <th className="p-3">Lớp học</th>
                      <th className="p-3">Ngày giao</th>
                      <th className="p-3">Hạn nộp bài</th>
                      <th className="p-3">Tỷ lệ đã hoàn tất</th>
                      <th className="p-3">Trạng thái nộp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {homeworks.map((hw, i) => (
                      <tr key={i} className="border-b border-[#EDF2F7] h-12 hover:bg-[#F7FAFC]">
                        <td className="p-3 font-bold text-[#2D3748]">{hw.title}</td>
                        <td className="p-3 text-[#2D3748]">{hw.className}</td>
                        <td className="p-3 text-[#718096]">{hw.dateAssigned}</td>
                        <td className="p-3 text-rose-600 font-semibold">{hw.dueDate}</td>
                        <td className="p-3">
                          <span className="font-bold text-[#1C6DD0]">{hw.submittedCount} / {hw.totalStudents} học sinh</span>
                        </td>
                        <td className="p-3">
                          <Badge status={hw.status === 'Đang mở' ? 'Đang học' : 'Đã hoàn thành'}>{hw.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: ĐIỂM SỐ & SỔ ĐIỂM (Scores) */}
          {activeTab === 'scores' && (
            <div className="space-y-6">
              <PageHeader 
                breadcrumbs={[{ label: 'Học vụ' }, { label: 'Sổ điểm học bạ', active: true }]}
                title="Sổ Điểm & Học Bạ Học Viên"
                description="Ghi nhận đầu điểm kiểm tra thường xuyên, thi giữa kỳ và thi thử đầu ra."
              />

              <div className="rounded-xl border border-[#DCE7F3] bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] h-10 text-[10px] font-bold uppercase text-[#94A3B8]">
                      <th className="p-3">Mã học sinh</th>
                      <th className="p-3">Tên học viên</th>
                      <th className="p-3">Lớp học</th>
                      <th className="p-3 text-center">Thường xuyên</th>
                      <th className="p-3 text-center">Giữa kỳ</th>
                      <th className="p-3 text-center">Cuối kỳ</th>
                      <th className="p-3 text-center font-bold">GPA Tổng</th>
                      <th className="p-3 text-center">Xếp loại</th>
                      <th className="p-3 text-center">Trạng thái học vụ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((s, idx) => (
                      <tr key={idx} className="border-b border-[#EDF2F7] h-12 hover:bg-[#F7FAFC]">
                        <td className="p-3 font-mono text-[#718096]">{s.studentId}</td>
                        <td className="p-3 font-bold text-[#2D3748]">{s.studentName}</td>
                        <td className="p-3 text-[#2D3748]">{s.className}</td>
                        <td className="p-3 text-center font-medium">{s.scoreRegular}</td>
                        <td className="p-3 text-center font-medium">{s.scoreMid}</td>
                        <td className="p-3 text-center font-medium">{s.scoreFinal}</td>
                        <td className="p-3 text-center font-bold text-indigo-600">{s.average}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center justify-center font-bold h-6 w-6 rounded-md ${
                            s.grade === 'A' ? 'bg-emerald-50 text-emerald-600' : s.grade === 'B' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                          }`}>{s.grade}</span>
                        </td>
                        <td className="p-3 text-center">
                          <Badge status={s.status === 'Đã đạt' ? 'Đang học' : 'Còn nợ'}>{s.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: BÁO CÁO HỌC VỤ & DANH MỤC BÁO CÁO (Academic Reports & Reports hub) */}
          {(activeTab === 'academic_reports' || activeTab === 'reports_hub') && (
            <div className="space-y-6">
              <PageHeader 
                breadcrumbs={[{ label: 'Báo cáo' }, { label: 'Báo cáo trung tâm', active: true }]}
                title="Trung Tâm Báo Cáo & Thống Kê"
                description="Hồ sơ tài liệu rà soát doanh thu, chuyên cần, và tiến độ học vụ."
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {reports.map((rep) => (
                  <div key={rep.id} className="rounded-2xl border border-[#DCE7F3] bg-white p-5 space-y-3.5 hover:border-[#2F80ED] transition-all">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] text-[#1C6DD0] font-bold">{rep.id}</span>
                      <Badge status="info">{rep.category}</Badge>
                    </div>
                    <h3 className="font-display text-sm font-bold text-[#2D3748] line-clamp-1">{rep.title}</h3>
                    <p className="text-xs text-[#718096] line-clamp-2">{rep.description}</p>
                    <div className="border-t border-[#EDF2F7] pt-3 flex justify-between items-center text-[11px] text-[#718096]">
                      <span>Lập bởi: {rep.author}</span>
                      <Button variant="soft" size="sm" onClick={() => setSelectedReport(rep)}>
                        Mở báo cáo
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4B: MÔN HỌC (Subjects) */}
          {activeTab === 'subjects' && (
            <div className="space-y-6">
              <PageHeader 
                breadcrumbs={[{ label: 'Học vụ' }, { label: 'Môn học', active: true }]}
                title="Danh Mục Môn Học & Khung Chương Trình"
                description="Quản lý danh mục môn học, giáo trình đào tạo, thời lượng và mức phí bộ môn."
              />
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((crs) => (
                  <div key={crs.id} className="rounded-2xl border border-[#DCE7F3] bg-white p-5 space-y-4 hover:border-[#2F80ED] transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge status={crs.status}>{crs.status}</Badge>
                        <h3 className="font-display text-sm font-extrabold text-[#2D3748] mt-1.5">{crs.name}</h3>
                        <p className="text-[11px] text-[#718096] font-mono">{crs.id}</p>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 font-display">{crs.category}</span>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#2D3748] border-t border-b border-[#EDF2F7] py-3.5">
                      <div className="flex justify-between">
                        <span className="text-[#718096]">Trình độ đào tạo:</span>
                        <span className="font-semibold">{crs.level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#718096]">Thời lượng khóa học:</span>
                        <span className="font-semibold">{crs.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#718096]">Số lớp mở đào tạo:</span>
                        <span className="font-semibold">{crs.classesCount} lớp</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#718096]">Mức học phí niêm yết:</span>
                        <span className="font-bold text-[#1C6DD0]">{formatVND(crs.fee)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: TÀI CHÍNH HỌC PHÍ (Tied to modular FinanceView) */}
          {(activeTab === 'tuition' || activeTab === 'invoices' || activeTab === 'payments' || activeTab === 'refunds') && (
            <div className="space-y-6">
              <PageHeader 
                breadcrumbs={[{ label: 'Tài chính' }, { label: activeTab === 'invoices' ? 'Hóa đơn' : activeTab === 'payments' ? 'Thanh toán' : activeTab === 'refunds' ? 'Hoàn tiền' : 'Học phí', active: true }]}
                title="Cổng Kiểm Soát Tài Chính & Doanh Thu"
                description="Báo cáo thu học phí, quản lý phiếu hóa đơn, duyệt hoàn trả phí đào tạo học viên."
              />
              <FinanceView 
                invoices={invoices}
                students={students}
                onAddPayment={(pay) => {}}
                onApproveRefund={(id) => triggerToast(`✓ Đã duyệt hoàn tiền thành công.`)}
                onRaiseToast={triggerToast}
              />
            </div>
          )}

          {/* TAB 11: AI TRUNG TÂM (Tied to modular AiPlanner) */}
          {(activeTab === 'ai_study' || activeTab === 'ai_analytics' || activeTab === 'ai_exam' || activeTab === 'ai_risk') && (
            <div className="space-y-6">
              <AiPlanner students={students} />
            </div>
          )}

          {/* TAB: THÔNG BÁO (Notifications tab) */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <PageHeader 
                breadcrumbs={[{ label: 'Hệ thống' }, { label: 'Thông báo', active: true }]}
                title="Trung Tâm Thông Báo Hệ Thống"
                description="Danh sách thông báo học vụ, tài chính, nhắc nợ học phí và cảnh báo AI tự động."
              />
              <div className="rounded-xl border border-[#DCE7F3] bg-white p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-[#EDF2F7] pb-3">
                  <h3 className="font-bold text-sm text-[#2D3748]">Thông báo gần đây</h3>
                  <Button 
                    variant="soft" 
                    size="sm"
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                      triggerToast('✓ Đã đánh dấu tất cả thông báo là ĐÃ ĐỌC.');
                    }}
                  >
                    Đánh dấu tất cả đã đọc
                  </Button>
                </div>
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`rounded-xl border p-4 transition-all relative flex items-start justify-between ${
                        n.unread ? 'bg-[#EAF4FF] border-[#B2D4FF]' : 'bg-white border-[#EDF2F7]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-[#1C6DD0] font-mono">{n.category}</span>
                          <span className="text-[10px] text-[#94A3B8]">• {n.time}</span>
                        </div>
                        <h4 className="text-xs font-bold text-[#2D3748]">{n.title}</h4>
                        <p className="text-xs text-[#718096]">{n.message}</p>
                      </div>
                      {n.unread && <Badge status="info">Mới</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 12: NHÂN SỰ & LƯƠNG (HR Management) */}
          {activeTab === 'hr' && (
            <div className="space-y-6">
              <PageHeader 
                breadcrumbs={[{ label: 'Quản trị' }, { label: 'Nhân sự & Lương', active: true }]}
                title="Quản lý Nhân Sự & Lương"
                description="Thông tin nhân sự, giảng viên và hạch toán tiền lương nội bộ."
              />

              <div className="rounded-xl border border-[#DCE7F3] bg-white overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] h-10 text-[10px] font-bold uppercase text-[#94A3B8]">
                      <th className="p-3">Mã nhân viên</th>
                      <th className="p-3">Họ và tên</th>
                      <th className="p-3">Bộ phận</th>
                      <th className="p-3">Chức danh</th>
                      <th className="p-3">Ngày gia nhập</th>
                      <th className="p-3">Mức lương cơ bản</th>
                      <th className="p-3">Trạng thái công tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id} className="border-b border-[#EDF2F7] h-12 hover:bg-[#F7FAFC]">
                        <td className="p-3 font-mono text-[#718096]">{emp.id}</td>
                        <td className="p-3 font-bold text-[#2D3748]">{emp.name}</td>
                        <td className="p-3 text-[#2D3748]">{emp.department}</td>
                        <td className="p-3 text-[#718096]">{emp.role}</td>
                        <td className="p-3 text-[#718096]">{emp.joinDate}</td>
                        <td className="p-3 text-xs font-bold text-[#2D3748]">
                          {currentRole === 'OWNER' || currentRole === 'ACCOUNTANT' ? formatVND(emp.salary) : '•••••••• ₫ (Bảo mật)'}
                        </td>
                        <td className="p-3">
                          <Badge status={emp.status === 'Đang làm việc' ? 'Đang học' : 'Chờ xử lý'}>{emp.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 13: NGƯỜI DÙNG (Users cards view as per spec #40) */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <PageHeader 
                breadcrumbs={[{ label: 'Quản trị' }, { label: 'Người dùng', active: true }]}
                title="Quản Trị Thành Viên & Tài Khoản"
                description="Danh sách tài khoản kết nối của Owner, Giáo viên, Kế toán, Học viên và Phụ huynh."
                action={
                  <Button variant="primary" size="sm" onClick={() => setIsCreateUserOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> + Thêm người dùng mới
                  </Button>
                }
              />

              <div className="flex flex-col gap-3 rounded-xl border border-[#DCE7F3] bg-white p-4 sm:flex-row sm:items-center">
                <SearchInput 
                  placeholder="Tìm kiếm người dùng..."
                  value={userSearch}
                  onSearchChange={setUserSearch}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {users.filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase())).map((u) => (
                  <div key={u.id} className="rounded-2xl border border-[#DCE7F3] bg-white p-5 space-y-4 hover:border-[#1C6DD0] transition-all">
                    <div className="flex items-center space-x-3.5">
                      <div className="h-10 w-10 rounded-full bg-[#EAF4FF] text-[#1C6DD0] font-bold text-xs flex items-center justify-center border border-[#B2D4FF]">
                        {u.name.split(' ').pop()?.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#2D3748]">{u.name}</h4>
                        <span className="text-[10px] text-[#718096] block">{u.email}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#2D3748] border-t border-[#EDF2F7] pt-3.5">
                      <div className="flex justify-between">
                        <span className="text-[#718096]">Vai trò phân hệ:</span>
                        <Badge status="info">{u.role}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#718096]">Phòng ban / Cơ sở:</span>
                        <span className="font-semibold">{u.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#718096]">Trạng thái hoạt động:</span>
                        <Badge status="Đang học">{u.status}</Badge>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-1">
                      <Button variant="soft" size="sm" onClick={() => setSelectedUser(u)}>
                        Chi tiết
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 14: PHÂN QUYỀN MATRIX (Roles) */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <PageHeader 
                breadcrumbs={[{ label: 'Quản trị' }, { label: 'Phân quyền Matrix', active: true }]}
                title="Bảng Phân Quyền Vai Trò (Permission Matrix)"
                description="Bản ánh xạ quyền thao tác View, Create, Edit, Delete đối với từng module dữ liệu ERP."
              />
              
              <Card title="Quyền thao tác Phân hệ" subtitle="Kiểm soát bảo mật ERP an toàn tuyệt đối">
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] h-10 text-[10px] font-bold uppercase text-[#94A3B8]">
                        <th className="p-3">Tính năng Module</th>
                        <th className="p-3 text-center">Xem (View)</th>
                        <th className="p-3 text-center">Tạo mới (Create)</th>
                        <th className="p-3 text-center">Sửa (Edit)</th>
                        <th className="p-3 text-center">Xóa (Delete)</th>
                        <th className="p-3 text-center">Xuất File (Export)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { mod: 'Quản lý Học viên', v: true, c: true, e: true, d: false, x: true },
                        { mod: 'Quản lý Lớp học', v: true, c: true, e: true, d: true, x: true },
                        { mod: 'Điểm danh chuyên cần', v: true, c: true, e: true, d: false, x: true },
                        { mod: 'Bài tập giao bài', v: true, c: true, e: true, d: true, x: true },
                        { mod: 'Sổ điểm học bạ', v: true, c: true, e: true, d: false, x: true },
                        { mod: 'Hóa đơn & Học phí', v: true, c: true, e: true, d: false, x: true },
                        { mod: 'Báo cáo quản trị', v: true, c: false, e: false, d: false, x: true },
                      ].map((p, idx) => (
                        <tr key={idx} className="border-b border-[#EDF2F7] h-11 hover:bg-[#F7FAFC]">
                          <td className="p-3 font-semibold text-[#2D3748]">{p.mod}</td>
                          <td className="p-3 text-center">
                            <span className="text-emerald-600 font-bold">✓</span>
                          </td>
                          <td className="p-3 text-center">
                            {p.c ? <span className="text-[#1C6DD0] font-bold">✓</span> : <span className="text-[#94A3B8]">-</span>}
                          </td>
                          <td className="p-3 text-center">
                            {p.e ? <span className="text-amber-500 font-bold">✓</span> : <span className="text-[#94A3B8]">-</span>}
                          </td>
                          <td className="p-3 text-center">
                            {p.d ? <span className="text-rose-500 font-bold">✓</span> : <span className="text-[#94A3B8]">-</span>}
                          </td>
                          <td className="p-3 text-center">
                            {p.x ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-[#94A3B8]">-</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 15: CẤU HÌNH (Settings) */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <PageHeader 
                breadcrumbs={[{ label: 'Quản trị' }, { label: 'Cấu hình', active: true }]}
                title="Cấu Hình Hệ Thống ERP"
                description="Điều chỉnh niên khóa, tổ hợp thang điểm và quy định học phí trung tâm."
              />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card title="Cấu hình Học thuật" subtitle="Thiết lập tham số cho phòng giáo vụ">
                  <div className="space-y-4 mt-3 text-xs">
                    <div>
                      <label className="block text-[#718096] font-semibold mb-1">Niên khóa hiện tại</label>
                      <select className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 font-medium text-[#2D3748]">
                        <option>Năm học 2026–2027</option>
                        <option>Năm học 2025–2026</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#718096] font-semibold mb-1">Kỳ học bộ môn</label>
                      <select className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 font-medium text-[#2D3748]">
                        <option>Học kỳ 1</option>
                        <option>Học kỳ 2</option>
                        <option>Học kỳ Hè</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#718096] font-semibold mb-1">Thang điểm chuẩn đánh giá</label>
                      <select className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 font-medium text-[#2D3748]">
                        <option>Hệ 10 (Chính quy Việt Nam)</option>
                        <option>Hệ chữ A,B,C,D,F (Mỹ / Quốc tế)</option>
                      </select>
                    </div>
                    <Button variant="primary" size="sm" className="w-full" onClick={() => triggerToast('✓ Lưu cấu hình học thuật thành công.')}>
                      Lưu thay đổi học thuật
                    </Button>
                  </div>
                </Card>

                <Card title="Quy chế tài chính & thu phí" subtitle="Hạn nộp và chiết khấu học phí">
                  <div className="space-y-4 mt-3 text-xs">
                    <div>
                      <label className="block text-[#718096] font-semibold mb-1">Số ngày gia hạn nộp phí (kể từ ngày lập hóa đơn)</label>
                      <input type="number" defaultValue={30} className="h-9 w-full rounded-lg border border-[#DCE7F3] px-3 font-medium" />
                    </div>
                    <div>
                      <label className="block text-[#718096] font-semibold mb-1">Mức ưu đãi nộp sớm (Early Bird discount %)</label>
                      <input type="text" defaultValue="5%" className="h-9 w-full rounded-lg border border-[#DCE7F3] px-3 font-medium" />
                    </div>
                    <Button variant="primary" size="sm" className="w-full" onClick={() => triggerToast('✓ Lưu cấu hình tài chính thành công.')}>
                      Lưu quy chế tài chính
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 16: GIÁM SÁT HỆ THỐNG (Observability) */}
          {activeTab === 'observability' && (
            <div className="space-y-6">
              <PageHeader 
                breadcrumbs={[{ label: 'Quản trị' }, { label: 'Giám sát hệ thống', active: true }]}
                title="Bảng Giám Sát Hạ Tầng & Audit Logs"
                description="Giám sát lỗi, băng thông và audit log kiểm toán bảo mật dữ liệu ERP chủ động."
              />
              <ObservabilityView auditLogs={auditLogs} />
            </div>
          )}

        </main>
      </div>

      {/* 3. APP-WIDE DRAWERS & MODALS */}

      {/* A. NOTIFICATIONS DRAWER PANEL (SIDE DRAWER) */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/10 backdrop-blur-xs" onClick={() => setNotificationsOpen(false)} />
          <div className="relative w-full max-w-sm bg-white h-screen shadow-2xl flex flex-col justify-between border-l border-[#DCE7F3]">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#EDF2F7] flex items-center justify-between bg-[#F7FAFC]">
              <div className="flex items-center space-x-2 text-[#1C6DD0]">
                <BellRing className="h-5 w-5 animate-bounce" />
                <h3 className="font-display font-bold text-sm text-[#2D3748]">Thông báo hệ thống</h3>
              </div>
              <button 
                onClick={() => setNotificationsOpen(false)} 
                className="p-1 rounded-lg hover:bg-[#EDF2F7] text-[#718096] cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Notifications Scroller */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`rounded-xl border p-4 transition-all relative ${
                    n.unread ? 'bg-[#EAF4FF] border-[#B2D4FF]' : 'bg-white border-[#EDF2F7]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-[#1C6DD0] font-mono">{n.category}</span>
                    <span className="text-[10px] text-[#94A3B8] font-medium">{n.time}</span>
                  </div>
                  <h4 className="text-xs font-bold text-[#2D3748] pr-4">{n.title}</h4>
                  <p className="text-[11px] text-[#718096] mt-1">{n.message}</p>
                </div>
              ))}
            </div>

            {/* All read footer */}
            <div className="p-4 border-t border-[#EDF2F7] bg-[#F7FAFC]">
              <Button 
                variant="primary" 
                size="sm" 
                className="w-full text-xs font-bold cursor-pointer"
                onClick={() => {
                  setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
                  triggerToast('✓ Đã đánh dấu tất cả thông báo là ĐÃ ĐỌC.');
                  setNotificationsOpen(false);
                }}
              >
                Đánh dấu tất cả đã đọc
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* B. TOAST FEEDBACK FLOATER */}
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}

      {/* D. MODAL: ĐĂNG KÝ GHI DANH MỚI (isCreateEnrollmentOpen) */}
      <Modal
        isOpen={isCreateEnrollmentOpen}
        onClose={() => setIsCreateEnrollmentOpen(false)}
        title="Đăng Ký Nhập Học & Ghi Danh"
        subtitle="Khởi tạo hồ sơ học viên kèm sinh hóa đơn thu học phí tự động"
      >
        <form onSubmit={handleCreateEnrollmentSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#718096] font-bold uppercase text-[9px] mb-1">Họ và tên học sinh</label>
            <input
              type="text"
              placeholder="Ví dụ: Nguyễn Văn Hải..."
              value={newEnrollment.name}
              onChange={(e) => setNewEnrollment(prev => ({ ...prev, name: e.target.value }))}
              className="h-10 w-full rounded-lg border border-[#DCE7F3] px-3 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[#718096] font-bold uppercase text-[9px] mb-1">Email liên hệ</label>
            <input
              type="email"
              placeholder="vi_du@gmail.com"
              value={newEnrollment.email}
              onChange={(e) => setNewEnrollment(prev => ({ ...prev, email: e.target.value }))}
              className="h-10 w-full rounded-lg border border-[#DCE7F3] px-3"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#718096] font-bold uppercase text-[9px] mb-1">Số điện thoại</label>
              <input
                type="text"
                placeholder="Số điện thoại..."
                value={newEnrollment.phone}
                onChange={(e) => setNewEnrollment(prev => ({ ...prev, phone: e.target.value }))}
                className="h-10 w-full rounded-lg border border-[#DCE7F3] px-3"
              />
            </div>

            <div>
              <label className="block text-[#718096] font-bold uppercase text-[9px] mb-1">Chương trình đăng ký học</label>
              <select
                value={newEnrollment.course}
                onChange={(e) => setNewEnrollment(prev => ({ ...prev, course: e.target.value }))}
                className="h-10 w-full rounded-lg border border-[#DCE7F3] px-2"
              >
                {courses.map(c => <option key={c.id} value={c.name}>{c.name} ({formatVND(c.fee)})</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#EDF2F7] pt-4">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsCreateEnrollmentOpen(false)}>
              Hủy bỏ
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Phê duyệt ghi danh hồ sơ
            </Button>
          </div>
        </form>
      </Modal>

      {/* E. MODAL: GIAO BÀI TẬP MỚI (isCreateHomeworkOpen) */}
      <Modal
        isOpen={isCreateHomeworkOpen}
        onClose={() => setIsCreateHomeworkOpen(false)}
        title="Giao Bài Tập Về Nhà Mới"
        subtitle="Gửi bài và tài liệu học tập trực tiếp cho toàn lớp học"
      >
        <form onSubmit={handleCreateHomeworkSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#718096] font-bold uppercase text-[9px] mb-1">Tiêu đề bài tập</label>
            <input
              type="text"
              placeholder="Ví dụ: Bài tập ôn giới hạn dãy số..."
              value={newHomework.title}
              onChange={(e) => setNewHomework(prev => ({ ...prev, title: e.target.value }))}
              className="h-10 w-full rounded-lg border border-[#DCE7F3] px-3 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#718096] font-bold uppercase text-[9px] mb-1">Giao cho lớp học</label>
              <select
                value={newHomework.className}
                onChange={(e) => setNewHomework(prev => ({ ...prev, className: e.target.value }))}
                className="h-10 w-full rounded-lg border border-[#DCE7F3] px-2"
              >
                {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[#718096] font-bold uppercase text-[9px] mb-1">Hạn nộp bài tập</label>
              <input
                type="date"
                value={newHomework.dueDate}
                onChange={(e) => setNewHomework(prev => ({ ...prev, dueDate: e.target.value }))}
                className="h-10 w-full rounded-lg border border-[#DCE7F3] px-3 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#718096] font-bold uppercase text-[9px] mb-1">Mô tả đề bài & Tài liệu kèm theo</label>
            <textarea
              rows={3}
              placeholder="Viết hướng dẫn hoặc đính kèm tài liệu làm bài tự luyện..."
              value={newHomework.description}
              onChange={(e) => setNewHomework(prev => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-lg border border-[#DCE7F3] p-3"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-[#EDF2F7] pt-4">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsCreateHomeworkOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Xác nhận Giao bài
            </Button>
          </div>
        </form>
      </Modal>

      {/* F. DETAIL MODAL: CHÚ THÍCH HỌC VIÊN (selectedStudent) */}
      {selectedStudent && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedStudent(null)}
          title="Hồ Sơ Chi Tiết Học Viên"
          subtitle={selectedStudent.id}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center space-x-3 pb-3 border-b border-[#EDF2F7]">
              <div className="h-11 w-11 rounded-full bg-[#EAF4FF] text-[#1C6DD0] font-bold flex items-center justify-center border border-[#B2D4FF]">
                {selectedStudent.name.split(' ').pop()?.substring(0, 2)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#2D3748]">{selectedStudent.name}</h4>
                <p className="text-[10px] text-[#718096]">{selectedStudent.email} · {selectedStudent.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[#F7FAFC] rounded-xl border border-[#EDF2F7]">
                <span className="text-[#718096] block text-[9px] font-bold uppercase">Lớp đang theo</span>
                <strong className="text-[#2D3748] block mt-0.5">{selectedStudent.className}</strong>
              </div>
              <div className="p-3 bg-[#F7FAFC] rounded-xl border border-[#EDF2F7]">
                <span className="text-[#718096] block text-[9px] font-bold uppercase">Môn học luyện</span>
                <strong className="text-[#2D3748] block mt-0.5">{selectedStudent.course}</strong>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 border border-[#EDF2F7] rounded-lg">
                <span className="text-[9px] font-bold text-[#718096] block">ĐIỂM GPA</span>
                <strong className="text-[#2D3748] font-bold block text-sm mt-0.5">{selectedStudent.gpa > 0 ? selectedStudent.gpa : 'N/A'}</strong>
              </div>
              <div className="p-2 border border-[#EDF2F7] rounded-lg">
                <span className="text-[9px] font-bold text-[#718096] block">CHUYÊN CẦN</span>
                <strong className="text-emerald-600 font-bold block text-sm mt-0.5">{selectedStudent.attendanceRate}%</strong>
              </div>
              <div className="p-2 border border-[#EDF2F7] rounded-lg">
                <span className="text-[9px] font-bold text-[#718096] block">HỌC PHÍ</span>
                <strong className="text-rose-500 font-bold block text-sm mt-0.5">{formatVND(selectedStudent.tuitionOwed)}</strong>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* G. DETAIL MODAL: BÁO CÁO CHI TIẾT (selectedReport) */}
      {selectedReport && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReport(null)}
          title={selectedReport.title}
          subtitle={`Mã báo cáo: ${selectedReport.id}`}
        >
          <div className="space-y-4 text-xs text-[#2D3748]">
            <p className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl leading-relaxed">
              {selectedReport.description}
            </p>

            <div className="grid grid-cols-2 gap-4 p-3 bg-[#F7FAFC] rounded-xl border border-[#EDF2F7]">
              <div>
                <span className="text-[#718096] block font-semibold text-[10px] uppercase">Người lập báo cáo:</span>
                <strong className="font-bold block mt-0.5">{selectedReport.author}</strong>
              </div>
              <div>
                <span className="text-[#718096] block font-semibold text-[10px] uppercase">Ngày lập thành:</span>
                <strong className="font-bold block mt-0.5">{selectedReport.dateCreated}</strong>
              </div>
            </div>

            <div className="rounded-xl border border-[#DCE7F3] p-4 text-center bg-slate-50 border-dashed">
              <span className="text-[11px] text-[#718096] block">Dữ liệu dòng kiểm toán: <strong>{selectedReport.rowsCount} bản ghi</strong></span>
              <Button variant="primary" size="sm" className="mt-3" onClick={() => triggerToast('✓ Bắt đầu tải bản in PDF thành công.')}>
                <Download className="h-4 w-4 mr-1.5" /> Xuất File PDF / Excel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* H. DETAIL MODAL: CHI TIẾT LỚP HỌC (selectedClass) */}
      {selectedClass && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedClass(null)}
          title="Hồ Sơ Chi Tiết Lớp Học"
          subtitle={selectedClass.id}
          size="lg"
        >
          <div className="space-y-4 text-xs text-[#2D3748]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-[#F7FAFC] border border-[#DCE7F3] p-3 rounded-xl text-center">
              <div>
                <span className="text-[#718096] block font-bold text-[9px] uppercase">Tên lớp học</span>
                <strong className="font-bold mt-0.5 block">{selectedClass.name}</strong>
              </div>
              <div>
                <span className="text-[#718096] block font-bold text-[9px] uppercase">Giáo viên phụ trách</span>
                <strong className="font-bold mt-0.5 block">{selectedClass.teacher}</strong>
              </div>
              <div>
                <span className="text-[#718096] block font-bold text-[9px] uppercase">Ca & Lịch học</span>
                <strong className="font-bold mt-0.5 block font-mono">{selectedClass.schedule}</strong>
              </div>
              <div>
                <span className="text-[#718096] block font-bold text-[9px] uppercase">Phòng học</span>
                <strong className="font-bold mt-0.5 block">{selectedClass.room}</strong>
              </div>
            </div>

            <h4 className="font-bold text-[#1C6DD0] uppercase tracking-wider text-[10px] pt-2">Danh sách thành viên lớp học</h4>
            <div className="rounded-xl border border-[#DCE7F3] overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] h-8 text-[9px] font-bold uppercase text-[#94A3B8]">
                    <th className="p-2">Học sinh</th>
                    <th className="p-2">Mã số</th>
                    <th className="p-2">Chuyên cần</th>
                    <th className="p-2">Điểm GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => s.classId === selectedClass.id).map((student, i) => (
                    <tr key={i} className="border-b border-[#EDF2F7] h-9 hover:bg-slate-50">
                      <td className="p-2 font-bold">{student.name}</td>
                      <td className="p-2 font-mono text-[#718096]">{student.id}</td>
                      <td className="p-2 font-semibold text-emerald-600">{student.attendanceRate}%</td>
                      <td className="p-2 font-bold text-indigo-600">{student.gpa}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}

      {/* I. DETAIL MODAL: CHI TIẾT NGƯỜI DÙNG (selectedUser) */}
      {selectedUser && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedUser(null)}
          title="Hồ Sơ Quản Trị Thành Viên"
          subtitle={selectedUser.id}
        >
          <div className="space-y-4 text-xs text-[#2D3748]">
            <div className="flex items-center space-x-3 pb-3 border-b border-[#EDF2F7]">
              <div className="h-10 w-10 rounded-full bg-[#EAF4FF] text-[#1C6DD0] font-bold text-xs flex items-center justify-center border border-[#B2D4FF]">
                {selectedUser.name.split(' ').pop()?.substring(0, 2)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#2D3748]">{selectedUser.name}</h4>
                <span className="text-[10px] text-[#718096] block">{selectedUser.email}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-[#EDF2F7]">
                <span className="text-[#718096]">Vai trò phân hệ:</span>
                <Badge status="info">{selectedUser.role}</Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EDF2F7]">
                <span className="text-[#718096]">Phòng ban bộ môn:</span>
                <span className="font-semibold">{selectedUser.department}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#EDF2F7]">
                <span className="text-[#718096]">Cơ sở giảng dạy:</span>
                <span className="font-semibold">{selectedUser.school}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#718096]">Trạng thái kích hoạt:</span>
                <Badge status="Đang học">{selectedUser.status}</Badge>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* J. MODAL: THÊM NGƯỜI DÙNG MỚI (isCreateUserOpen) */}
      <Modal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        title="Thêm Người Dùng Mới"
        subtitle="Khởi tạo tài khoản phân quyền trên toàn hệ thống"
      >
        <form onSubmit={async (e) => {
          e.preventDefault();
          if (!newUser.name || !newUser.email) {
            triggerToast('⚠️ Vui lòng điền họ tên và email.', 'warning');
            return;
          }

          // Strict Role restriction
          if (newUser.role === 'ADMIN' || newUser.role === 'OWNER') {
            if (currentRole !== 'ADMIN' && currentRole !== 'OWNER') {
              triggerToast('❌ Bạn không có quyền khởi tạo tài khoản ADMIN / OWNER!', 'error');
              return;
            }
          }

          const created: User = {
            id: `USR-0${users.length + 1}`,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            department: newUser.department,
            school: newUser.school,
            status: 'Đang hoạt động'
          };
          try {
            await setDoc(doc(db, 'users', created.id), created);
            await logAuditEvent(
              userProfile?.name || currentUser?.email || 'User',
              currentUser?.uid || 'N/A',
              'TẠO NGƯỜI DÙNG',
              created.id,
              'Success',
              `Khởi tạo thành công tài khoản ${created.name} (${created.email}) quyền ${created.role}`
            );
            triggerToast(`✓ Đã thêm tài khoản thành công: ${created.name}`);
            setIsCreateUserOpen(false);
          } catch (error) {
            console.warn("Firestore error, adding user locally only:", error);
            setUsers(prev => [...prev, created]);
            triggerToast(`✓ Đã thêm thành viên cục bộ (Chế độ Sandbox): ${created.name}`, 'success');
            setIsCreateUserOpen(false);
          }
        }} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#718096] font-bold uppercase text-[9px] mb-1">Họ tên thành viên</label>
            <input
              type="text"
              placeholder="Ví dụ: Hoàng Văn Linh..."
              value={newUser.name}
              onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
              className="h-10 w-full rounded-lg border border-[#DCE7F3] px-3 font-semibold"
            />
          </div>

          <div>
            <label className="block text-[#718096] font-bold uppercase text-[9px] mb-1">Email tài khoản</label>
            <input
              type="email"
              placeholder="linhhoang@smartedu.com"
              value={newUser.email}
              onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
              className="h-10 w-full rounded-lg border border-[#DCE7F3] px-3"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#718096] font-bold uppercase text-[9px] mb-1">Vai trò quyền lợi</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as Role }))}
                className="h-10 w-full rounded-lg border border-[#DCE7F3] px-2"
              >
                {currentRole === 'ACADEMIC_STAFF' ? (
                  <>
                    <option value="TEACHER">Giáo viên (TEACHER)</option>
                    <option value="STUDENT">Học viên (STUDENT)</option>
                    <option value="PARENT">Phụ huynh (PARENT)</option>
                  </>
                ) : (
                  <>
                    <option value="TEACHER">Giáo viên (TEACHER)</option>
                    <option value="STUDENT">Học viên (STUDENT)</option>
                    <option value="PARENT">Phụ huynh (PARENT)</option>
                    <option value="ACCOUNTANT">Kế toán viên (ACCOUNTANT)</option>
                    <option value="ACADEMIC_STAFF">Học vụ giáo vụ (ACADEMIC_STAFF)</option>
                    {(currentRole === 'ADMIN' || currentRole === 'OWNER') && (
                      <option value="ADMIN">Quản trị viên (ADMIN)</option>
                    )}
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[#718096] font-bold uppercase text-[9px] mb-1">Phòng ban ban đầu</label>
              <input
                type="text"
                value={newUser.department}
                onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                className="h-10 w-full rounded-lg border border-[#DCE7F3] px-3"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#EDF2F7] pt-4">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsCreateUserOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Xác nhận Thêm thành viên
            </Button>
          </div>
        </form>
      </Modal>

      {/* K. MODAL: FIRST LOGIN PASSWORD CHANGE */}
      {isFirstLoginOpen && pendingFirstLoginUser && (
        <FirstLoginModal
          isOpen={isFirstLoginOpen}
          user={pendingFirstLoginUser}
          onRaiseToast={triggerToast}
          onLogAudit={(action, target, status, details) => logAuditEvent(pendingFirstLoginUser.name, pendingFirstLoginUser.id, action, target, status, details)}
          onSuccess={(updatedUser) => {
            setIsFirstLoginOpen(false);
            setPendingFirstLoginUser(null);
            setUserProfile(updatedUser);
            setCurrentRole(updatedUser.role);
            setCurrentUser({
              uid: updatedUser.id,
              email: updatedUser.email,
              displayName: updatedUser.name
            });
            const defaultWorkspaceForRole: Record<Role, string> = {
              ADMIN: 'dashboard',
              OWNER: 'dashboard',
              ACADEMIC_STAFF: 'dashboard',
              TEACHER: 'classes',
              STUDENT: 'dashboard',
              PARENT: 'dashboard',
              ACCOUNTANT: 'finance'
            };
            setActiveTab(defaultWorkspaceForRole[updatedUser.role] || 'dashboard');
          }}
        />
      )}

    </div>
  );
}

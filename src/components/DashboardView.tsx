import React, { useState } from 'react';
import { 
  Users, BookOpen, DollarSign, Award, Clock, ArrowRight, Brain, Sparkles, 
  CheckCircle, ShieldAlert, Activity, FileText, Check, Calendar, MapPin, 
  User as UserIcon, HelpCircle, FileCheck2, CreditCard
} from 'lucide-react';
import { Role, Student, Class, Course, Invoice } from '../types';
import { formatVND } from '../data';
import { Button, Card, Badge, KpiCard } from './Common';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardViewProps {
  currentRole: Role;
  students: Student[];
  classes: Class[];
  courses: Course[];
  invoices: Invoice[];
  onNavigateTab: (tabId: string) => void;
  onRaiseToast: (msg: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentRole,
  students,
  classes,
  courses,
  invoices,
  onNavigateTab,
  onRaiseToast
}) => {
  // Teaching Journal form state
  const [journalClass, setJournalClass] = useState<string>('MATH-12A');
  const [journalTopic, setJournalTopic] = useState<string>('');
  const [journalContent, setJournalContent] = useState<string>('');

  // Weekly goals state for student
  const [studentGoals, setStudentGoals] = useState([
    { id: 1, text: 'Hoàn thành Bài tập hàm số bậc hai', done: true },
    { id: 2, text: 'Ôn tập từ vựng IELTS Reading 60 phút', done: true },
    { id: 3, text: 'Luyện 1 đề thi thử môn Tiếng Anh', done: false },
    { id: 4, text: 'Xem lại bài giảng lý thuyết Vật lý quang học', done: false }
  ]);

  const toggleGoal = (id: number) => {
    setStudentGoals(prev => prev.map(g => g.id === id ? { ...g, done: !g.done } : g));
  };

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalTopic || !journalContent) {
      onRaiseToast('⚠️ Vui lòng điền đầy đủ chủ đề và nội dung bài giảng.');
      return;
    }
    onRaiseToast(`✓ Đã lưu Nhật ký giảng dạy lớp ${journalClass} thành công.`);
    setJournalTopic('');
    setJournalContent('');
  };

  // Executive dashboard chart data
  const revenueTrendData = [
    { month: 'T2', 'Doanh thu': 920000000 },
    { month: 'T3', 'Doanh thu': 1050000000 },
    { month: 'T4', 'Doanh thu': 1120000000 },
    { month: 'T5', 'Doanh thu': 1180000000 },
    { month: 'T6', 'Doanh thu': 1240000000 },
    { month: 'T7', 'Doanh thu': 1280000000 },
  ];

  const enrollmentGrowthData = [
    { month: 'T2', 'Ghi danh mới': 24 },
    { month: 'T3', 'Ghi danh mới': 38 },
    { month: 'T4', 'Ghi danh mới': 45 },
    { month: 'T5', 'Ghi danh mới': 52 },
    { month: 'T6', 'Ghi danh mới': 48 },
    { month: 'T7', 'Ghi danh mới': 64 },
  ];

  // Render Owner Executive Dashboard
  const renderExecutiveDashboard = () => {
    const totalStudents = students.length;
    const activeClasses = classes.filter(c => c.status === 'Đang hoạt động').length;
    const completedClasses = classes.filter(c => c.status === 'Đã hoàn thành').length;

    return (
      <div className="space-y-6">
        {/* KPI Row (6 cards) */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Tổng học viên" value={totalStudents} icon={<Users className="h-5 w-5" />} trend={{ value: '12.4%', isPositive: true }} />
          <KpiCard label="Lớp đang chạy" value={activeClasses} icon={<BookOpen className="h-5 w-5" />} subtitle={`${completedClasses} lớp đã hoàn tất`} />
          <KpiCard label="Doanh thu tháng" value="1.28 B ₫" icon={<DollarSign className="h-5 w-5" />} trend={{ value: '3.2%', isPositive: true }} />
          <KpiCard label="Công nợ học phí" value="186.5 M ₫" icon={<CreditCard className="h-5 w-5" />} trend={{ value: '8.4%', isPositive: false }} />
          <KpiCard label="Tỷ lệ thu hồi nợ" value="91.4%" icon={<FileCheck2 className="h-5 w-5" />} subtitle="Hạn thu: 15/08/2026" />
          <KpiCard label="Tỷ lệ chuyên cần" value="96%" icon={<Activity className="h-5 w-5" />} trend={{ value: '0.8%', isPositive: true }} />
        </div>

        {/* Second Row: Charts side-by-side (50% / 50%) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Doanh thu theo tháng" subtitle="Thống kê luồng tiền nộp học phí 6 tháng gần nhất">
            <div className="h-72 mt-2 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrendData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#718096' }} />
                  <YAxis tickFormatter={(v) => `${v/1000000}tr`} tick={{ fontSize: 11, fill: '#718096' }} />
                  <Tooltip formatter={(v: number) => formatVND(v)} contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Doanh thu" stroke="#2F80ED" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Tăng trưởng Ghi danh mới" subtitle="Số lượng hồ sơ nhập học duyệt thành công">
            <div className="h-72 mt-2 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={enrollmentGrowthData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="growthColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#718096' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#718096' }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="Ghi danh mới" stroke="#10B981" fillOpacity={1} fill="url(#growthColor)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Academic Health Section Table */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card title="Chỉ số Sức khỏe Học vụ & Lớp học" subtitle="Giám sát chất lượng giảng dạy và phân bổ sĩ số">
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] h-9 text-[10px] font-bold uppercase text-[#94A3B8]">
                      <th className="p-2">Tên lớp học</th>
                      <th className="p-2">Mã lớp</th>
                      <th className="p-2">Sĩ số / Sức chứa</th>
                      <th className="p-2">Môn học</th>
                      <th className="p-2">Hoàn thành bài tập</th>
                      <th className="p-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((cls) => (
                      <tr key={cls.id} className="border-b border-[#EDF2F7] hover:bg-[#F7FAFC] h-11 text-xs">
                        <td className="p-2 font-bold text-[#2D3748]">{cls.name}</td>
                        <td className="p-2 font-mono text-[#718096]">{cls.id}</td>
                        <td className="p-2 font-medium">
                          {cls.studentsCount} / {cls.capacity}
                        </td>
                        <td className="p-2 text-[#718096]">{cls.subject}</td>
                        <td className="p-2">
                          <span className="font-bold text-indigo-600">92%</span>
                        </td>
                        <td className="p-2">
                          <Badge status={cls.status}>{cls.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Teacher performance column */}
          <Card title="Hiệu suất Giáo viên & Đánh giá" subtitle="Đánh giá GPA trung bình đứng lớp">
            <div className="space-y-3.5 mt-2 text-xs">
              {[
                { name: 'Trần Quốc Việt', major: 'Toán nâng cao', count: '48 giờ', gpa: '8.1/10', satisfaction: '96%' },
                { name: 'Nguyễn Thu Hà', major: 'Tiếng Anh Advanced', count: '42 giờ', gpa: '7.9/10', satisfaction: '98%' },
                { name: 'Lê Hoàng Anh', major: 'IELTS Foundation', count: '36 giờ', gpa: '8.3/10', satisfaction: '94%' },
                { name: 'Phạm Minh Đức', major: 'AP Physics', count: '18 giờ', gpa: '6.9/10', satisfaction: '90%' },
              ].map((teacher, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-[#EDF2F7] pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <strong className="font-bold text-[#2D3748] block">{teacher.name}</strong>
                    <span className="text-[#718096] text-[10px]">{teacher.major} · {teacher.count}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-indigo-600 block">{teacher.gpa} GPA</span>
                    <span className="text-emerald-600 font-semibold text-[10px]">Lòng tin: {teacher.satisfaction}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Executive Action Center Row */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card title="⚠️ Cảnh báo khẩn" subtitle="Các điểm nóng hệ thống cần xử lý">
            <div className="space-y-3 mt-2 text-xs text-[#EB5757]">
              <div className="flex items-start bg-rose-50 border border-rose-100 rounded-xl p-3">
                <ShieldAlert className="h-4 w-4 shrink-0 mr-2 mt-0.5" />
                <span>Nợ học phí quá hạn vượt ngưỡng cảnh báo đỏ.</span>
              </div>
              <div className="flex items-start bg-rose-50 border border-rose-100 rounded-xl p-3">
                <ShieldAlert className="h-4 w-4 shrink-0 mr-2 mt-0.5" />
                <span>Rủi ro tụt lại của học viên Phạm Gia Huy tăng cao (78%).</span>
              </div>
            </div>
          </Card>

          <Card title="⏳ Đang chờ phê duyệt" subtitle="Hồ sơ tài chính và học vụ">
            <div className="space-y-2.5 mt-2 text-xs">
              <div className="flex items-center justify-between border-b border-[#EDF2F7] pb-2">
                <div>
                  <strong className="font-bold text-[#2D3748]">Hoàn phí: Vũ Đức Thành</strong>
                  <span className="block text-[10px] text-[#718096]">Số tiền: 3,200,000 ₫</span>
                </div>
                <Button variant="soft" size="sm" onClick={() => onNavigateTab('refunds')}>
                  Duyệt
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <strong className="font-bold text-[#2D3748]">Ghi danh mới: Đỗ Minh Khang</strong>
                  <span className="block text-[10px] text-[#718096]">Khóa: English Communication</span>
                </div>
                <Button variant="soft" size="sm" onClick={() => onNavigateTab('enrollment')}>
                  Duyệt
                </Button>
              </div>
            </div>
          </Card>

          <Card title="⚡ Phím tắt nhanh" subtitle="Các tác vụ quản trị hay sử dụng">
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button variant="secondary" size="sm" className="h-10 cursor-pointer text-xs" onClick={() => onNavigateTab('enrollment')}>
                + Tạo hồ sơ
              </Button>
              <Button variant="secondary" size="sm" className="h-10 cursor-pointer text-xs" onClick={() => onNavigateTab('classes')}>
                + Tạo lớp học
              </Button>
              <Button variant="secondary" size="sm" className="h-10 cursor-pointer text-xs" onClick={() => onNavigateTab('homework')}>
                Giao bài tập
              </Button>
              <Button variant="secondary" size="sm" className="h-10 cursor-pointer text-xs" onClick={() => onNavigateTab('scores')}>
                Vào sổ điểm
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // Render Teacher Workspace Dashboard
  const renderTeacherDashboard = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <div className="rounded-xl border border-[#DCE7F3] bg-white p-4 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#718096]">Lớp đang dạy</span>
            <span className="font-display text-2xl font-extrabold text-[#2D3748] mt-1 block">6</span>
          </div>
          <div className="rounded-xl border border-[#DCE7F3] bg-white p-4 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#718096]">Tiết dạy hôm nay</span>
            <span className="font-display text-2xl font-extrabold text-[#1C6DD0] mt-1 block">4 tiết</span>
          </div>
          <div className="rounded-xl border border-[#DCE7F3] bg-white p-4 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#718096]">Sĩ số học viên</span>
            <span className="font-display text-2xl font-extrabold text-[#27AE60] mt-1 block">156</span>
          </div>
          <div className="rounded-xl border border-[#DCE7F3] bg-white p-4 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#718096]">Bài cần chấm</span>
            <span className="font-display text-2xl font-extrabold text-amber-500 mt-1 block">12 bài</span>
          </div>
          <div className="rounded-xl border border-[#DCE7F3] bg-white p-4 text-center">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#718096]">Điểm danh cần xử lý</span>
            <span className="font-display text-2xl font-extrabold text-rose-500 mt-1 block">2 ca</span>
          </div>
        </div>

        {/* Quick action buttons row */}
        <div className="flex flex-wrap gap-2.5">
          <Button variant="primary" size="sm" className="cursor-pointer font-bold" onClick={() => onNavigateTab('attendance')}>
            Tiến hành Điểm danh
          </Button>
          <Button variant="secondary" size="sm" className="cursor-pointer font-bold" onClick={() => onNavigateTab('homework')}>
            Giao bài tập mới
          </Button>
          <Button variant="secondary" size="sm" className="cursor-pointer font-bold" onClick={() => onNavigateTab('scores')}>
            Nhập đầu điểm
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Today classes */}
          <div className="lg:col-span-3">
            <Card title="Lịch giảng dạy hôm nay" subtitle="Thứ Hai · 10/08/2026">
              <div className="space-y-3.5 mt-2">
                <div className="flex items-center justify-between border-l-4 border-[#2F80ED] bg-[#EAF4FF] p-3.5 rounded-r-xl">
                  <div>
                    <strong className="text-xs font-bold text-[#1C6DD0] block">12A - Chuyên Toán (Toán nâng cao)</strong>
                    <span className="text-[10px] text-[#718096] font-medium block mt-1">
                      Ca học: 18:00–19:30 · Phòng: P.302 · Sĩ số: 28 học viên
                    </span>
                  </div>
                  <Button variant="primary" size="sm" className="bg-[#2F80ED] text-white font-bold h-8 text-xs" onClick={() => onNavigateTab('attendance')}>
                    Khởi động
                  </Button>
                </div>

                <div className="flex items-center justify-between border-l-4 border-indigo-400 bg-indigo-50/50 p-3.5 rounded-r-xl opacity-90">
                  <div>
                    <strong className="text-xs font-bold text-indigo-700 block">10C - IELTS Foundation (Tiếng Anh)</strong>
                    <span className="text-[10px] text-[#718096] font-medium block mt-1">
                      Ca học: 19:45–21:15 · Phòng: P.201 · Sĩ số: 18 học viên
                    </span>
                  </div>
                  <Button variant="secondary" size="sm" className="h-8 text-xs font-bold" onClick={() => onNavigateTab('attendance')}>
                    Xem lớp
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Teaching Journal Form */}
          <div className="lg:col-span-2">
            <Card title="Nhật ký giảng dạy (Sổ đầu bài)" subtitle="Ghi nhận kiến thức truyền đạt sau mỗi buổi">
              <form onSubmit={handleSaveJournal} className="space-y-3 mt-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Chọn lớp đứng học</label>
                  <select 
                    value={journalClass}
                    onChange={(e) => setJournalClass(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-2"
                  >
                    <option value="MATH-12A">12A - Chuyên Toán</option>
                    <option value="LIT-11B">11B - Ngữ Văn</option>
                    <option value="IELTS-10C">10C - IELTS Foundation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Chủ đề bài học</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Phương trình lượng giác nâng cao..."
                    value={journalTopic}
                    onChange={(e) => setJournalTopic(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-white px-3"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Nội dung đã giảng & Ghi chú</label>
                  <textarea
                    rows={2}
                    placeholder="Học sinh tập trung, hoàn thành tốt các bài luyện tập trên lớp..."
                    value={journalContent}
                    onChange={(e) => setJournalContent(e.target.value)}
                    className="w-full rounded-lg border border-[#DCE7F3] bg-white p-3"
                  />
                </div>

                <Button variant="primary" type="submit" className="w-full h-9 text-xs font-bold cursor-pointer">
                  Lưu nhật ký giảng dạy
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  // Render Student Bento Dashboard
  const renderStudentDashboard = () => {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-[#DCE7F3] bg-white p-5 flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#2D3748]">Xin chào, Nguyễn Minh Anh</h2>
            <p className="text-xs text-[#718096] mt-0.5">Đây là tổng quan kết quả học tập và rèn luyện cá nhân của bạn hôm nay.</p>
          </div>
          <div className="flex items-center space-x-2 bg-[#EAF4FF] text-[#1C6DD0] px-3.5 py-1.5 rounded-lg border border-[#B2D4FF] shrink-0 text-xs font-bold">
            <Brain className="h-4 w-4 text-[#1C6DD0]" />
            <span>Xếp loại GPA mục tiêu: Xuất Sắc</span>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Main left block (7 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* KPI metrics */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <KpiItemMini label="Lớp hiện tại" value="12A" color="text-[#1C6DD0]" />
              <KpiItemMini label="Điểm GPA TB" value="8.9 / 10" color="text-[#27AE60]" />
              <KpiItemMini label="Xột bài tập" value="92%" color="text-[#1C6DD0]" />
              <KpiItemMini label="Tỉ lệ chuyên cần" value="96%" color="text-[#1C6DD0]" />
            </div>

            {/* Student Schedule today */}
            <Card title="Lịch học hôm nay" subtitle="Thứ Hai · 10/08/2026">
              <div className="space-y-3.5 mt-2">
                <div className="flex items-center justify-between border-l-4 border-[#2F80ED] bg-[#EAF4FF] p-3.5 rounded-r-xl">
                  <div className="flex gap-3">
                    <Clock className="h-5 w-5 text-[#1C6DD0] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-bold text-[#1C6DD0] block">Toán nâng cao (12A)</strong>
                      <div className="flex items-center space-x-2.5 text-[10px] text-[#718096] mt-1">
                        <span className="flex items-center"><MapPin className="h-3 w-3 mr-0.5" /> Phòng P.302</span>
                        <span className="flex items-center"><UserIcon className="h-3 w-3 mr-0.5" /> Thầy Trần Quốc Việt</span>
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex h-5 items-center rounded bg-[#1C6DD0] px-2 text-[9px] font-bold text-white uppercase tracking-wider">
                    Đang học
                  </span>
                </div>

                <div className="flex items-center justify-between border-l-4 border-slate-300 bg-white p-3.5 rounded-r-xl border-t border-b border-r border-[#EDF2F7]">
                  <div className="flex gap-3">
                    <Clock className="h-5 w-5 text-[#718096] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-xs font-bold text-[#2D3748] block">Luyện viết IELTS Writing (10C)</strong>
                      <div className="flex items-center space-x-2.5 text-[10px] text-[#718096] mt-1">
                        <span className="flex items-center"><MapPin className="h-3 w-3 mr-0.5" /> Phòng P.201</span>
                        <span className="flex items-center"><UserIcon className="h-3 w-3 mr-0.5" /> Thầy Lê Hoàng Anh</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#718096] font-semibold">19:45 - 21:15</span>
                </div>
              </div>
            </Card>

            {/* AI Recommendation */}
            <div className="rounded-xl border border-blue-100 bg-[#EAF4FF] p-4 flex gap-3.5 items-start">
              <div className="rounded-lg bg-white p-2 text-[#2F80ED] shrink-0 border border-blue-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="text-xs text-[#2D3748] space-y-1">
                <strong className="font-bold text-[#1C6DD0] block">✨ Gợi ý cá nhân hóa từ AI SmartEngine</strong>
                <p>
                  Bạn nên ưu tiên dành ra 45 phút ôn luyện phần <strong>Phương trình bậc hai có chứa tham số m</strong> tối nay.
                </p>
                <p className="text-[11px] text-[#718096] mt-1.5">
                  Lý do: Điểm thi thử tuần trước phần này đang thấp hơn 8% so với trung bình môn chung của lớp.
                </p>
                <button className="text-xs text-[#1C6DD0] font-bold hover:underline block mt-2" onClick={() => onNavigateTab('ai_study')}>
                  Xem kế hoạch học tập AI ngay →
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar right blocks (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Weekly Goal Checklist */}
            <Card title="Mục tiêu tuần tự học" subtitle={`${studentGoals.filter(g => g.done).length} / ${studentGoals.length} hoàn thành`}>
              <div className="space-y-2 mt-2 text-xs">
                {studentGoals.map((g) => (
                  <div key={g.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={g.done}
                      onChange={() => toggleGoal(g.id)}
                      className="h-4 w-4 text-[#2F80ED] border-[#DCE7F3] rounded focus:ring-[#2F80ED]"
                    />
                    <span className={`font-medium ${g.done ? 'line-through text-[#94A3B8]' : 'text-[#2D3748]'}`}>{g.text}</span>
                  </div>
                ))}

                {/* Progress bar */}
                <div className="pt-3 border-t border-[#EDF2F7] mt-3">
                  <div className="flex justify-between font-bold text-[10px] text-[#718096] uppercase">
                    <span>Tiến độ</span>
                    <span>{Math.round((studentGoals.filter(g => g.done).length / studentGoals.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-[#EAF4FF] h-2 rounded-full mt-1.5">
                    <div 
                      className="bg-[#2F80ED] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(studentGoals.filter(g => g.done).length / studentGoals.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick action grid */}
            <Card title="Lối tắt nhanh" subtitle="Truy cập các mục học tập nhanh">
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button variant="secondary" size="sm" className="h-10 cursor-pointer text-xs" onClick={() => onNavigateTab('schedule')}>
                  Thời khóa biểu
                </Button>
                <Button variant="secondary" size="sm" className="h-10 cursor-pointer text-xs" onClick={() => onNavigateTab('homework')}>
                  Bài tập về nhà
                </Button>
                <Button variant="secondary" size="sm" className="h-10 cursor-pointer text-xs" onClick={() => onNavigateTab('scores')}>
                  Bảng điểm sổ
                </Button>
                <Button variant="secondary" size="sm" className="h-10 cursor-pointer text-xs" onClick={() => onNavigateTab('ai_study')}>
                  AI Học tập
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  // Render Parent Dashboard Workspace
  const renderParentDashboard = () => {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-[#DCE7F3] bg-white p-5 flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#2D3748]">Xin chào, Phụ huynh Nguyễn Minh Anh</h2>
            <p className="text-xs text-[#718096] mt-0.5">Giám sát liên tục quá trình và hiệu quả rèn luyện con em tại trung tâm.</p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs text-[#718096] font-medium">Học viên đang chọn:</span>
            <select className="h-9 rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs font-bold text-[#2D3748]">
              <option value="stu1">Nguyễn Minh Anh (Lớp 12A - Chuyên Toán)</option>
            </select>
          </div>
        </div>

        {/* Parent dashboard KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-[#DCE7F3] bg-white p-4">
            <span className="block text-[10px] font-bold text-[#718096] uppercase">Điểm trung bình học phần</span>
            <strong className="block font-display text-2xl font-bold text-emerald-600 mt-1">8.9 / 10</strong>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Xuất sắc đứng lớp</span>
          </div>
          <div className="rounded-xl border border-[#DCE7F3] bg-white p-4">
            <span className="block text-[10px] font-bold text-[#718096] uppercase">Tỉ lệ điểm danh chuyên cần</span>
            <strong className="block font-display text-2xl font-bold text-[#1C6DD0] mt-1">96%</strong>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Nghỉ 1 buổi có phép</span>
          </div>
          <div className="rounded-xl border border-[#DCE7F3] bg-white p-4">
            <span className="block text-[10px] font-bold text-[#718096] uppercase">Hoàn thành bài tập về nhà</span>
            <strong className="block font-display text-2xl font-bold text-[#1C6DD0] mt-1">92%</strong>
            <span className="text-[10px] text-[#718096] block mt-1">Đầy đủ và đúng hạn</span>
          </div>
          <div className="rounded-xl border border-[#DCE7F3] bg-white p-4">
            <span className="block text-[10px] font-bold text-[#718096] uppercase">Học phí còn lại cần đóng</span>
            <strong className="block font-display text-2xl font-bold text-rose-600 mt-1">3,500,000 ₫</strong>
            <span className="text-[10px] text-[#718096] block mt-1">Hạn đóng: 15/08/2026</span>
          </div>
        </div>

        {/* Schedule & Homework */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card title="Lịch học tuần này của con" subtitle="Thời khóa biểu lớp 12A & 10C">
            <div className="space-y-3 mt-2 text-xs text-[#2D3748]">
              <div className="flex items-center justify-between border-b border-[#EDF2F7] pb-2">
                <div>
                  <strong>Toán nâng cao (Thầy Trần Quốc Việt)</strong>
                  <span className="block text-[10px] text-[#718096] mt-0.5">T2/T4/T6 · 18:00 - 19:30 · P.302</span>
                </div>
                <Badge status="Đang hoạt động">Học trực tiếp</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <strong>IELTS Foundation (Thầy Lê Hoàng Anh)</strong>
                  <span className="block text-[10px] text-[#718096] mt-0.5">T2/T4/T6 · 19:45 - 21:15 · P.201</span>
                </div>
                <Badge status="Đang hoạt động">Học trực tiếp</Badge>
              </div>
            </div>
          </Card>

          <Card title="Bài tập về nhà chưa nộp của con" subtitle="Giám sát hạn chót nộp bài">
            <div className="space-y-3 mt-2 text-xs">
              <div className="flex items-center justify-between border-b border-[#EDF2F7] pb-2">
                <div>
                  <strong>Bài tập Hàm số bậc hai</strong>
                  <span className="block text-[10px] text-rose-500 mt-0.5">Hạn nộp: Hôm nay (10/08)</span>
                </div>
                <span className="text-xs text-[#718096]">Chưa nộp bài</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <strong>Phân tích tác phẩm Chí Phèo (Ngữ văn)</strong>
                  <span className="block text-[10px] text-amber-500 mt-0.5">Hạn nộp: 12/08/2026</span>
                </div>
                <span className="text-xs text-emerald-600 font-semibold">Đã nộp nháp</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  switch (currentRole) {
    case 'OWNER':
    case 'ACADEMIC_STAFF':
    case 'ACCOUNTANT':
      return renderExecutiveDashboard();
    case 'TEACHER':
      return renderTeacherDashboard();
    case 'STUDENT':
      return renderStudentDashboard();
    case 'PARENT':
      return renderParentDashboard();
    default:
      return renderExecutiveDashboard();
  }
};

// Mini internal KPI widget
const KpiItemMini: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="rounded-xl border border-[#DCE7F3] bg-white p-3 text-center">
    <span className="block text-[10px] font-bold text-[#718096] uppercase">{label}</span>
    <strong className={`block text-xs md:text-sm font-extrabold ${color} mt-1`}>{value}</strong>
  </div>
);

import React, { useState } from 'react';
import { Check, X, Clock, CalendarDays, RefreshCw, Save, Users, UserCheck } from 'lucide-react';
import { Student } from '../types';
import { Button, Badge } from './Common';

interface AttendanceViewProps {
  students: Student[];
  onSaveAttendance: (msg: string) => void;
}

type AttendanceStatus = 'present' | 'late' | 'excused' | 'absent';

interface StudentAttendance {
  studentId: string;
  name: string;
  id: string; // duplicate of studentId for convenient rendering
  status: AttendanceStatus;
  notes: string;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ students, onSaveAttendance }) => {
  const [selectedClass, setSelectedClass] = useState<string>('MATH-12A');
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-10');

  // Filter students belonging to selected class
  const classStudents = students.filter(s => s.classId === selectedClass);

  // Maintain local attendance state
  const [attendanceState, setAttendanceState] = useState<Record<string, StudentAttendance>>(() => {
    const initialState: Record<string, StudentAttendance> = {};
    students.forEach(s => {
      initialState[s.id] = {
        studentId: s.id,
        name: s.name,
        id: s.id,
        status: 'present', // default is Present (Có mặt)
        notes: ''
      };
    });
    return initialState;
  });

  // Count summaries
  const getSummaryCounts = () => {
    let present = 0;
    let late = 0;
    let excused = 0;
    let absent = 0;

    classStudents.forEach(s => {
      const record = attendanceState[s.id];
      if (record) {
        if (record.status === 'present') present++;
        else if (record.status === 'late') late++;
        else if (record.status === 'excused') excused++;
        else if (record.status === 'absent') absent++;
      }
    });

    return { present, late, excused, absent };
  };

  const { present, late, excused, absent } = getSummaryCounts();

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }));
  };

  const handleMarkAllPresent = () => {
    setAttendanceState(prev => {
      const updated = { ...prev };
      classStudents.forEach(s => {
        updated[s.id] = {
          ...updated[s.id],
          status: 'present'
        };
      });
      return updated;
    });
  };

  const handleReset = () => {
    setAttendanceState(prev => {
      const updated = { ...prev };
      classStudents.forEach(s => {
        updated[s.id] = {
          ...updated[s.id],
          status: 'present',
          notes: ''
        };
      });
      return updated;
    });
  };

  const handleSave = () => {
    onSaveAttendance(`✓ Điểm danh lớp ${selectedClass === 'MATH-12A' ? '12A - Chuyên Toán' : selectedClass} ngày ${selectedDate} thành công. (Sĩ số: ${classStudents.length} - Có mặt: ${present}, Muộn: ${late}, Phép: ${excused}, Vắng: ${absent})`);
  };

  return (
    <div className="space-y-4">
      {/* Attendance Header Controls */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#DCE7F3] bg-white p-4 md:grid-cols-2">
        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5">Lớp học điểm danh</label>
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs md:text-sm text-[#2D3748] focus:border-[#2F80ED] focus:bg-white focus:outline-hidden font-medium"
          >
            <option value="MATH-12A">12A - Chuyên Toán (Toán nâng cao)</option>
            <option value="LIT-11B">11B - Ngữ Văn (Ngữ văn)</option>
            <option value="IELTS-10C">10C - IELTS Foundation (Tiếng Anh)</option>
            <option value="PHYS-12C">12C - Vật Lý AP (Vật lý)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5">Ngày điểm danh</label>
          <div className="relative">
            <CalendarDays className="absolute left-3 top-3 h-4.5 w-4.5 text-[#94A3B8]" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] pl-10 pr-3 text-xs md:text-sm text-[#2D3748] focus:border-[#2F80ED] focus:bg-white focus:outline-hidden font-medium"
            />
          </div>
        </div>
      </div>

      {/* Operational KPI summary widgets */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-center">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600">Có mặt</span>
          <span className="font-display text-2xl font-extrabold text-emerald-700 mt-1 block">{present}</span>
          <span className="text-[10px] text-emerald-600/70 font-medium">học viên</span>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 text-center">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600">Đi muộn</span>
          <span className="font-display text-2xl font-extrabold text-amber-700 mt-1 block">{late}</span>
          <span className="text-[10px] text-amber-600/70 font-medium">học viên</span>
        </div>
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-center">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-600">Có phép</span>
          <span className="font-display text-2xl font-extrabold text-indigo-700 mt-1 block">{excused}</span>
          <span className="text-[10px] text-indigo-600/70 font-medium">học viên</span>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-center">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-600">Vắng mặt</span>
          <span className="font-display text-2xl font-extrabold text-rose-700 mt-1 block">{absent}</span>
          <span className="text-[10px] text-rose-600/70 font-medium">học viên</span>
        </div>
      </div>

      {/* Main Attendance Table Layout */}
      <div className="rounded-xl border border-[#DCE7F3] bg-white shadow-xs overflow-hidden">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC] h-11">
              <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] w-[28%]">Học viên / Mã số</th>
              <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] text-center w-[12%]">Có mặt (P)</th>
              <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] text-center w-[12%]">Đi muộn (L)</th>
              <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] text-center w-[12%]">Có phép (E)</th>
              <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] text-center w-[12%]">Vắng mặt (A)</th>
              <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] w-[24%]">Ghi chú vận hành</th>
            </tr>
          </thead>
          <tbody>
            {classStudents.map((student) => {
              const record = attendanceState[student.id] || { status: 'present', notes: '' };

              return (
                <tr key={student.id} className="border-b border-[#EDF2F7] hover:bg-[#F7FAFC] transition-colors h-14">
                  {/* Student Details */}
                  <td className="p-3">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-full bg-[#EAF4FF] text-[#1C6DD0] font-bold flex items-center justify-center border border-[#B2D4FF] shrink-0">
                        {student.name.split(' ').pop()?.substring(0, 2)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#2D3748]">{student.name}</div>
                        <div className="text-[10px] text-[#718096] font-mono">{student.id}</div>
                      </div>
                    </div>
                  </td>

                  {/* Status buttons: Present */}
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleStatusChange(student.id, 'present')}
                      className={`h-9 w-18 inline-flex items-center justify-center rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        record.status === 'present'
                          ? 'bg-[#EBF7EE] text-[#27AE60] border-[#27AE60] shadow-xs'
                          : 'bg-white text-[#718096] border-[#DCE7F3] hover:bg-slate-50'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Có mặt
                    </button>
                  </td>

                  {/* Status buttons: Late */}
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleStatusChange(student.id, 'late')}
                      className={`h-9 w-18 inline-flex items-center justify-center rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        record.status === 'late'
                          ? 'bg-[#FEF9E7] text-[#D4AC0D] border-[#D4AC0D] shadow-xs'
                          : 'bg-white text-[#718096] border-[#DCE7F3] hover:bg-slate-50'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5 mr-1" /> Muộn
                    </button>
                  </td>

                  {/* Status buttons: Excused */}
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleStatusChange(student.id, 'excused')}
                      className={`h-9 w-18 inline-flex items-center justify-center rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        record.status === 'excused'
                          ? 'bg-[#EAF4FF] text-[#1C6DD0] border-[#1C6DD0] shadow-xs'
                          : 'bg-white text-[#718096] border-[#DCE7F3] hover:bg-slate-50'
                      }`}
                    >
                      Phép
                    </button>
                  </td>

                  {/* Status buttons: Absent */}
                  <td className="p-2 text-center">
                    <button
                      onClick={() => handleStatusChange(student.id, 'absent')}
                      className={`h-9 w-18 inline-flex items-center justify-center rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        record.status === 'absent'
                          ? 'bg-[#FDEDEC] text-[#EB5757] border-[#EB5757] shadow-xs'
                          : 'bg-white text-[#718096] border-[#DCE7F3] hover:bg-slate-50'
                      }`}
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Vắng
                    </button>
                  </td>

                  {/* Notes textbox */}
                  <td className="p-3">
                    <input
                      type="text"
                      value={record.notes}
                      placeholder="Không có ghi chú..."
                      onChange={(e) => handleNotesChange(student.id, e.target.value)}
                      className="h-8 w-full rounded-md border border-[#DCE7F3] bg-transparent px-2 text-xs text-[#2D3748] focus:border-[#2F80ED] focus:bg-white focus:outline-hidden"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty state fallback if class holds no students */}
        {classStudents.length === 0 && (
          <div className="p-10 text-center text-xs text-[#718096]">
            Không tìm thấy học sinh nào trong lớp học này.
          </div>
        )}
      </div>

      {/* Bottom Action Control Bar */}
      <div className="flex flex-col gap-2 rounded-xl border border-[#DCE7F3] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="soft" 
            size="sm" 
            className="cursor-pointer"
            onClick={handleMarkAllPresent}
          >
            <UserCheck className="h-4 w-4 mr-1.5 text-[#27AE60]" /> Đặt tất cả Có mặt
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="cursor-pointer text-[#718096]"
            onClick={handleReset}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Đặt lại
          </Button>
        </div>

        <Button 
          variant="primary" 
          size="md" 
          className="cursor-pointer font-bold shadow-xs"
          onClick={handleSave}
        >
          <Save className="h-4.5 w-4.5 mr-2" /> Lưu điểm danh lớp
        </Button>
      </div>
    </div>
  );
};

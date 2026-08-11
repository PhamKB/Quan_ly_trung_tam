import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, Clock, MapPin, User as UserIcon } from 'lucide-react';
import { Class } from '../types';
import { Button } from './Common';

interface ScheduleViewProps {
  classes: Class[];
}

interface CalendarEvent {
  id: string;
  className: string;
  subject: string;
  teacher: string;
  room: string;
  timeStart: string;
  timeEnd: string;
  days: number[]; // 1 = T2, 2 = T3, 3 = T4, 4 = T5, 5 = T6, 6 = T7, 0 = CN
  color: string;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({ classes }) => {
  const [currentWeekOffset, setCurrentWeekOffset] = useState<number>(0);
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('All');
  const [selectedRoom, setSelectedRoom] = useState<string>('All');
  const [viewType, setViewType] = useState<'Day' | 'Week' | 'Month'>('Week');

  // Hardcode beautiful scheduling blocks corresponding to Vietnamese curriculum structure
  const EVENTS: CalendarEvent[] = [
    {
      id: 'EV-1',
      className: '12A - Chuyên Toán',
      subject: 'Toán nâng cao',
      teacher: 'Trần Quốc Việt',
      room: 'P.302',
      timeStart: '18:00',
      timeEnd: '19:30',
      days: [1, 3, 5], // T2, T4, T6
      color: 'bg-[#EAF4FF] text-[#1C6DD0] border-l-4 border-[#2F80ED]'
    },
    {
      id: 'EV-2',
      className: '11B - Ngữ Văn',
      subject: 'Ngữ văn',
      teacher: 'Nguyễn Thu Hà',
      room: 'P.205',
      timeStart: '19:45',
      timeEnd: '21:15',
      days: [2, 4], // T3, T5
      color: 'bg-emerald-50 text-emerald-700 border-l-4 border-emerald-500'
    },
    {
      id: 'EV-3',
      className: '10C - IELTS Foundation',
      subject: 'Tiếng Anh',
      teacher: 'Lê Hoàng Anh',
      room: 'P.201',
      timeStart: '19:45',
      timeEnd: '21:15',
      days: [1, 3, 5], // T2, T4, T6
      color: 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500'
    },
    {
      id: 'EV-4',
      className: '12C - Vật Lý AP',
      subject: 'Vật lý',
      teacher: 'Phạm Minh Đức',
      room: 'P.104',
      timeStart: '09:00',
      timeEnd: '10:30',
      days: [6, 0], // T7, CN
      color: 'bg-amber-50 text-amber-700 border-l-4 border-amber-500'
    },
    {
      id: 'EV-5',
      className: '11A - Tiếng Anh Advanced',
      subject: 'IELTS Advanced',
      teacher: 'Nguyễn Thu Hà',
      room: 'P.301',
      timeStart: '18:00',
      timeEnd: '19:30',
      days: [2, 4], // T3, T5
      color: 'bg-purple-50 text-purple-700 border-l-4 border-purple-500'
    }
  ];

  // Filters setup
  const teachersList = ['All', ...Array.from(new Set(EVENTS.map(e => e.teacher)))];
  const classesList = ['All', ...Array.from(new Set(EVENTS.map(e => e.className)))];
  const roomsList = ['All', ...Array.from(new Set(EVENTS.map(e => e.room)))];

  const filteredEvents = EVENTS.filter(event => {
    if (selectedClass !== 'All' && event.className !== selectedClass) return false;
    if (selectedTeacher !== 'All' && event.teacher !== selectedTeacher) return false;
    if (selectedRoom !== 'All' && event.room !== selectedRoom) return false;
    return true;
  });

  const weekdays = [
    { label: 'Thứ 2', code: 1, dateStr: '10/08' },
    { label: 'Thứ 3', code: 2, dateStr: '11/08' },
    { label: 'Thứ 4', code: 3, dateStr: '12/08' },
    { label: 'Thứ 5', code: 4, dateStr: '13/08' },
    { label: 'Thứ 6', code: 5, dateStr: '14/08' },
    { label: 'Thứ 7', code: 6, dateStr: '15/08' },
    { label: 'Chủ Nhật', code: 0, dateStr: '16/08' },
  ];

  const timeslots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

  // Render events for a specific hour slot + day code
  const getEventForSlot = (dayCode: number, hour: string) => {
    const slotHour = parseInt(hour.split(':')[0]);
    
    return filteredEvents.filter(e => {
      if (!e.days.includes(dayCode)) return false;
      const eventHour = parseInt(e.timeStart.split(':')[0]);
      return eventHour === slotHour;
    });
  };

  return (
    <div className="space-y-4">
      {/* Schedule Header / Control Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-[#DCE7F3] bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-9 px-2 cursor-pointer"
            onClick={() => setCurrentWeekOffset(prev => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4" /> Lùi
          </Button>
          <Button 
            variant="soft" 
            size="sm" 
            className="h-9 cursor-pointer text-[#1C6DD0] bg-[#EAF4FF] font-bold"
            onClick={() => setCurrentWeekOffset(0)}
          >
            Tuần hiện tại
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            className="h-9 px-2 cursor-pointer"
            onClick={() => setCurrentWeekOffset(prev => prev + 1)}
          >
            Tiến <ChevronRight className="h-4 w-4" />
          </Button>
          
          <div className="ml-2 text-xs font-bold text-[#2D3748] font-display md:text-sm">
            Tuần 10/08 - 16/08 (Năm học 2026-2027) {currentWeekOffset !== 0 && `(Lệch ${currentWeekOffset > 0 ? '+' : ''}${currentWeekOffset} tuần)`}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-1 rounded-lg bg-[#F7FAFC] p-1 border border-[#DCE7F3]">
          {(['Day', 'Week', 'Month'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setViewType(view)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold cursor-pointer transition-all ${
                viewType === view 
                  ? 'bg-white text-[#1C6DD0] shadow-xs' 
                  : 'text-[#718096] hover:text-[#2D3748]'
              }`}
            >
              {view === 'Day' ? 'Ngày' : view === 'Week' ? 'Tuần' : 'Tháng'}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Filters Grid */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#DCE7F3] bg-white p-4 md:grid-cols-3">
        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5">Lớp học</label>
          <select 
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs md:text-sm text-[#2D3748] focus:border-[#2F80ED] focus:bg-white focus:outline-hidden"
          >
            {classesList.map(c => <option key={c} value={c}>{c === 'All' ? 'Tất cả lớp học' : c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5">Giáo viên</label>
          <select 
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs md:text-sm text-[#2D3748] focus:border-[#2F80ED] focus:bg-white focus:outline-hidden"
          >
            {teachersList.map(t => <option key={t} value={t}>{t === 'All' ? 'Tất cả giáo viên' : t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5">Phòng học</label>
          <select 
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="h-10 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs md:text-sm text-[#2D3748] focus:border-[#2F80ED] focus:bg-white focus:outline-hidden"
          >
            {roomsList.map(r => <option key={r} value={r}>{r === 'All' ? 'Tất cả phòng' : r}</option>)}
          </select>
        </div>
      </div>

      {/* Calendar Stage */}
      <div className="rounded-xl border border-[#DCE7F3] bg-white shadow-xs overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-left">
          {/* Table Header with Days */}
          <thead>
            <tr className="border-b border-[#DCE7F3] bg-[#F7FAFC]">
              <th className="w-20 border-r border-[#DCE7F3] p-3 text-center text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                Giờ
              </th>
              {weekdays.map((day) => (
                <th key={day.code} className="border-r border-[#DCE7F3] p-3 text-center w-[13%]">
                  <span className="block text-xs font-bold text-[#2D3748]">{day.label}</span>
                  <span className="text-[10px] text-[#94A3B8] font-medium">{day.dateStr}</span>
                </th>
              ))}
            </tr>
          </thead>

          {/* Hourly Slots */}
          <tbody>
            {timeslots.map((slot) => (
              <tr key={slot} className="border-b border-[#EDF2F7] hover:bg-slate-50/50 transition-colors">
                {/* Hour display */}
                <td className="border-r border-[#DCE7F3] py-4 px-2 text-center text-xs font-bold text-[#718096] bg-[#F7FAFC]/30">
                  {slot}
                </td>

                {/* Day Blocks */}
                {weekdays.map((day) => {
                  const events = getEventForSlot(day.code, slot);
                  const isWeekend = day.code === 6 || day.code === 0;

                  return (
                    <td 
                      key={day.code} 
                      className={`border-r border-[#DCE7F3] p-1.5 align-top min-h-[70px] relative ${
                        isWeekend ? 'bg-slate-50/30' : ''
                      }`}
                    >
                      {events.map((ev) => (
                        <div 
                          key={ev.id} 
                          className={`rounded-lg p-2.5 shadow-xs text-xs border border-[#DCE7F3] mb-1.5 transition-all hover:-translate-y-0.5 hover:shadow-xs cursor-pointer ${ev.color}`}
                        >
                          <div className="font-display font-bold leading-tight truncate">{ev.className}</div>
                          <div className="text-[10px] font-medium text-[#718096] mt-0.5">{ev.subject}</div>
                          
                          <div className="mt-2 space-y-1 text-[10px] text-[#718096] border-t border-black/5 pt-1.5">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1 text-[#94A3B8]" />
                              <span>{ev.timeStart} - {ev.timeEnd}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1 text-[#94A3B8]" />
                              <span>{ev.room}</span>
                            </div>
                            <div className="flex items-center">
                              <UserIcon className="h-3 w-3 mr-1 text-[#94A3B8]" />
                              <span>{ev.teacher}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

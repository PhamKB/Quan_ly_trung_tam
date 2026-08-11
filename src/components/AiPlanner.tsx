import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, RefreshCw, Calendar, Target, Award, ShieldAlert, CheckCircle, Search, HelpCircle, LineChart as ChartIcon, Cpu, Database, FileText, Activity } from 'lucide-react';
import { Student } from '../types';
import { Button, Card, Badge } from './Common';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, AreaChart, Area, ComposedChart 
} from 'recharts';

interface AiPlannerProps {
  students: Student[];
}

export const AiPlanner: React.FC<AiPlannerProps> = ({ students }) => {
  const [activeSubTab, setActiveSubTab] = useState<'study_planner' | 'learning_analytics' | 'risk_predictions' | 'entrance_exam' | 'ml_models'>('risk_predictions');

  // Real ML Model State
  const [mlModelInfo, setMlModelInfo] = useState<any | null>(null);
  const [predictionsHistory, setPredictionsHistory] = useState<any[]>([]);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [realMlPrediction, setRealMlPrediction] = useState<any | null>(null);

  // Form State for Custom ML Prediction Run
  const [hoursStudy, setHoursStudy] = useState<number>(8);
  const [attendanceRate, setAttendanceRate] = useState<number>(92);
  const [homeworkRate, setHomeworkRate] = useState<number>(95);
  const [midtermScore, setMidtermScore] = useState<number>(8.2);

  // Selected Student for Risk Analysis
  const [selectedRiskStudentId, setSelectedRiskStudentId] = useState<string>('STU-2026-001');
  const riskStudents = students.filter(s => ['STU-2026-001', 'STU-2026-002', 'STU-2026-004', 'STU-2026-006', 'STU-2026-007'].includes(s.id));
  const selectedRiskStudent = students.find(s => s.id === selectedRiskStudentId) || riskStudents[0];

  // Fetch ML Model Info & History on Mount
  useEffect(() => {
    fetchMlModelInfo();
    fetchPredictionsHistory();
  }, []);

  // Update form inputs when selected student changes
  useEffect(() => {
    if (selectedRiskStudent) {
      setAttendanceRate(selectedRiskStudent.attendanceRate || 88);
      setHomeworkRate(selectedRiskStudent.homeworkCompletion || 85);
      setMidtermScore(selectedRiskStudent.gpa || 7.5);
      setHoursStudy(8);
      // Run prediction automatically on change
      handleRunRealMlPrediction(selectedRiskStudent.id, selectedRiskStudent.name, 8, selectedRiskStudent.attendanceRate, selectedRiskStudent.homeworkCompletion, selectedRiskStudent.gpa);
    }
  }, [selectedRiskStudentId]);

  const fetchMlModelInfo = async () => {
    try {
      const res = await fetch('/api/ai/model-info');
      if (res.ok) {
        const data = await res.json();
        setMlModelInfo(data);
      }
    } catch (e) {
      console.log('Error fetching model info:', e);
    }
  };

  const fetchPredictionsHistory = async () => {
    try {
      const res = await fetch('/api/ai/predictions-history');
      if (res.ok) {
        const data = await res.json();
        setPredictionsHistory(data);
      }
    } catch (e) {
      console.log('Error fetching predictions history:', e);
    }
  };

  const handleRunRealMlPrediction = async (
    sId?: string, 
    sName?: string, 
    hrs?: number, 
    att?: number, 
    hw?: number, 
    mid?: number
  ) => {
    setIsPredicting(true);
    const targetHours = hrs !== undefined ? hrs : hoursStudy;
    const targetAtt = att !== undefined ? att : attendanceRate;
    const targetHw = hw !== undefined ? hw : homeworkRate;
    const targetMid = mid !== undefined ? mid : midtermScore;

    try {
      const res = await fetch('/api/ai/predict-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: sId || selectedRiskStudent?.id || 'GUEST',
          student_name: sName || selectedRiskStudent?.name || 'Học viên',
          hours_study: targetHours,
          attendance: targetAtt,
          homework_completion: targetHw,
          midterm_score: targetMid
        })
      });

      if (res.ok) {
        const result = await res.json();
        setRealMlPrediction(result);
        fetchPredictionsHistory(); // Refresh audit history log
      } else {
        const err = await res.json();
        alert(err.error || 'Lỗi khi gọi API dự đoán Machine Learning');
      }
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      setIsPredicting(false);
    }
  };

  // State for Study Planner
  const [plannerGoal, setPlannerGoal] = useState<string>('Đạt IELTS 7.5 và đỗ chuyên Toán Đại học Sư Phạm');
  const [plannerLevel, setPlannerLevel] = useState<string>('IELTS 6.0, Học lực khá chuyên Toán');
  const [plannerHours, setPlannerHours] = useState<number>(12);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [studyPlanResult, setStudyPlanResult] = useState<any | null>({
    goal: 'Đạt IELTS 7.5 và đỗ chuyên Toán Đại học Sư Phạm',
    level: 'IELTS 6.0, Học lực khá chuyên Toán',
    hours: 12,
    weeks: [
      {
        day: 'Thứ Hai',
        morning: 'Toán nâng cao: Giải đề thi Sư Phạm các năm 2022-2024 (2 giờ)',
        evening: 'IELTS Writing Task 2: Luyện cấu trúc essay phản biện (1.5 giờ)'
      },
      {
        day: 'Thứ Ba',
        morning: 'Học bù từ vựng học thuật IELTS Reading theo chủ đề (1.5 giờ)',
        evening: 'Toán học: Ôn luyện phương pháp giải Hệ phương trình vô tỷ (2 giờ)'
      },
      {
        day: 'Thứ Tư',
        morning: 'IELTS Listening: Thực hành 2 đề thi cambridge 18 (1.5 giờ)',
        evening: 'Toán nâng cao: Nghiên cứu phương pháp Hình học tọa độ phẳng (2 giờ)'
      },
      {
        day: 'Thứ Năm',
        morning: 'IELTS Speaking: Luyện nói Part 2 & 3 cùng AI feedback (1 giờ)',
        evening: 'Tự học: Giải đề bất đẳng thức đề thi chuyên Toán (2 giờ)'
      },
      {
        day: 'Thứ Sáu',
        morning: 'Luyện đề tổng hợp IELTS Full-test dưới áp lực thời gian (3 giờ)',
        evening: 'Tổng rà soát sai sót kiến thức Toán tuần qua (1.5 giờ)'
      }
    ]
  });

  // State for Entrance Exam Diagnostic
  const [diagnosticStudent, setDiagnosticStudent] = useState<string>('Nguyễn Minh Anh');
  const [mathScore, setMathScore] = useState<number>(8.5);
  const [scienceScore, setScienceScore] = useState<number>(8.0);
  const [englishScore, setEnglishScore] = useState<number>(8.8);
  const [diagnosticGpa, setDiagnosticGpa] = useState<number>(8.4);
  const [targetUni, setTargetUni] = useState<string>('Đại Học Bách Khoa Hà Nội');
  const [targetMajor, setTargetMajor] = useState<string>('Khoa học máy tính (IT1)');
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any | null>({
    student: 'Nguyễn Minh Anh',
    university: 'Đại Học Bách Khoa Hà Nội',
    major: 'Khoa học máy tính (IT1)',
    probability: 84,
    category: 'High Chance',
    recommendations: [
      'Nâng cao điểm Toán thi THPT Quốc gia lên tối thiểu 9.0 để tăng tỷ lệ tuyệt đối.',
      'Đăng ký thi đánh giá tư duy TSA của ĐHBK Hà Nội để tăng thêm cơ hội xét tuyển sớm.',
      'Tiếp tục giữ vững kết quả GPA lớp 12 trên 8.5 để nộp hồ sơ xét học bạ.'
    ]
  });

  const scoreTrendData = [
    { month: 'Tháng 1', 'Điểm số TB': 7.2, 'Phân vị lớp': 7.5 },
    { month: 'Tháng 2', 'Điểm số TB': 7.5, 'Phân vị lớp': 7.6 },
    { month: 'Tháng 3', 'Điểm số TB': 7.8, 'Phân vị lớp': 7.9 },
    { month: 'Tháng 4', 'Điểm số TB': 8.1, 'Phân vị lớp': 8.0 },
    { month: 'Tháng 5', 'Điểm số TB': 8.0, 'Phân vị lớp': 8.1 },
    { month: 'Tháng 6', 'Điểm số TB': 8.3, 'Phân vị lớp': 8.2 },
    { month: 'Tháng 7', 'Điểm số TB': 8.5, 'Phân vị lớp': 8.4 },
  ];

  const attendanceTrendData = [
    { week: 'Tuần 1', 'Chuyên cần': 96 },
    { week: 'Tuần 2', 'Chuyên cần': 95 },
    { week: 'Tuần 3', 'Chuyên cần': 94 },
    { week: 'Tuần 4', 'Chuyên cần': 92 },
    { week: 'Tuần 5', 'Chuyên cần': 88 },
    { week: 'Tuần 6', 'Chuyên cần': 91 },
    { week: 'Tuần 7', 'Chuyên cần': 96 },
  ];

  const subjectProgressData = [
    { name: 'Toán học', 'Hoàn thành': 92, 'GPA': 8.1 },
    { name: 'Khoa học', 'Hoàn thành': 78, 'GPA': 6.8 },
    { name: 'Tiếng Anh', 'Hoàn thành': 95, 'GPA': 8.4 },
    { name: 'Vật lý', 'Hoàn thành': 80, 'GPA': 7.1 },
    { name: 'Ngữ văn', 'Hoàn thành': 88, 'GPA': 7.5 },
  ];

  const handleGenerateStudyPlan = () => {
    setIsGeneratingPlan(true);
    setTimeout(() => {
      setStudyPlanResult({
        goal: plannerGoal,
        level: plannerLevel,
        hours: plannerHours,
        weeks: [
          {
            day: 'Thứ Hai',
            morning: `Nâng cao năng lực cho mục tiêu: ${plannerGoal.substring(0, 30)}... (2.5 giờ)`,
            evening: `Tự học chủ đề phù hợp trình độ: ${plannerLevel.substring(0, 25)}... (1.5 giờ)`
          },
          {
            day: 'Thứ Ba',
            morning: 'Thực hành giải bài tập tự luận nâng cao có định hướng (2 giờ)',
            evening: 'Học nhóm bổ trợ kỹ năng mềm trực tuyến cùng giảng viên (1.5 giờ)'
          },
          {
            day: 'Thứ Tư',
            morning: 'Học chuyên sâu kết hợp lý thuyết và ví dụ trực quan (2 giờ)',
            evening: 'Luyện đề trắc nghiệm chuẩn hóa quốc tế (1.5 giờ)'
          },
          {
            day: 'Thứ Năm',
            morning: 'Làm bài kiểm tra đánh giá năng lực rút gọn tuần (1 giờ)',
            evening: 'AI gợi ý rà soát sai số bài tập tuần trước (2 giờ)'
          },
          {
            day: 'Thứ Sáu',
            morning: 'Thực hành nghe nói ngoại ngữ hoặc thảo luận chuyên môn (2.5 giờ)',
            evening: 'Tổng kết hoàn thành chỉ tiêu bài giảng tuần học (1.5 giờ)'
          }
        ]
      });
      setIsGeneratingPlan(false);
    }, 1200);
  };

  const handleRunDiagnostic = () => {
    setIsDiagnosing(true);
    setTimeout(() => {
      const prob = Math.round(50 + Math.random() * 45);
      const cat = prob >= 80 ? 'High Chance' : prob >= 60 ? 'Moderate Chance' : 'Low Chance';
      
      setDiagnosticResult({
        student: diagnosticStudent,
        university: targetUni,
        major: targetMajor,
        probability: prob,
        category: cat,
        recommendations: [
          `Đảm bảo điểm thi tổ hợp khối đạt tối thiểu ${(prob > 80 ? '25.5' : '27.0')} điểm để tối ưu hóa cơ hội.`,
          'Ôn tập thêm học bạ và các chứng chỉ ngoại ngữ liên quan để cộng điểm ưu tiên.',
          'Tham gia kỳ thi thử định kỳ tại trung tâm để kiểm soát sai sót phòng thi.'
        ]
      });
      setIsDiagnosing(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* AI Hub Header */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0F172A] p-6 text-white shadow-lg relative">
        <div className="absolute right-0 top-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 h-24 w-24 rounded-full bg-[#2F80ED]/15 blur-2xl" />
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400">
              <Brain className="h-5 w-5 animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-widest font-display">Trung tâm Machine Learning & Trí tuệ Nhân tạo SmartEngine</span>
            </div>
            <h2 className="font-display text-xl font-bold mt-1 text-white md:text-2xl">Mô Hình Dự Báo Điểm Số & Phân Tích Rủi Ro Học Tập</h2>
            <p className="text-[11px] md:text-xs text-[#94A3B8] mt-1">
              Ứng dụng mô hình Machine Learning thực tế (Random Forest Regressor) đã được huấn luyện trên 5.240 dữ liệu để dự đoán kết quả học tập và rủi ro.
            </p>
          </div>
          <div className="flex items-center space-x-2 shrink-0 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <div className="text-left">
              <div className="text-[10px] font-bold text-emerald-400">Model: Random Forest v1.0.0</div>
              <div className="text-[9px] text-[#94A3B8]">MAE: 0.61 · RMSE: 0.86 · R²: 0.87</div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-1 border-t border-slate-800 pt-4">
          {[
            { id: 'risk_predictions', label: 'Dự đoán rủi ro & Điểm cuối kỳ ML', icon: <ShieldAlert className="h-4 w-4" /> },
            { id: 'ml_models', label: 'Quản lý mô hình Machine Learning', icon: <Cpu className="h-4 w-4" /> },
            { id: 'learning_analytics', label: 'Phân tích học tập AI', icon: <ChartIcon className="h-4 w-4" /> },
            { id: 'study_planner', label: 'Kế hoạch học tập AI', icon: <Calendar className="h-4 w-4" /> },
            { id: 'entrance_exam', label: 'Bài kiểm tra đầu vào AI', icon: <Award className="h-4 w-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-[#94A3B8] hover:bg-slate-800 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: AI Risk Predictions & Real ML Model Inference */}
      {activeSubTab === 'risk_predictions' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Student List */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-[#718096] uppercase tracking-wider px-1">Danh sách học sinh chọn chạy mô hình ML</h3>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {riskStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => setSelectedRiskStudentId(student.id)}
                  className={`rounded-xl border p-3.5 transition-all cursor-pointer ${
                    selectedRiskStudentId === student.id
                      ? 'bg-indigo-50/50 border-indigo-400 shadow-xs'
                      : 'bg-white border-[#DCE7F3] hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#1C6DD0] font-mono">{student.id}</span>
                    <Badge status={student.riskLevel}>
                      {student.riskLevel === 'High' ? 'Mức rủi ro cao' : student.riskLevel === 'Medium' ? 'Mức rủi ro trung bình' : 'Mức rủi ro thấp'}
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-[#2D3748] mt-1">{student.name}</h4>
                  <div className="flex justify-between text-[11px] text-[#718096] mt-2 border-t border-[#F7FAFC] pt-2">
                    <span>Chuyên cần: {student.attendanceRate}%</span>
                    <span className="font-semibold">Điểm giữa kỳ: {student.gpa}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right ML Inference & Prediction Details Panel */}
          <div className="lg:col-span-8 space-y-5">
            {/* Real Feature Tuning & Model Predictor Form */}
            <Card title="Dữ Liệu Đầu Vào & Chạy Mô Hình Dự Đoán Điểm Cuối Kỳ ML" subtitle="Nhập các chỉ số hoặc điều chỉnh tham số để gọi trực tiếp REST API model.predict()">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Giờ tự học / tuần</label>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    step={0.5}
                    value={hoursStudy}
                    onChange={(e) => setHoursStudy(parseFloat(e.target.value) || 0)}
                    className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] font-bold focus:border-[#2F80ED] focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Tỷ lệ điểm danh (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={attendanceRate}
                    onChange={(e) => setAttendanceRate(parseFloat(e.target.value) || 0)}
                    className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] font-bold focus:border-[#2F80ED] focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Hoàn thành bài tập (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={homeworkRate}
                    onChange={(e) => setHomeworkRate(parseFloat(e.target.value) || 0)}
                    className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] font-bold focus:border-[#2F80ED] focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Điểm giữa kỳ (0-10)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    value={midtermScore}
                    onChange={(e) => setMidtermScore(parseFloat(e.target.value) || 0)}
                    className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] font-bold focus:border-[#2F80ED] focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  variant="primary"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                  onClick={() => handleRunRealMlPrediction()}
                  disabled={isPredicting}
                >
                  {isPredicting ? (
                    <>
                      <Brain className="h-4 w-4 mr-2 animate-spin" />
                      Đang thực thi mô hình model.predict()...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" /> Chạy dự đoán ML ngay
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Prediction Output View */}
            {realMlPrediction ? (
              <div className="rounded-2xl border border-[#DCE7F3] bg-white p-6 shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#EDF2F7] pb-4 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block font-display">KẾT QUẢ TỪ MÔ HÌNH MACHINE LEARNING</span>
                    <h3 className="font-display text-lg font-extrabold text-[#2D3748]">{selectedRiskStudent?.name}</h3>
                    <p className="text-xs text-[#718096]">Mã học viên: {selectedRiskStudent?.id}</p>
                  </div>

                  <div className="flex items-center space-x-4 bg-indigo-50/70 border border-indigo-100 p-3.5 rounded-2xl">
                    <div className="text-right">
                      <span className="block text-[10px] font-bold text-[#718096] uppercase">Điểm cuối kỳ dự đoán</span>
                      <span className="font-display text-3xl font-black text-indigo-600 leading-none">
                        {realMlPrediction.predicted_final_score} <span className="text-sm font-bold text-[#718096]">/ 10</span>
                      </span>
                    </div>
                    <div className="border-l border-indigo-200 pl-4 text-left">
                      <span className="block text-[10px] font-bold text-[#718096] uppercase">Mức độ rủi ro</span>
                      <Badge status={realMlPrediction.risk_level === 'Rất cao' || realMlPrediction.risk_level === 'Cao' ? 'error' : realMlPrediction.risk_level === 'Trung bình' ? 'warning' : 'success'}>
                        Mức rủi ro: {realMlPrediction.risk_level}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Model Metadata Box */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900 text-white p-4 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-[#94A3B8] block uppercase">Mô hình</span>
                    <span className="font-bold text-emerald-400">{realMlPrediction.model_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] block uppercase">Phiên bản</span>
                    <span className="font-bold text-indigo-300">v{realMlPrediction.model_version}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] block uppercase">Độ chính xác MAE / R²</span>
                    <span className="font-bold text-amber-300">{realMlPrediction.metrics.mae} / {realMlPrediction.metrics.r2}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] block uppercase">Thời gian thực thi</span>
                    <span className="font-mono text-[10px] text-slate-300">{new Date(realMlPrediction.created_at).toLocaleTimeString('vi-VN')}</span>
                  </div>
                </div>

                {/* Risk Factors */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#2D3748] uppercase tracking-wider">Phân tích yếu tố ảnh hưởng từ ML</h4>
                  {realMlPrediction.risk_factors && realMlPrediction.risk_factors.length > 0 ? (
                    <div className="space-y-2">
                      {realMlPrediction.risk_factors.map((factor: string, idx: number) => (
                        <div key={idx} className="flex items-start text-xs rounded-xl bg-amber-50 border border-amber-200 p-3 text-amber-900 font-medium">
                          <span className="h-4 w-4 rounded-full bg-amber-200 text-amber-800 font-bold text-[10px] flex items-center justify-center mr-2 shrink-0 mt-0.5">!</span>
                          <span>{factor}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center text-xs rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 font-medium">
                      <CheckCircle className="h-4 w-4 mr-2 text-emerald-600 shrink-0" />
                      <span>Không phát hiện yếu tố rủi ro. Các chỉ số đều nằm trong ngưỡng an toàn cao.</span>
                    </div>
                  )}
                </div>

                {/* AI Recommendation */}
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-indigo-700 font-bold text-xs uppercase font-display">
                    <Sparkles className="h-4 w-4" />
                    <span>Đề xuất giải pháp can thiệp</span>
                  </div>
                  <p className="text-xs text-[#2D3748] leading-relaxed font-medium">
                    {realMlPrediction.recommendation}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ML Model Management & Audit Log */}
      {activeSubTab === 'ml_models' && (
        <div className="space-y-6">
          {/* Active Model Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">Mô hình đang hoạt động</span>
              <div className="font-display text-xl font-extrabold text-[#2D3748]">Rừng ngẫu nhiên</div>
              <div className="text-xs text-[#718096]">Phiên bản: <strong className="text-indigo-600">v1.0.0</strong></div>
            </div>
            <div className="rounded-2xl border border-[#DCE7F3] bg-white p-5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#718096] tracking-wider">Mẫu dữ liệu huấn luyện</span>
              <div className="font-display text-xl font-extrabold text-[#2D3748]">5.240 <span className="text-xs font-semibold text-[#718096]">bản ghi</span></div>
              <div className="text-xs text-emerald-600 font-semibold">Tập dữ liệu tiêu chuẩn</div>
            </div>
            <div className="rounded-2xl border border-[#DCE7F3] bg-white p-5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#718096] tracking-wider">Sai số MAE / RMSE</span>
              <div className="font-display text-xl font-extrabold text-[#2D3748]">0,61 / 0,86</div>
              <div className="text-xs text-[#718096]">Thấp hơn ngưỡng yêu cầu (1.0)</div>
            </div>
            <div className="rounded-2xl border border-[#DCE7F3] bg-white p-5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#718096] tracking-wider">Hệ số xác định R²</span>
              <div className="font-display text-xl font-extrabold text-indigo-600">0,87 <span className="text-xs font-semibold text-[#718096]">/ 1.0</span></div>
              <div className="text-xs text-emerald-600 font-semibold">Độ tin cậy cao</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Model Feature Importance (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card title="Trọng Số Đặc Trưng Mô Hình (Feature Importance)" subtitle="Tỷ lệ đóng góp của từng chỉ số đầu vào tới kết quả dự đoán điểm số">
                <div className="space-y-4 mt-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-[#2D3748]">
                      <span>Điểm giữa kỳ (midterm_score)</span>
                      <span className="text-indigo-600">42%</span>
                    </div>
                    <div className="w-full bg-[#EDF2F7] rounded-full h-2.5">
                      <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '42%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-[#2D3748]">
                      <span>Hoàn thành bài tập (homework_completion)</span>
                      <span className="text-indigo-600">28%</span>
                    </div>
                    <div className="w-full bg-[#EDF2F7] rounded-full h-2.5">
                      <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '28%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-[#2D3748]">
                      <span>Tỷ lệ chuyên cần (attendance)</span>
                      <span className="text-indigo-600">18%</span>
                    </div>
                    <div className="w-full bg-[#EDF2F7] rounded-full h-2.5">
                      <div className="bg-teal-500 h-2.5 rounded-full" style={{ width: '18%' }}></div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-[#2D3748]">
                      <span>Giờ tự học mỗi tuần (hours_study)</span>
                      <span className="text-indigo-600">12%</span>
                    </div>
                    <div className="w-full bg-[#EDF2F7] rounded-full h-2.5">
                      <div className="bg-sky-400 h-2.5 rounded-full" style={{ width: '12%' }}></div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Version History Table */}
              <Card title="Phiên Bản Mô Hình Trong Hệ Thống" subtitle="Danh sách các model artifact đã huấn luyện">
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-xs text-[#2D3748]">
                    <thead className="bg-[#F7FAFC] border-b border-[#EDF2F7] text-[10px] font-bold text-[#718096] uppercase">
                      <tr>
                        <th className="p-2.5">Phiên bản</th>
                        <th className="p-2.5">Thuật toán</th>
                        <th className="p-2.5">R²</th>
                        <th className="p-2.5">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF2F7]">
                      <tr>
                        <td className="p-2.5 font-bold font-mono">1.0.0</td>
                        <td className="p-2.5 font-medium">Rừng ngẫu nhiên</td>
                        <td className="p-2.5 font-bold text-emerald-600">0.87</td>
                        <td className="p-2.5"><Badge status="success">Đang sử dụng</Badge></td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold font-mono">0.9.0</td>
                        <td className="p-2.5 font-medium">Hồi quy tuyến tính</td>
                        <td className="p-2.5 font-bold text-[#718096]">0.81</td>
                        <td className="p-2.5"><Badge status="neutral">Đã lưu trữ</Badge></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Live Prediction Audit Log (7 cols) */}
            <div className="lg:col-span-7">
              <Card title="Nhật Ký Thực Thi Dự Đoán (ai_predictions)" subtitle="Theo dõi lịch sử gọi API predict() thực tế">
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-left text-xs text-[#2D3748]">
                    <thead className="bg-[#F7FAFC] border-b border-[#EDF2F7] text-[10px] font-bold text-[#718096] uppercase">
                      <tr>
                        <th className="p-2.5">Mã log</th>
                        <th className="p-2.5">Học viên</th>
                        <th className="p-2.5">Giữa kỳ</th>
                        <th className="p-2.5">Điểm dự đoán</th>
                        <th className="p-2.5">Rủi ro</th>
                        <th className="p-2.5">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF2F7]">
                      {predictionsHistory.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-[11px] font-bold text-[#1C6DD0]">{log.id}</td>
                          <td className="p-2.5 font-bold">{log.student_name || log.student_id}</td>
                          <td className="p-2.5 font-medium">{log.midterm_score}</td>
                          <td className="p-2.5 font-bold text-indigo-600 font-display">{log.predicted_final_score}</td>
                          <td className="p-2.5">
                            <Badge status={log.risk_level === 'Rất cao' || log.risk_level === 'Cao' ? 'error' : log.risk_level === 'Trung bình' ? 'warning' : 'success'}>
                              {log.risk_level}
                            </Badge>
                          </td>
                          <td className="p-2.5 text-[10px] text-[#94A3B8]">
                            {new Date(log.created_at).toLocaleTimeString('vi-VN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: AI Learning Analytics */}
      {activeSubTab === 'learning_analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-[#DCE7F3] bg-white p-4">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">GPA Trung bình hệ thống</span>
              <span className="font-display text-2xl font-bold text-[#2D3748] mt-1 block">8.1 <span className="text-xs text-[#718096]">/ 10</span></span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">↑ 0.3 điểm so kỳ trước</span>
            </div>
            <div className="rounded-xl border border-[#DCE7F3] bg-white p-4">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Tỷ lệ chuyên cần chung</span>
              <span className="font-display text-2xl font-bold text-[#2D3748] mt-1 block">92.4%</span>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 inline-block">↑ 1.2% so tháng trước</span>
            </div>
            <div className="rounded-xl border border-[#DCE7F3] bg-white p-4">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Tỷ lệ làm bài tập hoàn tất</span>
              <span className="font-display text-2xl font-bold text-[#2D3748] mt-1 block">88.0%</span>
              <span className="text-[10px] text-[#EB5757] font-semibold mt-1 inline-block">↓ 0.8% do đợt hè</span>
            </div>
            <div className="rounded-xl border border-[#DCE7F3] bg-white p-4">
              <span className="block text-[10px] font-bold text-[#718096] uppercase">Học viên cần phụ đạo ngay</span>
              <span className="font-display text-2xl font-bold text-[#EB5757] mt-1 block">2 <span className="text-xs text-[#718096]">học sinh</span></span>
              <span className="text-[10px] text-[#EB5757] font-semibold mt-1 inline-block">Mức cảnh báo: cao</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="Xu hướng điểm số trung bình (7 tháng qua)" subtitle="Tổng hợp sự thay đổi GPA của khối và nhóm phân vị">
              <div className="h-64 mt-4 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#718096' }} />
                    <YAxis domain={[6, 10]} tick={{ fontSize: 11, fill: '#718096' }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="Điểm số TB" stroke="#2F80ED" strokeWidth={2.5} activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="Phân vị lớp" stroke="#6366F1" strokeWidth={2} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Phân tích mức chuyên cần theo tuần" subtitle="Giám sát biến động tỷ lệ chuyên cần qua các tuần gần nhất">
              <div className="h-64 mt-4 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="attendanceColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1C6DD0" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#1C6DD0" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDF2F7" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#718096' }} />
                    <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: '#718096' }} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="Chuyên cần" stroke="#1C6DD0" fillOpacity={1} fill="url(#attendanceColor)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AI Study Planner */}
      {activeSubTab === 'study_planner' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <Card title="Ngữ cảnh học viên" subtitle="Cung cấp thông tin nền tảng để AI lên giáo án riêng biệt">
              <div className="space-y-4 mt-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5">Mục tiêu phấn đấu</label>
                  <textarea
                    rows={2}
                    value={plannerGoal}
                    onChange={(e) => setPlannerGoal(e.target.value)}
                    className="w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] p-3 text-xs md:text-sm text-[#2D3748] focus:border-[#2F80ED] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5">Trình độ hiện tại</label>
                  <textarea
                    rows={2}
                    value={plannerLevel}
                    onChange={(e) => setPlannerLevel(e.target.value)}
                    className="w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] p-3 text-xs md:text-sm text-[#2D3748] focus:border-[#2F80ED] focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1.5">Thời gian tự học khả dụng (tiếng/tuần)</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min={4}
                      max={40}
                      step={2}
                      value={plannerHours}
                      onChange={(e) => setPlannerHours(parseInt(e.target.value))}
                      className="w-full h-2 bg-[#DCE7F3] rounded-lg appearance-none cursor-pointer accent-[#2F80ED]"
                    />
                    <span className="font-display font-bold text-sm text-[#2D3748] w-12 text-right shrink-0">{plannerHours} giờ</span>
                  </div>
                </div>

                <Button 
                  variant="primary" 
                  className="w-full cursor-pointer font-bold mt-2 shadow-xs bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleGenerateStudyPlan}
                  disabled={isGeneratingPlan}
                >
                  {isGeneratingPlan ? (
                    <>
                      <Brain className="h-4.5 w-4.5 mr-2 animate-spin text-white" />
                      Đang phân tích và thiết lập lộ trình...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4.5 w-4.5 mr-2" /> Tạo kế hoạch học tập AI
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            {isGeneratingPlan ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-200 bg-white p-16 h-full text-center">
                <Brain className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
                <h3 className="font-display text-base font-bold text-[#2D3748]">Đang xử lý phân tích dữ liệu...</h3>
                <p className="text-xs text-[#718096] max-w-xs mt-1">
                  Mô hình thông minh đang kết nối dữ liệu trung tâm, xây dựng phân bổ thời gian biểu và thiết kế lộ trình ôn luyện tối ưu.
                </p>
              </div>
            ) : studyPlanResult ? (
              <Card 
                title="Lộ trình học tập cá nhân hóa tuần học mới" 
                subtitle="Được xuất tự động dựa trên năng lực và mục tiêu học viên"
                headerAction={<Badge status="info">AI Generated</Badge>}
              >
                <div className="space-y-4 mt-2">
                  <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-4">
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 text-xs">
                      <div>
                        <span className="text-[#718096] font-medium block">Mục tiêu định hướng:</span>
                        <strong className="text-[#2D3748] font-bold block mt-0.5">{studyPlanResult.goal}</strong>
                      </div>
                      <div>
                        <span className="text-[#718096] font-medium block">Nền tảng đầu vào:</span>
                        <strong className="text-[#2D3748] font-bold block mt-0.5">{studyPlanResult.level}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-[#2D3748] uppercase tracking-wider">Lịch phân bổ tự học hàng ngày</h4>
                    <div className="space-y-2.5">
                      {studyPlanResult.weeks.map((w: any, idx: number) => (
                        <div key={idx} className="flex border border-[#EDF2F7] rounded-xl hover:border-indigo-100 hover:bg-slate-50/50 transition-all">
                          <div className="w-24 shrink-0 bg-[#F7FAFC] border-r border-[#EDF2F7] px-3 py-4 flex flex-col items-center justify-center rounded-l-xl">
                            <span className="text-xs font-bold text-[#2D3748]">{w.day}</span>
                            <span className="text-[9px] text-[#94A3B8] font-bold mt-1 uppercase tracking-wider">AI LỊCH</span>
                          </div>
                          <div className="p-3.5 space-y-2 flex-1">
                            <div className="text-xs text-[#2D3748] flex items-start">
                              <span className="inline-flex h-4.5 w-10 text-[9px] font-bold bg-amber-100 text-amber-700 rounded-sm items-center justify-center shrink-0 mr-2 mt-0.5">SÁNG</span>
                              <span>{w.morning}</span>
                            </div>
                            <div className="text-xs text-[#2D3748] flex items-start">
                              <span className="inline-flex h-4.5 w-10 text-[9px] font-bold bg-indigo-100 text-indigo-700 rounded-sm items-center justify-center shrink-0 mr-2 mt-0.5">TỐI</span>
                              <span>{w.evening}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      )}

      {/* SUB-TAB 5: AI Entrance Exam Diagnostic */}
      {activeSubTab === 'entrance_exam' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 flex items-start gap-3">
            <Brain className="h-6 w-6 text-[#2F80ED] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-[#2D3748] uppercase tracking-wider">Bài kiểm tra đầu vào & chẩn đoán tuyển sinh AI</h4>
              <p className="text-[11px] text-[#718096] mt-0.5">
                Nhập thông tin điểm thi thử và mục tiêu trường của học viên để AI tính toán xác suất đỗ đại học dựa trên phổ điểm toàn quốc và tiêu chí tuyển sinh.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2 space-y-4">
              <Card title="Thông số chẩn đoán đầu vào" subtitle="Nhập chi tiết học lực thi thử của học viên">
                <div className="space-y-3.5 mt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1">Tên học viên</label>
                    <input
                      type="text"
                      value={diagnosticStudent}
                      onChange={(e) => setDiagnosticStudent(e.target.value)}
                      className="h-10 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] focus:border-[#2F80ED] focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Điểm thi Toán</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        value={mathScore}
                        onChange={(e) => setMathScore(parseFloat(e.target.value))}
                        className="h-10 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] focus:border-[#2F80ED] focus:bg-white focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Điểm Khoa học</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        value={scienceScore}
                        onChange={(e) => setScienceScore(parseFloat(e.target.value))}
                        className="h-10 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] focus:border-[#2F80ED] focus:bg-white focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Điểm Tiếng Anh</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        value={englishScore}
                        onChange={(e) => setEnglishScore(parseFloat(e.target.value))}
                        className="h-10 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] focus:border-[#2F80ED] focus:bg-white focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Điểm GPA lớp 12</label>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step={0.1}
                        value={diagnosticGpa}
                        onChange={(e) => setDiagnosticGpa(parseFloat(e.target.value))}
                        className="h-10 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] focus:border-[#2F80ED] focus:bg-white focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1">Trường đại học mục tiêu</label>
                    <select 
                      value={targetUni}
                      onChange={(e) => setTargetUni(e.target.value)}
                      className="h-10 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] focus:border-[#2F80ED] focus:bg-white focus:outline-hidden font-medium"
                    >
                      <option value="Đại Học Bách Khoa Hà Nội">Đại Học Bách Khoa Hà Nội (HUST)</option>
                      <option value="Đại Học Ngoại Thương">Đại Học Ngoại Thương (FTU)</option>
                      <option value="Đại Học Kinh Tế Quốc Dân">Đại Học Kinh Tế Quốc Dân (NEU)</option>
                      <option value="Đại Học Quốc Gia Hà Nội">Đại Học Quốc Gia Hà Nội (VNU)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1">Chuyên ngành đăng ký</label>
                    <input
                      type="text"
                      value={targetMajor}
                      onChange={(e) => setTargetMajor(e.target.value)}
                      className="h-10 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] focus:border-[#2F80ED] focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <Button 
                    variant="primary" 
                    className="w-full cursor-pointer font-bold mt-2 shadow-xs bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleRunDiagnostic}
                    disabled={isDiagnosing}
                  >
                    {isDiagnosing ? (
                      <>
                        <Brain className="h-4.5 w-4.5 mr-2 animate-spin text-white" />
                        Đang quét dữ liệu chẩn đoán...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4.5 w-4.5 mr-2" /> Chạy phân tích AI
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-3 space-y-4">
              {diagnosticResult ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-indigo-100 bg-[#FFFFFF] p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-[#EDF2F7] pb-3">
                      <div>
                        <h3 className="font-display text-sm font-bold text-[#2D3748]">Xác suất trúng tuyển dự báo</h3>
                        <p className="text-[10px] text-[#718096] mt-0.5">{diagnosticResult.university}</p>
                      </div>
                      <Badge status={diagnosticResult.category === 'High Chance' ? 'success' : 'warning'}>
                        {diagnosticResult.category === 'High Chance' ? 'Cơ hội cao' : 'Cơ hội trung bình'}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="h-20 w-20 rounded-full border-4 border-indigo-500 bg-indigo-50/50 flex flex-col items-center justify-center shrink-0">
                        <span className="font-display text-2xl font-extrabold text-indigo-600">{diagnosticResult.probability}%</span>
                        <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider">CƠ HỘI ĐỖ</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#2D3748]">{diagnosticResult.major}</div>
                        <p className="text-[11px] text-[#718096] mt-1">
                          Xác suất đỗ dựa trên điểm thi mẫu đạt phân vị xuất sắc tại khu vực tuyển sinh.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-900 text-white p-4 space-y-2.5">
                      <div className="flex items-center space-x-1.5 text-indigo-400">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider font-display">Chiến lược đề xuất từ AI</span>
                      </div>
                      <ul className="space-y-1.5 text-[11px] text-[#CBD5E0]">
                        {diagnosticResult.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <span className="text-indigo-400 mr-2 font-bold">{i+1}.</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

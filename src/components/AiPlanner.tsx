import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, RefreshCw, Calendar, Target, Award, ShieldAlert, CheckCircle, Search, HelpCircle, LineChart as ChartIcon, Cpu, Database, FileText, Activity, AlertTriangle, Check, Info } from 'lucide-react';
import { Student } from '../types';
import { Button, Card, Badge } from './Common';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  BarChart, Bar, AreaChart, Area, ScatterChart, Scatter
} from 'recharts';

interface AiPlannerProps {
  students: Student[];
}

export const AiPlanner: React.FC<AiPlannerProps> = ({ students }) => {
  const [activeSubTab, setActiveSubTab] = useState<'study_planner' | 'learning_analytics' | 'risk_predictions' | 'entrance_exam' | 'ml_models' | 'monitoring'>('risk_predictions');

  // Real ML Model State
  const [mlModelInfo, setMlModelInfo] = useState<any | null>(null);
  const [modelRegistry, setModelRegistry] = useState<any[]>([]);
  const [monitoringMetrics, setMonitoringMetrics] = useState<any | null>(null);
  const [predictionsHistory, setPredictionsHistory] = useState<any[]>([]);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [realMlPrediction, setRealMlPrediction] = useState<any | null>(null);

  // Form State for 11 UCI Features ML Prediction
  const [studytime, setStudytime] = useState<number>(3); // 1: <2h, 2: 2-5h, 3: 5-10h, 4: >10h
  const [failures, setFailures] = useState<number>(0); // 0-4
  const [absences, setAbsences] = useState<number>(2); // 0-100
  const [g1, setG1] = useState<number>(14); // 0-20
  const [school, setSchool] = useState<string>('GP'); // GP or MS
  const [sex, setSex] = useState<string>('F'); // F or M
  const [age, setAge] = useState<number>(15); // 10-30
  const [internet, setInternet] = useState<string>('yes');
  const [higher, setHigher] = useState<string>('yes');
  const [goout, setGoout] = useState<number>(3); // 1-5
  const [health, setHealth] = useState<number>(4); // 1-5

  // Modal State for Evaluating Actual Score
  const [evaluatingRecord, setEvaluatingRecord] = useState<any | null>(null);
  const [actualScoreInput, setActualScoreInput] = useState<number>(15.0);
  const [isSubmittingEvaluation, setIsSubmittingEvaluation] = useState<boolean>(false);

  // Selected Student for Risk Analysis
  const [selectedRiskStudentId, setSelectedRiskStudentId] = useState<string>('STU-2026-001');
  const riskStudents = students.filter(s => ['STU-2026-001', 'STU-2026-002', 'STU-2026-004', 'STU-2026-006', 'STU-2026-007'].includes(s.id));
  const selectedRiskStudent = students.find(s => s.id === selectedRiskStudentId) || riskStudents[0];

  // Fetch ML Model Info, Registry, History & Monitoring Data on Mount
  useEffect(() => {
    fetchMlModelInfo();
    fetchModelRegistry();
    fetchPredictionsHistory();
    fetchMonitoringMetrics();
  }, []);

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

  const fetchModelRegistry = async () => {
    try {
      const res = await fetch('/api/ai/model-registry');
      if (res.ok) {
        const data = await res.json();
        setModelRegistry(data);
      }
    } catch (e) {
      console.log('Error fetching model registry:', e);
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

  const fetchMonitoringMetrics = async () => {
    try {
      const res = await fetch('/api/ai/monitoring');
      if (res.ok) {
        const data = await res.json();
        setMonitoringMetrics(data);
      }
    } catch (e) {
      console.log('Error fetching monitoring metrics:', e);
    }
  };

  const handleRunRealMlPrediction = async () => {
    setIsPredicting(true);
    try {
      const payload = {
        student_id: selectedRiskStudent?.id || 'STU-2026-001',
        student_name: selectedRiskStudent?.name || 'Học viên THCS',
        studytime,
        failures,
        absences,
        G1: g1,
        school,
        sex,
        age,
        internet,
        higher,
        goout,
        health
      };

      const res = await fetch('/api/ai/predict-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        setRealMlPrediction(result);
        fetchPredictionsHistory();
        fetchMonitoringMetrics();
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

  const handleEvaluatePrediction = async () => {
    if (!evaluatingRecord) return;
    setIsSubmittingEvaluation(true);
    try {
      const res = await fetch(`/api/ai/predictions/${evaluatingRecord.id}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualScore: Number(actualScoreInput) })
      });

      if (res.ok) {
        setEvaluatingRecord(null);
        fetchPredictionsHistory();
        fetchMonitoringMetrics();
      } else {
        const err = await res.json();
        alert(err.error || 'Lỗi khi lưu điểm thực tế.');
      }
    } catch (e) {
      console.error('Evaluation Error:', e);
    } finally {
      setIsSubmittingEvaluation(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Navigation */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-bold uppercase tracking-wider border border-indigo-400/20">
                Machine Learning System V1
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-400/20">
                v1.0.0 Active
              </span>
            </div>
            <h1 className="text-2xl font-black font-display tracking-tight">Trung Tâm AI & Dự Đoán Học Tập Machine Learning</h1>
            <p className="text-xs text-indigo-200/80 max-w-2xl">
              Hệ thống tích hợp mô hình Random Forest Regressor đã huấn luyện thực tế trên tập dữ liệu UCI Student Performance.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 shrink-0">
            <Brain className="h-8 w-8 text-indigo-400 shrink-0" />
            <div>
              <span className="block text-[10px] uppercase font-bold text-indigo-200">Mô hình Random Forest</span>
              <span className="font-display font-extrabold text-sm text-white">
                {mlModelInfo ? `${mlModelInfo.model_name} (v${mlModelInfo.version})` : 'Random Forest Regressor'}
              </span>
            </div>
          </div>
        </div>

        {/* Sub Tab Navigation */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-indigo-700/50 pt-4">
          <button
            onClick={() => setActiveSubTab('risk_predictions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'risk_predictions'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-indigo-200 hover:bg-white/10'
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Dự Đoán ML (11 Yếu Tố)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('monitoring')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'monitoring'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-indigo-200 hover:bg-white/10'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Giám Sát Mô Hình & Tracking</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ml_models')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === 'ml_models'
                ? 'bg-white text-indigo-900 shadow-sm'
                : 'text-indigo-200 hover:bg-white/10'
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span>Quản Quản Mô Hình & Governance</span>
          </button>
        </div>
      </div>

      {/* V1 Disclaimer Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 text-xs flex items-start space-x-3">
        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="font-bold">Thông báo quản trị mô hình V1 (UCI Student Performance Dataset):</strong>
          <p className="text-amber-800 leading-relaxed">
            Mô hình Machine Learning V1 được huấn luyện trên 11 chỉ số chuẩn hóa từ UCI Student Performance Dataset (gồm giờ tự học, điểm G1, tỷ lệ nghỉ học, sức khỏe...). Kết quả dự đoán điểm số chỉ mang tính chất tham khảo chuyên môn hỗ trợ giảng dạy và tư vấn học tập.
          </p>
        </div>
      </div>

      {/* SUB-TAB 1: ML Predict (11 UCI Features) */}
      {activeSubTab === 'risk_predictions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Student Selector Panel */}
          <div className="lg:col-span-4 space-y-4">
            <Card title="Chọn Học Viên Cần Phân Tích" subtitle="Chọn học viên để nạp chỉ số mặc định">
              <div className="space-y-2 mt-3">
                {riskStudents.map(student => (
                  <div
                    key={student.id}
                    onClick={() => setSelectedRiskStudentId(student.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      selectedRiskStudentId === student.id
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                        : 'border-[#EDF2F7] hover:border-indigo-200 hover:bg-[#F7FAFC]'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs text-[#2D3748] block">{student.name}</span>
                      <span className="text-[10px] text-[#718096]">Mã: {student.id} • Lớp {student.grade}</span>
                    </div>
                    <Badge status={student.gpa && student.gpa < 6.5 ? 'error' : 'success'}>
                      GPA: {student.gpa || 8.0}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right ML Predict Form */}
          <div className="lg:col-span-8 space-y-5">
            <Card title="Chạy Suy Luận Mô Hình ML V1 (11 Yếu Tố UCI)" subtitle="Nhập 11 thuộc tính để gọi trực tiếp mô hình Random Forest Regressor">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mt-3">
                <div>
                  <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Giờ tự học (studytime)</label>
                  <select
                    value={studytime}
                    onChange={(e) => setStudytime(Number(e.target.value))}
                    className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] font-bold"
                  >
                    <option value={1}>1: Thấp (&lt; 2 giờ/tuần)</option>
                    <option value={2}>2: Trung bình (2 - 5 giờ/tuần)</option>
                    <option value={3}>3: Khá (5 - 10 giờ/tuần)</option>
                    <option value={4}>4: Cao (&gt; 10 giờ/tuần)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Số môn không đạt (failures)</label>
                  <input
                    type="number"
                    min={0}
                    max={4}
                    value={failures}
                    onChange={(e) => setFailures(Number(e.target.value))}
                    className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Số buổi vắng (absences)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={absences}
                    onChange={(e) => setAbsences(Number(e.target.value))}
                    className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Điểm đợt 1 G1 (0-20)</label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    step={0.5}
                    value={g1}
                    onChange={(e) => setG1(Number(e.target.value))}
                    className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Trường học (school)</label>
                  <select
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] font-bold"
                  >
                    <option value="GP">GP - Gabriel Pereira</option>
                    <option value="MS">MS - Mousinho da Silveira</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Giới tính (sex)</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] font-bold"
                  >
                    <option value="F">Nữ (F)</option>
                    <option value="M">Nam (M)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Tuổi (age)</label>
                  <input
                    type="number"
                    min={10}
                    max={30}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Internet ở nhà (internet)</label>
                  <select
                    value={internet}
                    onChange={(e) => setInternet(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] font-bold"
                  >
                    <option value="yes">Có Internet (yes)</option>
                    <option value="no">Không có (no)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Muốn học đại học (higher)</label>
                  <select
                    value={higher}
                    onChange={(e) => setHigher(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] font-bold"
                  >
                    <option value="yes">Có nguyện vọng (yes)</option>
                    <option value="no">Không (no)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Mức độ đi chơi (goout 1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={goout}
                    onChange={(e) => setGoout(Number(e.target.value))}
                    className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#718096] uppercase mb-1">Sức khỏe (health 1-5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={health}
                    onChange={(e) => setHealth(Number(e.target.value))}
                    className="h-9 w-full rounded-lg border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-xs text-[#2D3748] font-bold"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  variant="primary"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                  onClick={handleRunRealMlPrediction}
                  disabled={isPredicting}
                >
                  {isPredicting ? (
                    <>
                      <Brain className="h-4 w-4 mr-2 animate-spin" />
                      Đang thực thi mô hình ML...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" /> Chạy Dự Đoán ML V1
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Prediction Result Display */}
            {realMlPrediction && (
              <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block font-display">KẾT QUẢ DỰ ĐOÁN TỪ MÔ HÌNH V1</span>
                    <h3 className="font-display text-lg font-extrabold text-[#2D3748]">{realMlPrediction.studentName}</h3>
                  </div>

                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-[#718096] uppercase">Điểm cuối kỳ dự đoán</span>
                    <span className="font-display text-3xl font-black text-indigo-600">
                      {realMlPrediction.predictedScore} <span className="text-sm font-bold text-[#718096]">/ 20</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900 text-white p-4 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Mô hình</span>
                    <span className="font-bold text-emerald-400">{realMlPrediction.modelName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Phiên bản</span>
                    <span className="font-bold text-indigo-300">v{realMlPrediction.modelVersion}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Mã bản ghi</span>
                    <span className="font-mono text-amber-300">{realMlPrediction.id}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Thời gian thực thi</span>
                    <span className="font-mono text-slate-300">{new Date(realMlPrediction.createdAt).toLocaleTimeString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Monitoring & Actual Score Evaluation */}
      {activeSubTab === 'monitoring' && (
        <div className="space-y-6">
          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-indigo-700 tracking-wider">Tổng số lượt dự đoán</span>
              <div className="font-display text-2xl font-black text-[#2D3748]">
                {monitoringMetrics?.totalPredictions || predictionsHistory.length} <span className="text-xs font-medium text-[#718096]">lượt</span>
              </div>
              <div className="text-xs text-[#718096]">Lưu trong ai_predictions</div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">Lượt đã đánh giá thực tế</span>
              <div className="font-display text-2xl font-black text-[#2D3748]">
                {monitoringMetrics?.evaluatedPredictions || 0} <span className="text-xs font-medium text-[#718096]">bản ghi</span>
              </div>
              <div className="text-xs text-emerald-600 font-semibold">Đã nhập actualScore</div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/30 p-5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-700 tracking-wider">Sai số MAE Thực Tế</span>
              <div className="font-display text-2xl font-black text-amber-900">
                {monitoringMetrics?.realMAE !== null ? monitoringMetrics?.realMAE : '---'}
              </div>
              <div className="text-xs text-[#718096]">So với MAE huấn luyện (1.53)</div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-1">
              <span className="text-[10px] font-bold uppercase text-[#718096] tracking-wider">Phiên Bản Hoạt Động</span>
              <div className="font-display text-2xl font-black text-indigo-600">v1.0.0</div>
              <div className="text-xs text-emerald-600 font-semibold">Random Forest Regressor</div>
            </div>
          </div>

          {/* Predictions Log & Evaluate Actual Score Table */}
          <Card title="Lịch Sử Dự Đoán & Đánh Giá Điểm Thực Tế (Prediction vs Actual)" subtitle="Xem lại các lượt dự đoán và nhập điểm thi thực tế để tính toán sai số tuyệt đối">
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs text-[#2D3748]">
                <thead className="bg-[#F7FAFC] border-b border-[#EDF2F7] text-[10px] font-bold text-[#718096] uppercase">
                  <tr>
                    <th className="p-3">Mã lượt</th>
                    <th className="p-3">Học sinh</th>
                    <th className="p-3">Điểm dự đoán</th>
                    <th className="p-3">Điểm thực tế</th>
                    <th className="p-3">Sai số tuyệt đối (|Pred - Act|)</th>
                    <th className="p-3">Thời gian</th>
                    <th className="p-3 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF2F7]">
                  {predictionsHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC]">
                      <td className="p-3 font-mono font-bold text-indigo-600">{item.id}</td>
                      <td className="p-3 font-semibold">{item.studentName} ({item.studentId})</td>
                      <td className="p-3 font-bold text-indigo-600">{item.predictedScore} / 20</td>
                      <td className="p-3">
                        {item.actualScore !== undefined ? (
                          <span className="font-bold text-emerald-600">{item.actualScore} / 20</span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa đánh giá</span>
                        )}
                      </td>
                      <td className="p-3">
                        {item.absoluteError !== undefined ? (
                          <span className={`font-bold px-2 py-0.5 rounded-md ${item.absoluteError <= 1.5 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {item.absoluteError}
                          </span>
                        ) : (
                          '---'
                        )}
                      </td>
                      <td className="p-3 text-[#718096]">{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="p-3 text-right">
                        <Button
                          variant="secondary"
                          className="text-[11px] h-7 px-2.5 py-0 cursor-pointer"
                          onClick={() => {
                            setEvaluatingRecord(item);
                            setActualScoreInput(item.actualScore || item.predictedScore);
                          }}
                        >
                          {item.actualScore !== undefined ? 'Cập nhật điểm' : 'Nhập điểm thực tế'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* SUB-TAB 3: Model Governance & Registry */}
      {activeSubTab === 'ml_models' && (
        <div className="space-y-6">
          <Card title="Danh Sách Mô Hình Trong Model Registry" subtitle="Quản trị phiên bản, metadata huấn luyện và tính năng rollback">
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs text-[#2D3748]">
                <thead className="bg-[#F7FAFC] border-b border-[#EDF2F7] text-[10px] font-bold text-[#718096] uppercase">
                  <tr>
                    <th className="p-3">Mã Mô Hình</th>
                    <th className="p-3">Phiên bản</th>
                    <th className="p-3">Thuật toán</th>
                    <th className="p-3">Tập dữ liệu</th>
                    <th className="p-3">Chỉ số MAE / R²</th>
                    <th className="p-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDF2F7]">
                  {modelRegistry.map((reg) => (
                    <tr key={reg.id}>
                      <td className="p-3 font-mono font-bold">{reg.id}</td>
                      <td className="p-3 font-bold text-indigo-600">v{reg.version}</td>
                      <td className="p-3">{reg.modelName}</td>
                      <td className="p-3 text-[#718096]">{reg.dataset}</td>
                      <td className="p-3 font-semibold text-emerald-600">{reg.metrics?.MAE} / {reg.metrics?.R2}</td>
                      <td className="p-3">
                        <Badge status="success">{reg.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Evaluate Actual Score Modal */}
      {evaluatingRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-display font-extrabold text-base text-[#2D3748]">
                Đánh Giá Điểm Thực Tế — {evaluatingRecord.id}
              </h3>
              <button
                onClick={() => setEvaluatingRecord(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#718096] block">Học viên:</span>
                <strong className="text-sm text-[#2D3748]">{evaluatingRecord.studentName} ({evaluatingRecord.studentId})</strong>
              </div>

              <div className="bg-indigo-50 p-3 rounded-xl flex justify-between items-center">
                <span className="text-indigo-900 font-medium">Điểm số AI dự đoán:</span>
                <strong className="text-indigo-600 text-lg font-black">{evaluatingRecord.predictedScore} / 20</strong>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#718096] uppercase mb-1">
                  Nhập điểm số thực tế kết thúc học kỳ (Thang điểm 0 - 20):
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  value={actualScoreInput}
                  onChange={(e) => setActualScoreInput(Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-[#DCE7F3] bg-[#F7FAFC] px-3 text-sm font-bold text-[#2D3748] focus:border-indigo-600 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <Button
                variant="secondary"
                onClick={() => setEvaluatingRecord(null)}
                className="cursor-pointer"
              >
                Hủy bỏ
              </Button>
              <Button
                variant="primary"
                onClick={handleEvaluatePrediction}
                disabled={isSubmittingEvaluation}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
              >
                {isSubmittingEvaluation ? 'Đang lưu...' : 'Lưu Điểm & Tính Sai Số'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

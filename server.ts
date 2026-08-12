import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { studentScoreService } from './src/ai/service/student_score_service';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase';
import { seedDatabase } from './src/lib/seedData';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory persistent predictions store for AI Model Monitoring & Evaluation
export interface PredictionRecord {
  id: string;
  studentId: string;
  studentName: string;
  studytime: number;
  failures: number;
  absences: number;
  G1: number;
  school: string;
  sex: string;
  age: number;
  internet: string;
  higher: string;
  goout: number;
  health: number;
  predictedScore: number;
  modelVersion: string;
  modelName: string;
  createdAt: string;
  actualScore?: number;
  absoluteError?: number;
  evaluatedAt?: string;
  evaluatedBy?: string;
}

export const aiPredictionsStore: PredictionRecord[] = [
  {
    id: 'PRED-2026-001',
    studentId: 'STU-2026-001',
    studentName: 'Nguyễn Minh Anh',
    studytime: 3,
    failures: 0,
    absences: 2,
    G1: 15,
    school: 'GP',
    sex: 'F',
    age: 15,
    internet: 'yes',
    higher: 'yes',
    goout: 2,
    health: 4,
    predictedScore: 15.2,
    actualScore: 16.0,
    absoluteError: 0.8,
    evaluatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    evaluatedBy: 'TEA-101',
    modelVersion: '1.0.0',
    modelName: 'Random Forest Regressor',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  },
  {
    id: 'PRED-2026-002',
    studentId: 'STU-2026-002',
    studentName: 'Trần Hoàng Nam',
    studytime: 1,
    failures: 2,
    absences: 12,
    G1: 8,
    school: 'MS',
    sex: 'M',
    age: 16,
    internet: 'no',
    higher: 'no',
    goout: 4,
    health: 3,
    predictedScore: 7.4,
    actualScore: 8.0,
    absoluteError: 0.6,
    evaluatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    evaluatedBy: 'TEA-102',
    modelVersion: '1.0.0',
    modelName: 'Random Forest Regressor',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'PRED-2026-003',
    studentId: 'STU-2026-003',
    studentName: 'Lê Thu Trang',
    studytime: 4,
    failures: 0,
    absences: 1,
    G1: 17,
    school: 'GP',
    sex: 'F',
    age: 15,
    internet: 'yes',
    higher: 'yes',
    goout: 2,
    health: 5,
    predictedScore: 17.8,
    modelVersion: '1.0.0',
    modelName: 'Random Forest Regressor',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

// Helper RBAC Middleware
const getAuthUser = (req: express.Request) => {
  const roleHeader = (req.headers['x-user-role'] as string) || 'ADMIN';
  const idHeader = (req.headers['x-user-id'] as string) || 'USER-ADMIN';
  return { role: roleHeader.toUpperCase(), id: idHeader };
};

// --- REAL MACHINE LEARNING REST APIS ---

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Smart Education Center ML Backend' });
});

// Run Seed Data Database
app.post('/api/seed', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Cơ sở dữ liệu THCS đã được seed thành công vào Firebase Firestore!' });
  } catch (error: any) {
    console.error('[SEED ERROR]', error);
    res.status(500).json({ error: 'Lỗi thực hiện seeding dữ liệu: ' + error.message });
  }
});

// GET AI Model Info & Metrics
app.get('/api/ai/model-info', (req, res) => {
  try {
    const user = getAuthUser(req);
    if (user.role === 'ACCOUNTANT') {
      return res.status(403).json({ error: 'Truy cập bị từ chối: Vai trò Kế toán không có quyền truy cập tính năng AI.' });
    }
    const modelInfo = studentScoreService.getModelInfo();
    res.json(modelInfo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET Model Version Registry & Governance Metadata
app.get('/api/ai/model-registry', (req, res) => {
  try {
    const user = getAuthUser(req);
    if (user.role === 'ACCOUNTANT') {
      return res.status(403).json({ error: 'Truy cập bị từ chối: Vai trò Kế toán không có quyền truy cập.' });
    }
    const modelInfo = studentScoreService.getModelInfo();
    const registry = [
      {
        id: 'student-score-v1.0.0',
        modelName: modelInfo.model_name,
        version: modelInfo.version,
        artifactPath: 'ml/models/student_score_model-1.joblib',
        dataset: modelInfo.dataset,
        features: modelInfo.features,
        metrics: modelInfo.metrics,
        trainedAt: modelInfo.trained_at_utc,
        status: 'Đang sử dụng',
        rollbackSupported: true,
        rollbackTargetVersion: null
      }
    ];
    res.json(registry);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST direct feature prediction (11 UCI Features)
app.post('/api/ai/predict-score', (req, res) => {
  try {
    const user = getAuthUser(req);

    // RBAC: ACCOUNTANT strictly forbidden
    if (user.role === 'ACCOUNTANT') {
      return res.status(403).json({ error: 'Truy cập bị từ chối: Vai trò Kế toán không có quyền truy cập tính năng dự đoán AI.' });
    }

    // Ownership / IDOR Checks
    const targetStudentId = req.body.student_id || req.body.studentId || 'STU-2026-001';
    if (user.role === 'STUDENT' && user.id !== targetStudentId && targetStudentId !== 'STU-2026-001') {
      return res.status(403).json({ error: 'Truy cập bị từ chối: Học sinh chỉ có thể xem/dự đoán điểm cho chính mình.' });
    }

    // Input Validation
    let validatedInput;
    try {
      validatedInput = studentScoreService.validateInput(req.body);
    } catch (valErr: any) {
      return res.status(400).json({ error: valErr.message });
    }

    // Perform Inference
    const prediction = studentScoreService.predict(validatedInput);

    // Save prediction record to history store
    const recordId = `PRED-2026-${(aiPredictionsStore.length + 1).toString().padStart(3, '0')}`;
    const logEntry: PredictionRecord = {
      id: recordId,
      studentId: targetStudentId,
      studentName: req.body.student_name || req.body.studentName || 'Học viên THCS',
      ...validatedInput,
      predictedScore: prediction.predictedScore,
      modelVersion: prediction.modelVersion,
      modelName: prediction.modelName,
      createdAt: prediction.createdAt
    };

    aiPredictionsStore.unshift(logEntry);

    res.json({
      id: recordId,
      studentId: logEntry.studentId,
      studentName: logEntry.studentName,
      predictedScore: prediction.predictedScore,
      modelVersion: prediction.modelVersion,
      modelName: prediction.modelName,
      createdAt: prediction.createdAt,
      inputSummary: prediction.inputSummary
    });
  } catch (error: any) {
    console.error('[API Predict Error]', error);
    res.status(500).json({ error: 'Đã xảy ra lỗi khi thực hiện dự đoán từ mô hình Machine Learning: ' + error.message });
  }
});

// POST Evaluate actual score vs predicted score
app.post('/api/ai/predictions/:id/evaluate', (req, res) => {
  try {
    const user = getAuthUser(req);

    // RBAC: Students, Parents, Accountants cannot evaluate predictions
    if (user.role === 'STUDENT' || user.role === 'PARENT' || user.role === 'ACCOUNTANT') {
      return res.status(403).json({ error: 'Truy cập bị từ chối: Bạn không có quyền nhập/đánh giá điểm thực tế.' });
    }

    const { id } = req.params;
    const { actualScore } = req.body;

    if (actualScore === undefined || actualScore === null || isNaN(Number(actualScore))) {
      return res.status(400).json({ error: 'Điểm thực tế (actualScore) không hợp lệ.' });
    }

    const numActual = Number(actualScore);
    if (numActual < 0 || numActual > 20) {
      return res.status(400).json({ error: 'Điểm thực tế (actualScore) phải nằm trong thang điểm 0 - 20.' });
    }

    const recordIndex = aiPredictionsStore.findIndex(r => r.id === id);
    if (recordIndex === -1) {
      return res.status(404).json({ error: `Không tìm thấy bản ghi dự đoán với ID ${id}.` });
    }

    const record = aiPredictionsStore[recordIndex];
    const absoluteError = Math.round(Math.abs(record.predictedScore - numActual) * 100) / 100;

    record.actualScore = numActual;
    record.absoluteError = absoluteError;
    record.evaluatedAt = new Date().toISOString();
    record.evaluatedBy = user.id;

    res.json({
      success: true,
      message: 'Đã cập nhật điểm thực tế và tính toán sai số tuyệt đối.',
      prediction: record
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET predictions history log
app.get('/api/ai/predictions-history', (req, res) => {
  try {
    const user = getAuthUser(req);
    if (user.role === 'ACCOUNTANT') {
      return res.status(403).json({ error: 'Truy cập bị từ chối: Vai trò Kế toán không có quyền xem lịch sử AI.' });
    }

    let results = aiPredictionsStore;
    if (user.role === 'STUDENT') {
      results = aiPredictionsStore.filter(r => r.studentId === user.id);
    }

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET Real-time Model Monitoring Metrics
app.get('/api/ai/monitoring', (req, res) => {
  try {
    const user = getAuthUser(req);
    if (user.role === 'ACCOUNTANT') {
      return res.status(403).json({ error: 'Truy cập bị từ chối: Vai trò Kế toán không có quyền truy cập.' });
    }

    const totalPredictions = aiPredictionsStore.length;
    const evaluatedRecords = aiPredictionsStore.filter(r => r.actualScore !== undefined && r.absoluteError !== undefined);
    const evaluatedPredictions = evaluatedRecords.length;

    let realMAE: number | null = null;
    let medianError: number | null = null;
    let avgPredictedScore: number | null = null;
    let avgActualScore: number | null = null;

    if (totalPredictions > 0) {
      const sumPredicted = aiPredictionsStore.reduce((acc, r) => acc + r.predictedScore, 0);
      avgPredictedScore = Math.round((sumPredicted / totalPredictions) * 10) / 10;
    }

    if (evaluatedPredictions > 0) {
      const sumError = evaluatedRecords.reduce((acc, r) => acc + (r.absoluteError || 0), 0);
      realMAE = Math.round((sumError / evaluatedPredictions) * 100) / 100;

      const sumActual = evaluatedRecords.reduce((acc, r) => acc + (r.actualScore || 0), 0);
      avgActualScore = Math.round((sumActual / evaluatedPredictions) * 10) / 10;

      const sortedErrors = evaluatedRecords.map(r => r.absoluteError || 0).sort((a, b) => a - b);
      const mid = Math.floor(sortedErrors.length / 2);
      medianError = sortedErrors.length % 2 !== 0
        ? sortedErrors[mid]
        : Math.round(((sortedErrors[mid - 1] + sortedErrors[mid]) / 2) * 100) / 100;
    }

    const modelInfo = studentScoreService.getModelInfo();

    res.json({
      totalPredictions,
      evaluatedPredictions,
      realMAE,
      medianError,
      avgPredictedScore,
      avgActualScore,
      modelVersion: modelInfo.version,
      modelName: modelInfo.model_name,
      trainingMetrics: modelInfo.metrics,
      evaluatedRecords
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Smart Education Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

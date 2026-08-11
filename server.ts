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

// In-memory predictions history log store (simulating ai_predictions table)
const aiPredictionsStore: Array<{
  id: string;
  student_id?: string;
  student_name?: string;
  hours_study: number;
  attendance: number;
  homework_completion: number;
  midterm_score: number;
  predicted_final_score: number;
  risk_level: string;
  model_version: string;
  created_at: string;
}> = [
  {
    id: 'PRED-101',
    student_id: 'STU-2026-001',
    student_name: 'Nguyễn Minh Anh',
    hours_study: 8,
    attendance: 92,
    homework_completion: 95,
    midterm_score: 8.2,
    predicted_final_score: 8.7,
    risk_level: 'Thấp',
    model_version: '1.0.0',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'PRED-102',
    student_id: 'STU-2026-002',
    student_name: 'Trần Hoàng Nam',
    hours_study: 4,
    attendance: 78,
    homework_completion: 65,
    midterm_score: 5.5,
    predicted_final_score: 5.8,
    risk_level: 'Cao',
    model_version: '1.0.0',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

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
  const modelInfo = studentScoreService.getModelInfo();
  res.json(modelInfo);
});

// POST direct feature prediction
app.post('/api/ai/predict-score', (req, res) => {
  try {
    const { hours_study, attendance, homework_completion, midterm_score, student_id, student_name } = req.body;
    
    if (
      hours_study === undefined || 
      attendance === undefined || 
      homework_completion === undefined || 
      midterm_score === undefined
    ) {
      return res.status(400).json({ error: 'Dữ liệu đầu vào không hợp lệ. Vui lòng cung cấp đủ thông tin.' });
    }

    const prediction = studentScoreService.predict({
      hours_study: Number(hours_study),
      attendance: Number(attendance),
      homework_completion: Number(homework_completion),
      midterm_score: Number(midterm_score)
    });

    // Save prediction record to history log
    const logEntry = {
      id: `PRED-${Date.now().toString().slice(-5)}`,
      student_id: student_id || 'GUEST',
      student_name: student_name || 'Học viên xem trước',
      hours_study: Number(hours_study),
      attendance: Number(attendance),
      homework_completion: Number(homework_completion),
      midterm_score: Number(midterm_score),
      predicted_final_score: prediction.predicted_final_score,
      risk_level: prediction.risk_level,
      model_version: prediction.model_version,
      created_at: prediction.created_at
    };

    aiPredictionsStore.unshift(logEntry);

    res.json(prediction);
  } catch (error: any) {
    res.status(500).json({ error: 'Đã xảy ra lỗi khi thực hiện dự đoán từ mô hình Machine Learning.' });
  }
});

// POST predict student score by ID (Fetches student parameters from DB)
app.post('/api/students/:id/ai/predict-score', async (req, res) => {
  try {
    const studentId = req.params.id;
    const studentDocRef = doc(db, 'students', studentId);
    const studentSnap = await getDoc(studentDocRef);
    const student = studentSnap.exists() ? studentSnap.data() : null;

    // Derive or fetch student performance indicators
    const hours_study = req.body.hours_study !== undefined ? Number(req.body.hours_study) : 7.5;
    const attendance = student ? student.attendanceRate : 85;
    const homework_completion = student ? Math.min(student.attendanceRate + 4, 98) : 88;
    const midterm_score = student ? student.gpa : 7.0;

    const prediction = studentScoreService.predict({
      hours_study,
      attendance,
      homework_completion,
      midterm_score
    });

    // Save record to ai_predictions audit table
    const logEntry = {
      id: `PRED-${Date.now().toString().slice(-5)}`,
      student_id: studentId,
      student_name: student ? student.name : 'Học viên',
      hours_study,
      attendance,
      homework_completion,
      midterm_score,
      predicted_final_score: prediction.predicted_final_score,
      risk_level: prediction.risk_level,
      model_version: prediction.model_version,
      created_at: prediction.created_at
    };

    aiPredictionsStore.unshift(logEntry);

    res.json({
      student_id: studentId,
      student_name: student ? student.name : 'Học viên',
      ...prediction
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Lỗi truy xuất dữ liệu học viên để dự đoán ML từ Firestore.' });
  }
});

// GET predictions history log
app.get('/api/ai/predictions-history', (req, res) => {
  res.json(aiPredictionsStore);
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

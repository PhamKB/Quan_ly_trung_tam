import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export interface UciStudentInputFeatures {
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
}

export interface PredictionResult {
  predictedScore: number;
  modelVersion: string;
  modelName: string;
  createdAt: string;
  inputSummary: UciStudentInputFeatures;
}

export interface ModelMetadataInfo {
  model_name: string;
  version: string;
  target: string;
  features: string[];
  dataset: string;
  training_samples: number;
  test_samples: number;
  metrics: {
    MAE: number;
    RMSE: number;
    R2: number;
  };
  trained_at_utc: string;
  feature_note: string;
  status: string;
}

class StudentScoreService {
  private metadataPath: string;

  constructor() {
    this.metadataPath = path.resolve(process.cwd(), 'ml/models/model_metadata.json');
  }

  public getModelInfo(): ModelMetadataInfo {
    if (!fs.existsSync(this.metadataPath)) {
      throw new Error(`Model metadata file not found at ${this.metadataPath}`);
    }
    const raw = fs.readFileSync(this.metadataPath, 'utf-8');
    const meta = JSON.parse(raw);
    return {
      ...meta,
      status: 'Đang hoạt động'
    };
  }

  public validateInput(input: any): UciStudentInputFeatures {
    if (!input || typeof input !== 'object') {
      throw new Error('Dữ liệu đầu vào phải là một đối tượng JSON hợp lệ.');
    }

    const requiredKeys: (keyof UciStudentInputFeatures)[] = [
      'studytime', 'failures', 'absences', 'G1',
      'school', 'sex', 'age', 'internet', 'higher', 'goout', 'health'
    ];

    for (const key of requiredKeys) {
      if (input[key] === undefined || input[key] === null) {
        throw new Error(`Thiếu thuộc tính bắt buộc '${key}' trong dữ liệu đầu vào.`);
      }
    }

    const studytime = Number(input.studytime);
    const failures = Number(input.failures);
    const absences = Number(input.absences);
    const G1 = Number(input.G1);
    const school = String(input.school).trim();
    const sex = String(input.sex).trim();
    const age = Number(input.age);
    const internet = String(input.internet).trim();
    const higher = String(input.higher).trim();
    const goout = Number(input.goout);
    const health = Number(input.health);

    if (isNaN(studytime) || studytime < 1 || studytime > 4) {
      throw new Error("Mức thời gian tự học 'studytime' phải là số nguyên từ 1 đến 4.");
    }
    if (isNaN(failures) || failures < 0 || failures > 4) {
      throw new Error("Số lần không đạt 'failures' phải là số từ 0 đến 4.");
    }
    if (isNaN(absences) || absences < 0 || absences > 100) {
      throw new Error("Số buổi vắng 'absences' phải là số từ 0 đến 100.");
    }
    if (isNaN(G1) || G1 < 0 || G1 > 20) {
      throw new Error("Điểm G1 'G1' phải là số trong thang điểm từ 0 đến 20.");
    }
    if (school !== 'GP' && school !== 'MS') {
      throw new Error("Mã trường học 'school' chỉ nhận giá trị 'GP' hoặc 'MS'.");
    }
    if (sex !== 'F' && sex !== 'M') {
      throw new Error("Giới tính 'sex' chỉ nhận giá trị 'F' hoặc 'M'.");
    }
    if (isNaN(age) || age < 10 || age > 30) {
      throw new Error("Tuổi học sinh 'age' phải là số từ 10 đến 30.");
    }
    if (internet !== 'yes' && internet !== 'no') {
      throw new Error("Chỉ số 'internet' chỉ nhận giá trị 'yes' hoặc 'no'.");
    }
    if (higher !== 'yes' && higher !== 'no') {
      throw new Error("Chỉ số 'higher' chỉ nhận giá trị 'yes' hoặc 'no'.");
    }
    if (isNaN(goout) || goout < 1 || goout > 5) {
      throw new Error("Mức độ đi chơi 'goout' phải là số từ 1 đến 5.");
    }
    if (isNaN(health) || health < 1 || health > 5) {
      throw new Error("Chỉ số sức khỏe 'health' phải là số từ 1 đến 5.");
    }

    return {
      studytime,
      failures,
      absences,
      G1,
      school,
      sex,
      age,
      internet,
      higher,
      goout,
      health
    };
  }

  public predict(input: any): PredictionResult {
    const validatedInput = this.validateInput(input);
    const scriptPath = path.resolve(process.cwd(), 'ml/src/predict.py');
    const jsonArg = JSON.stringify(validatedInput);

    try {
      const command = `python3 "${scriptPath}" '${jsonArg}'`;
      const stdout = execSync(command, { encoding: 'utf-8', timeout: 10000 });
      const parsed = JSON.parse(stdout.trim());

      if (!parsed.success) {
        throw new Error(parsed.error || 'Thực thi mô hình Python thất bại.');
      }

      return {
        predictedScore: parsed.predictedScore,
        modelVersion: parsed.modelVersion || '1.0.0',
        modelName: parsed.modelName || 'Random Forest Regressor',
        createdAt: new Date().toISOString(),
        inputSummary: validatedInput
      };
    } catch (error: any) {
      console.error('[StudentScoreService] Inference Error:', error);
      throw new Error(`Lỗi suy luận từ mô hình ML Python: ${error.message}`);
    }
  }
}

export const studentScoreService = new StudentScoreService();

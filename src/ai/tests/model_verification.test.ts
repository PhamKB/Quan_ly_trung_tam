import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { studentScoreService, UciStudentInputFeatures } from '../service/student_score_service';

describe('Checkpoint 3.5 — ML Verification, Monitoring & Governance Tests', () => {
  const artifactPath = path.resolve(process.cwd(), 'ml/models/student_score_model-1.joblib');
  const metadataPath = path.resolve(process.cwd(), 'ml/models/model_metadata.json');

  const validSample: UciStudentInputFeatures = {
    studytime: 3,
    failures: 0,
    absences: 2,
    G1: 14,
    school: 'GP',
    sex: 'F',
    age: 15,
    internet: 'yes',
    higher: 'yes',
    goout: 3,
    health: 4
  };

  it('1. Model Artifact Exists', () => {
    expect(fs.existsSync(artifactPath)).toBe(true);
  });

  it('2. Model Metadata Exists and Matches Version', () => {
    expect(fs.existsSync(metadataPath)).toBe(true);
    const info = studentScoreService.getModelInfo();
    expect(info.version).toBe('v1.0.0');
    expect(info.model_name).toBe('Random Forest');
  });

  it('3. Feature Schema Exactly Matches 11 UCI Features', () => {
    const info = studentScoreService.getModelInfo();
    expect(info.features).toHaveLength(11);
    const expected = [
      'studytime', 'failures', 'absences', 'G1',
      'school', 'sex', 'age', 'internet', 'higher', 'goout', 'health'
    ];
    expect(info.features.sort()).toEqual(expected.sort());
  });

  it('4. Prediction Runs and Returns Bounded Finite Number in [0, 20]', () => {
    const res = studentScoreService.predict(validSample);
    expect(res.predictedScore).toBeTypeOf('number');
    expect(Number.isFinite(res.predictedScore)).toBe(true);
    expect(res.predictedScore).toBeGreaterThanOrEqual(0.0);
    expect(res.predictedScore).toBeLessThanOrEqual(20.0);
  });

  it('5. Prediction Repeatability — Same Input Produces Identical Score', () => {
    const run1 = studentScoreService.predict(validSample);
    const run2 = studentScoreService.predict(validSample);
    const run3 = studentScoreService.predict(validSample);
    expect(run1.predictedScore).toEqual(run2.predictedScore);
    expect(run2.predictedScore).toEqual(run3.predictedScore);
  }, 20000);

  it('6. Invalid Input Handling — Missing Feature Throws Error', () => {
    const missingG1 = { ...validSample } as any;
    delete missingG1.G1;
    expect(() => studentScoreService.validateInput(missingG1)).toThrow(/Thiếu thuộc tính/);
  });

  it('7. Invalid Input Handling — Out of Range Value Throws Error', () => {
    const invalidAge = { ...validSample, age: 50 };
    expect(() => studentScoreService.validateInput(invalidAge)).toThrow(/Tuổi học sinh/);
  });

  it('8. Invalid Input Handling — Invalid Categorical Value Throws Error', () => {
    const invalidSchool = { ...validSample, school: 'UNKNOWN' };
    expect(() => studentScoreService.validateInput(invalidSchool)).toThrow(/Mã trường học/);
  });

  it('9. Prediction Tracking & Absolute Error Calculation', () => {
    const prediction = studentScoreService.predict(validSample);
    const actualScore = 16.0;
    const absoluteError = Math.round(Math.abs(prediction.predictedScore - actualScore) * 100) / 100;
    expect(absoluteError).toBeGreaterThanOrEqual(0);
    expect(absoluteError).toBeLessThanOrEqual(20.0);
  });
});

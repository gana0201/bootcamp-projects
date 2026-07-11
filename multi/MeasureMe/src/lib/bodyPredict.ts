/**
 * 신체 치수 예측 모듈
 * 출처: 02_Body_Prediction_Model.ipynb
 *
 * body_dataset.csv 기반 GradientBoosting 모델을 선형 회귀로 근사한 공식.
 * 모든 예측값 단위: cm
 *
 * 모델 성능 (R²):
 *   chest 0.976 | waist 0.972 | hip 0.971
 *   shoulder_width 0.983 | arm_length 0.975 | leg_length 0.980
 *
 * 공식:
 *   chest_cm          ≈  0.4961 × height + 0.5965 × weight - 4.7571 × gender(M=1) + 0.0010 × BMI - 8.2213
 *   waist_cm          ≈  0.2449 × height + 0.7413 × weight - 10.3060 × gender(M=1) + 0.0010 × BMI - 5.0591
 *   hip_cm            ≈  0.2977 × height + 0.4085 × weight +  2.8499 × gender(M=1) + 0.0010 × BMI + 2.6897
 *   shoulder_width_cm ≈  0.1558 × height + 0.0778 × weight +  3.3513 × gender(M=1) + 0.0010 × BMI + 8.4374
 *   arm_length_cm     ≈  0.2785 × height + 0.0306 × weight -  1.1048 × gender(M=1) + 0.0010 × BMI + 5.0091
 *   leg_length_cm     ≈  0.4801 × height + 0.0441 × weight +  5.7133 × gender(M=1) + 0.0010 × BMI + 14.0684
 */

export interface PredictedMeasurements {
  /** 가슴둘레 (cm) */
  chest: number;
  /** 허리둘레 (cm) */
  waist: number;
  /** 엉덩이둘레 (cm) */
  hip: number;
  /** 어깨너비 (cm) */
  shoulderWidth: number;
  /** 팔길이 (cm) */
  armLength: number;
  /** 다리길이 (cm) */
  legLength: number;
}

/**
 * 키/몸무게/성별로 주요 신체 치수를 예측합니다.
 *
 * @param heightCm  키 (cm)
 * @param weightKg  몸무게 (kg)
 * @param gender    성별 — "M" 또는 "F"
 * @returns 각 부위 예측치 (cm, 소수점 1자리 반올림)
 */
export function predictBodyMeasurements(
  heightCm: number,
  weightKg: number,
  gender: "M" | "F"
): PredictedMeasurements {
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  const g = gender === "M" ? 1 : 0;

  const round1 = (v: number) => Math.round(v * 10) / 10;

  return {
    chest:         round1(0.4961 * heightCm + 0.5965 * weightKg - 4.7571 * g + 0.0010 * bmi -  8.2213),
    waist:         round1(0.2449 * heightCm + 0.7413 * weightKg - 10.3060 * g + 0.0010 * bmi -  5.0591),
    hip:           round1(0.2977 * heightCm + 0.4085 * weightKg +  2.8499 * g + 0.0010 * bmi +  2.6897),
    shoulderWidth: round1(0.1558 * heightCm + 0.0778 * weightKg +  3.3513 * g + 0.0010 * bmi +  8.4374),
    armLength:     round1(0.2785 * heightCm + 0.0306 * weightKg -  1.1048 * g + 0.0010 * bmi +  5.0091),
    legLength:     round1(0.4801 * heightCm + 0.0441 * weightKg +  5.7133 * g + 0.0010 * bmi + 14.0684),
  };
}

/**
 * AI 프롬프트에 삽입할 수 있는 형태로 예측 치수를 포맷합니다.
 * bodyPredict 결과를 AI가 "사실"로 받아들이도록
 * 추정이 아닌 "모델 예측값"임을 명시합니다.
 */
export function formatPredictedMeasurementsForPrompt(
  measurements: PredictedMeasurements,
  heightCm: number,
  weightKg: number,
  gender: "M" | "F"
): string {
  const bmi = weightKg / Math.pow(heightCm / 100, 2);

  return `
## 신체 치수 모델 예측값 (body_dataset.csv 기반 GradientBoosting 회귀, R²>0.97)
입력: 키 ${heightCm}cm / 몸무게 ${weightKg}kg / 성별 ${gender === "M" ? "남성" : "여성"} / BMI ${bmi.toFixed(1)}

| 부위         | 예측값(cm) |
|-------------|-----------|
| 가슴둘레     | ${measurements.chest} |
| 허리둘레     | ${measurements.waist} |
| 엉덩이둘레   | ${measurements.hip}   |
| 어깨너비     | ${measurements.shoulderWidth} |
| 팔길이       | ${measurements.armLength}     |
| 다리길이     | ${measurements.legLength}     |

※ 이 수치는 통계 모델이 계산한 예측값입니다.
  사진에서 관찰되는 체형 특성(비율, 실루엣)으로 보정하여 최종 추정치를 도출하세요.
  특히 근육질이거나 체지방 분포가 특이한 경우 사진 관찰을 우선합니다.`.trim();
}

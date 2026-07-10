/**
 * 성별/연령대별 평균 신체 치수 데이터
 * 출처: average_body.csv (한국인 평균 체형 데이터)
 * 단위: mm (원본 CSV 기준), 변환 시 cm로 제공
 */

export interface BodyAverages {
  gender: "M" | "F";
  ageGroup: string;
  height: number; // cm
  weight: number; // kg
  neck: number; // mm
  chest: number; // mm
  waist: number; // mm
  hip: number; // mm
  shoulderLength: number; // mm
  backLength: number; // mm
  armLength: number; // mm
  legLength: number; // mm
  shoulderWidth: number; // mm
  torsoLength: number; // mm
  bmi: number;
}

// average_body.csv 데이터를 기반으로 정리한 한국인 평균 신체 치수
const AVERAGE_BODY_DATA: BodyAverages[] = [
  {
    gender: "F", ageGroup: "20대",
    height: 161.3, weight: 55.8,
    neck: 317, chest: 868, waist: 725, hip: 935,
    shoulderLength: 132, backLength: 392, armLength: 537,
    legLength: 998, shoulderWidth: 352, torsoLength: 631,
    bmi: 21.4,
  },
  {
    gender: "F", ageGroup: "30대",
    height: 161.9, weight: 57.2,
    neck: 319, chest: 873, waist: 746, hip: 942,
    shoulderLength: 134, backLength: 397, armLength: 536,
    legLength: 1002, shoulderWidth: 354, torsoLength: 640,
    bmi: 21.8,
  },
  {
    gender: "F", ageGroup: "40대",
    height: 160.6, weight: 58.9,
    neck: 326, chest: 893, waist: 779, hip: 948,
    shoulderLength: 134, backLength: 400, armLength: 527,
    legLength: 986, shoulderWidth: 355, torsoLength: 644,
    bmi: 22.8,
  },
  {
    gender: "F", ageGroup: "50대",
    height: 157.9, weight: 58.0,
    neck: 328, chest: 899, waist: 800, hip: 936,
    shoulderLength: 133, backLength: 396, armLength: 517,
    legLength: 965, shoulderWidth: 353, torsoLength: 636,
    bmi: 23.3,
  },
  {
    gender: "F", ageGroup: "60대 이상",
    height: 155.5, weight: 57.8,
    neck: 331, chest: 903, waist: 828, hip: 926,
    shoulderLength: 133, backLength: 392, armLength: 514,
    legLength: 950, shoulderWidth: 349, torsoLength: 628,
    bmi: 23.9,
  },
  {
    gender: "M", ageGroup: "20대",
    height: 174.0, weight: 72.1,
    neck: 371, chest: 996, waist: 817, hip: 964,
    shoulderLength: 149, backLength: 434, armLength: 585,
    legLength: 1066, shoulderWidth: 400, torsoLength: 690,
    bmi: 23.8,
  },
  {
    gender: "M", ageGroup: "30대",
    height: 174.5, weight: 76.9,
    neck: 381, chest: 1023, waist: 865, hip: 984,
    shoulderLength: 149, backLength: 438, armLength: 586,
    legLength: 1071, shoulderWidth: 401, torsoLength: 702,
    bmi: 25.2,
  },
  {
    gender: "M", ageGroup: "40대",
    height: 173.0, weight: 75.5,
    neck: 385, chest: 1019, waist: 886, hip: 974,
    shoulderLength: 148, backLength: 442, armLength: 576,
    legLength: 1051, shoulderWidth: 399, torsoLength: 704,
    bmi: 25.2,
  },
  {
    gender: "M", ageGroup: "50대",
    height: 170.3, weight: 72.6,
    neck: 387, chest: 1003, waist: 891, hip: 959,
    shoulderLength: 147, backLength: 442, armLength: 566,
    legLength: 1027, shoulderWidth: 394, torsoLength: 697,
    bmi: 25.0,
  },
  {
    gender: "M", ageGroup: "60대 이상",
    height: 168.3, weight: 69.9,
    neck: 384, chest: 985, waist: 890, hip: 940,
    shoulderLength: 144, backLength: 436, armLength: 563,
    legLength: 1018, shoulderWidth: 388, torsoLength: 691,
    bmi: 24.6,
  },
];

/**
 * 나이로부터 연령대 그룹을 결정
 */
function getAgeGroup(age: number): string {
  if (age < 30) return "20대";
  if (age < 40) return "30대";
  if (age < 50) return "40대";
  if (age < 60) return "50대";
  return "60대 이상";
}

/**
 * 성별과 나이에 맞는 평균 신체 데이터 조회
 */
export function getAverageBody(gender: "M" | "F", age?: number): BodyAverages {
  const ageGroup = age ? getAgeGroup(age) : "30대"; // 나이 미제공 시 30대 기본값
  const found = AVERAGE_BODY_DATA.find(
    (d) => d.gender === gender && d.ageGroup === ageGroup
  );
  // 못 찾으면 같은 성별의 30대 데이터 반환
  return found || AVERAGE_BODY_DATA.find((d) => d.gender === gender && d.ageGroup === "30대")!;
}

/**
 * AI 프롬프트에 삽입할 수 있는 형태로 평균 데이터 포맷팅
 */
export function formatAverageBodyForPrompt(gender: "M" | "F", age?: number): string {
  const data = getAverageBody(gender, age);
  return `
## 한국인 평균 신체 치수 참고 (${data.gender === "M" ? "남성" : "여성"} ${data.ageGroup})
- 평균 키: ${data.height}cm
- 평균 몸무게: ${data.weight}kg
- 평균 BMI: ${data.bmi}
- 목둘레: ${(data.neck / 10).toFixed(1)}cm
- 가슴둘레: ${(data.chest / 10).toFixed(1)}cm
- 허리둘레: ${(data.waist / 10).toFixed(1)}cm
- 엉덩이둘레: ${(data.hip / 10).toFixed(1)}cm
- 어깨 너비: ${(data.shoulderWidth / 10).toFixed(1)}cm
- 팔 길이: ${(data.armLength / 10).toFixed(1)}cm
- 다리 길이: ${(data.legLength / 10).toFixed(1)}cm
- 등 길이: ${(data.backLength / 10).toFixed(1)}cm
- 어깨 길이: ${(data.shoulderLength / 10).toFixed(1)}cm

※ 사용자의 실제 측정값이 평균 대비 얼마나 차이 나는지를 참고하여 체형을 더 정확히 판단하세요.
예: 허리둘레가 평균보다 10cm 이상 클 경우 마름모꼴/둥근체형 가능성 높음.
예: 어깨너비가 평균보다 5cm 이상 넓으면 역삼각형 가능성 높음.`.trim();
}

/**
 * 전체 성별별 평균 데이터 요약 (프롬프트 내 정적 참조용)
 */
export function getAllAveragesForPrompt(): string {
  let result = `\n## 한국인 성별/연령대별 평균 신체 치수 요약 (단위: cm)\n\n`;
  result += `| 성별 | 연령대 | 키 | 몸무게 | 가슴둘레 | 허리둘레 | 엉덩이둘레 | 어깨너비 | BMI |\n`;
  result += `|------|--------|-----|--------|----------|----------|------------|----------|-----|\n`;

  for (const d of AVERAGE_BODY_DATA) {
    result += `| ${d.gender === "M" ? "남" : "여"} | ${d.ageGroup} | ${d.height} | ${d.weight} | ${(d.chest / 10).toFixed(1)} | ${(d.waist / 10).toFixed(1)} | ${(d.hip / 10).toFixed(1)} | ${(d.shoulderWidth / 10).toFixed(1)} | ${d.bmi} |\n`;
  }

  result += `\n이 데이터를 활용하여 사용자의 신체 치수를 추정할 때 같은 성별/연령대의 평균과 비교하세요.\n`;
  return result;
}

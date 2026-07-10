export interface BodyAnalysis {
  bodyType: string;
  shoulderWidth: "narrow" | "normal" | "wide";
  proportions: string;
  silhouette: string;
  estimatedMeasurements: {
    shoulderWidth: string;
    chestCircumference: string;
    waistCircumference: string;
    hipCircumference: string;
  };
}

export interface GarmentInput {
  name: string;
  category: "top" | "bottom" | "outer" | "dress";
  measurements: Record<string, number>;
  selectedSize?: string;  // 선택한 사이즈 (XS~3XL)
  gender?: string;        // 사이즈 치수표 참조용 성별
}

export interface FitReport {
  fitAnalysis: string;
  sizeRecommendation: string;
  fitScore: number;
  details: {
    shoulder: string;
    chest: string;
    waist: string;
    length: string;
    [key: string]: string;
  };
  styling: string[];
  cautions: string[];
}

export interface AnalysisResult {
  id: string;
  bodyAnalysis: BodyAnalysis;
  garmentData: GarmentInput;
  report: FitReport;
  imageUrl: string;
  createdAt: string;
}

export interface UserProfile {
  height: number;
  weight: number;
  gender: 'male' | 'female' | 'unisex';
  bodyShape: 'slim' | 'standard' | 'muscular' | 'curvy' | 'athletic';
  customPhotoUrl: string | null;
  selectedPresetModelId: string;
}

export interface PresetModel {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'unisex';
  bodyShape: 'slim' | 'standard' | 'muscular' | 'curvy' | 'athletic';
  height: number;
  weight: number;
  imageUrl: string;
  description: string;
}

export interface ClothingItem {
  id: string;
  name: string;
  category: 'top' | 'bottom' | 'outer' | 'fullbody';
  imageUrl: string;
  isCustom: boolean;
  originalFileName?: string;
  length?: number;        // 총장 (Length)
  shoulder?: number;      // 어깨너비 (Shoulder Width)
  chest?: number;         // 가슴단면 (Chest Width)
}

export interface PlacementConfig {
  x: number;      // percent offset (0-100)
  y: number;      // percent offset (0-100)
  scaleX: number; // width multiplier
  scaleY: number; // height multiplier
  rotation: number; // degrees (-180 to 180)
  opacity: number;  // 0 to 1
}

export interface AiFittingResponse {
  sizeRecommendation: string;
  fitScore: number;
  analysisText: string;
  tightnessLevel: 'tight' | 'perfect' | 'loose' | 'oversized';
  coordinates: {
    x: number;     // suggested x percentage
    y: number;     // suggested y percentage
    scaleX: number; // suggested width scale
    scaleY: number; // suggested height scale
  };
}

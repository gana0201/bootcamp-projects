import { PresetModel, ClothingItem } from "./types";

export const PRESET_MODELS: PresetModel[] = [
  {
    id: "model_male_standard",
    name: "지후 (남성 - 표준 체형)",
    gender: "male",
    bodyShape: "standard",
    height: 178,
    weight: 72,
    imageUrl: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&auto=format&fit=crop&q=80",
    description: "깔끔한 비즈니스 캐주얼 및 남성복 피팅에 알맞은 표준 수트 핏 모델"
  },
  {
    id: "model_female_standard",
    name: "소희 (여성 - 표준 체형)",
    gender: "female",
    bodyShape: "standard",
    height: 165,
    weight: 50,
    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
    description: "다양한 캐주얼, 원피스, 드레스 등 모든 여성 의류 피팅에 잘 어울리는 모델"
  },
  {
    id: "model_male_athletic",
    name: "민우 (남성 - 애슬레틱)",
    gender: "male",
    bodyShape: "athletic",
    height: 183,
    weight: 80,
    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80",
    description: "어깨와 가슴이 발달하여 스포티한 의류나 타이트한 상의 피팅에 적합한 모델"
  },
  {
    id: "model_female_slim",
    name: "유진 (여성 - 슬림 체형)",
    gender: "female",
    bodyShape: "slim",
    height: 168,
    weight: 47,
    imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop&q=80",
    description: "키가 크고 슬림하여 트렌치 코트, 와이드 팬츠 등 스타일리시한 의상에 어울리는 모델"
  }
];

export const PRESET_CLOTHES: ClothingItem[] = [
  {
    id: "clothes_white_tshirt",
    name: "클래식 무지 흰색 반팔 티셔츠",
    category: "top",
    imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
    isCustom: false,
    length: 70,
    shoulder: 48,
    chest: 52
  },
  {
    id: "clothes_black_hoodie",
    name: "오버핏 스트릿 블랙 후드티",
    category: "top",
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80",
    isCustom: false,
    length: 74,
    shoulder: 54,
    chest: 58
  },
  {
    id: "clothes_denim_jacket",
    name: "빈티지 워싱 데님 자켓",
    category: "outer",
    imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80",
    isCustom: false,
    length: 65,
    shoulder: 50,
    chest: 55
  },
  {
    id: "clothes_trench_coat",
    name: "클래식 더블 버튼 트렌치 코트",
    category: "outer",
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80",
    isCustom: false,
    length: 110,
    shoulder: 46,
    chest: 54
  },
  {
    id: "clothes_blue_jeans",
    name: "내추럴 스트레이트 데님 진 팬츠",
    category: "bottom",
    imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80",
    isCustom: false,
    length: 101,
    shoulder: 0,
    chest: 38
  },
  {
    id: "clothes_black_slacks",
    name: "시크 세미와이드 블랙 슬랙스",
    category: "bottom",
    imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&auto=format&fit=crop&q=80",
    isCustom: false,
    length: 102,
    shoulder: 0,
    chest: 40
  },
  {
    id: "clothes_floral_dress",
    name: "릴랙스드 서머 플로럴 미디 원피스",
    category: "fullbody",
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
    isCustom: false,
    length: 115,
    shoulder: 39,
    chest: 47
  }
];

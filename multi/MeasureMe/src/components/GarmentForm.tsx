"use client";

import { useState, useCallback } from "react";
import { Shirt, Upload, Sliders, Info, Check, ArrowRight } from "lucide-react";
import type { GarmentInput } from "@/types";
import { getSizeChart, SIZE_LABELS, type SizeLabel, type GenderType } from "@/lib/sizeChart";

interface Props {
  onSubmit: (data: GarmentInput, garmentImageUrl?: string) => void;
  onBack: () => void;
  profileGender?: GenderType;
}

const CATEGORY_MEASUREMENTS: Record<string, string[]> = {
  top:    ["총장", "어깨너비", "가슴단면", "소매길이", "밑단단면"],
  bottom: ["총장", "허리단면", "엉덩이단면", "허벅지단면", "밑위", "밑단단면"],
  outer:  ["총장", "어깨너비", "가슴단면", "소매길이", "밑단단면"],
  dress:  ["총장", "어깨너비", "가슴단면", "허리단면", "밑단단면"],
};
const CATEGORY_LABELS: Record<string, string> = {
  top: "상의", bottom: "하의", outer: "아우터", dress: "원피스",
};

export default function GarmentForm({ onSubmit, onBack, profileGender }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("top");
  const [selectedSize, setSelectedSize] = useState<SizeLabel | "">("");
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [garmentImage, setGarmentImage] = useState<string>("");
  const [garmentImageUrl, setGarmentImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const currentMeasurements = CATEGORY_MEASUREMENTS[category] || [];
  const gender: GenderType = profileGender || "";

  // 선택한 사이즈의 표준 치수 (placeholder 및 fallback용)
  // SIZE_LABELS에 포함된 표준 사이즈일 때만 치수표 조회
  const isStandardSize = selectedSize !== "" && SIZE_LABELS.includes(selectedSize as SizeLabel);
  const sizeChartValues: Record<string, number> = isStandardSize
    ? getSizeChart(category, gender, selectedSize as SizeLabel)
    : {};

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setMeasurements({});
    setSelectedSize("");
  };

  const handleGarmentImage = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { alert("이미지 파일만 업로드 가능합니다"); return; }
    const reader = new FileReader();
    reader.onload = (e) => setGarmentImage(e.target?.result as string);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("업로드 실패");
      const data = await res.json();
      setGarmentImageUrl(data.imageUrl);
    } catch { alert("의류 사진 업로드 실패"); setGarmentImage(""); }
    finally { setUploading(false); }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 실측값 우선, 없으면 선택 사이즈 치수표 값 사용
    const numericMeasurements: Record<string, number> = {};
    for (const key of currentMeasurements) {
      const userVal = parseFloat(measurements[key] || "");
      if (!isNaN(userVal) && userVal > 0) {
        numericMeasurements[key] = userVal;
      } else if (sizeChartValues[key]) {
        numericMeasurements[key] = sizeChartValues[key];
      }
    }

    onSubmit(
      {
        name: name || "미지정 의류",
        category: category as GarmentInput["category"],
        measurements: numericMeasurements,
        selectedSize: selectedSize || undefined,
        gender: gender || undefined,
      },
      garmentImageUrl || undefined
    );
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* 왼쪽: 사진 + 카테고리 */}
      <div className="bg-white rounded-2xl border border-brand-cream shadow-sm p-6 flex flex-col justify-between h-full space-y-6">
        <div className="space-y-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2.5 pb-3 border-b border-brand-cream">
            <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-lg"><Shirt className="w-5 h-5" /></div>
            <div>
              <h2 className="text-base font-bold text-slate-800">2-1. 피팅할 옷 사진 업로드</h2>
              <p className="text-sm text-slate-500">의류 사진을 올리고 카테고리를 선택하세요</p>
            </div>
          </div>

          {/* 의류 이름 */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">의류 이름 (선택)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="예: 오버핏 크루넥 맨투맨"
              className="w-full bg-brand-light border border-brand-cream focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 rounded-xl px-4 py-3 text-base font-bold text-slate-800 outline-none" />
          </div>

          {/* 카테고리 */}
          <div className="space-y-2">
            <span className="text-sm font-bold text-slate-700">카테고리</span>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <button key={key} type="button" onClick={() => handleCategoryChange(key)}
                  className={`py-2 px-4 rounded-full text-sm font-bold transition-all border ${
                    category === key
                      ? "bg-brand-primary border-brand-primary text-white shadow-md"
                      : "bg-brand-light border-brand-cream text-slate-700 hover:border-brand-primary"
                  }`}>{label}</button>
              ))}
            </div>
          </div>

          {/* 의류 사진 업로드 */}
          <div className="flex-1 flex flex-col justify-center">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file?.type.startsWith("image/")) handleGarmentImage(file); }}
              onClick={() => { const input = document.getElementById("garment-photo-input") as HTMLInputElement; input?.click(); }}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center flex-1 min-h-[180px] ${
                garmentImage ? "border-brand-primary bg-brand-primary/5" : "border-brand-cream hover:border-brand-primary hover:bg-brand-light"
              }`}>
              <input type="file" id="garment-photo-input" accept="image/*" className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleGarmentImage(file); }}
                disabled={uploading} />
              {garmentImage ? (
                <div className="flex flex-col items-center w-full space-y-3">
                  <div className="rounded-xl overflow-hidden bg-slate-100 border border-brand-cream p-3 max-w-[180px]">
                    <img src={garmentImage} alt="의류 미리보기" className="max-h-[160px] w-auto object-contain" />
                  </div>
                  {uploading
                    ? <span className="text-sm font-bold text-brand-primary animate-pulse">업로드 중...</span>
                    : garmentImageUrl
                      ? <span className="text-sm font-bold text-brand-primary flex items-center gap-1"><Check className="w-4 h-4 text-brand-secondary" /> 업로드 완료</span>
                      : null}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary"><Upload className="w-7 h-7" /></div>
                  <span className="text-base font-bold text-slate-700">여기를 클릭하여 의류 사진 업로드</span>
                  <span className="text-sm text-slate-400">또는 드래그 앤 드롭</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-3 bg-brand-accent/5 text-slate-700 rounded-xl text-sm border border-brand-accent/20">
          <Info className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
          <span><strong>팁:</strong> 바닥에 반듯하게 펼쳐진 옷 사진이 가장 정밀한 분석 결과를 제공합니다.</span>
        </div>
      </div>

      {/* 오른쪽: 사이즈 선택 + 실측 입력 */}
      <div className="bg-white rounded-2xl border border-brand-cream shadow-sm p-6 flex flex-col justify-between h-full space-y-6">
        <div className="space-y-5 flex flex-col flex-1">
          <div className="flex items-center justify-between pb-3 border-b border-brand-cream">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-lg"><Sliders className="w-5 h-5" /></div>
              <div>
                <h2 className="text-base font-bold text-slate-800">2-2. 사이즈 및 실측 스펙</h2>
                <p className="text-sm text-slate-500">사이즈 선택 또는 직접 입력</p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-2.5 py-1 rounded-full">{CATEGORY_LABELS[category]}</span>
          </div>

          {/* 사이즈 입력 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">사이즈</span>
              {selectedSize && SIZE_LABELS.includes(selectedSize as SizeLabel) && (
                <span className="text-xs text-brand-accent font-bold">
                  {selectedSize} 표준 치수 자동 적용
                  {gender && ` (${gender === "male" ? "남성" : "여성"} 기준)`}
                </span>
              )}
            </div>
            <input
              type="text"
              value={selectedSize}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setSelectedSize(val as SizeLabel | "");
                // XS~3XL 중 하나면 치수표 자동 적용 (비어 있는 항목만)
                if (SIZE_LABELS.includes(val as SizeLabel)) {
                  const chart = getSizeChart(category, gender, val as SizeLabel);
                  setMeasurements((prev) => {
                    const next = { ...prev };
                    for (const key of currentMeasurements) {
                      if (!prev[key] || prev[key] === "") {
                        next[key] = String(chart[key] ?? "");
                      }
                    }
                    return next;
                  });
                }
              }}
              placeholder="예: M, L, XL, Free, 90, 95..."
              className="w-full bg-brand-light border border-brand-cream focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 rounded-xl px-4 py-3 text-base font-bold text-slate-800 outline-none"
            />
            <p className="text-xs text-slate-400">
              XS · S · M · L · XL · XXL · 3XL 입력 시 표준 치수가 아래 항목에 자동으로 채워집니다.
            </p>
          </div>

          {/* 구분선 */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-brand-cream" />
            <span className="text-xs text-slate-400 font-bold">실측값 직접 입력 (선택)</span>
            <div className="flex-1 h-px bg-brand-cream" />
          </div>

          {/* 실측 입력 */}
          <div className="space-y-3 flex-1 overflow-y-auto">
            {currentMeasurements.map((m) => {
              const chartVal = sizeChartValues[m];
              const userVal = measurements[m];
              const isFromChart = selectedSize && !userVal && chartVal;
              const isUserInput = userVal && userVal !== "";

              return (
                <div key={m} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-700">{m}</label>
                    {isFromChart && (
                      <span className="text-xs text-brand-accent font-bold">{selectedSize} 기준: {chartVal}cm</span>
                    )}
                    {isUserInput && (
                      <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> 직접 입력
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={measurements[m] || ""}
                      onChange={(e) => setMeasurements((prev) => ({ ...prev, [m]: e.target.value }))}
                      placeholder={chartVal ? `${selectedSize} 기준: ${chartVal}` : "-"}
                      className={`w-full bg-brand-light border focus:ring-2 focus:ring-brand-primary/10 rounded-xl px-4 py-3 text-base font-bold text-slate-800 outline-none pr-12 transition-colors ${
                        isUserInput
                          ? "border-emerald-300 focus:border-emerald-400"
                          : "border-brand-cream focus:border-brand-primary"
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">cm</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 안내 */}
          <div className="bg-brand-primary/5 border border-brand-primary/15 p-3 rounded-xl text-xs text-slate-600 flex gap-2">
            <Info className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
            <span>
              사이즈만 선택해도 표준 치수로 핏 분석이 가능합니다.
              실측값을 직접 입력하면 더 정확한 결과를 얻을 수 있습니다.
            </span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack}
            className="flex-1 py-3.5 border border-brand-cream text-slate-600 font-extrabold text-sm rounded-xl hover:bg-brand-light active:scale-95 transition-all">
            ← 1단계로
          </button>
          <button type="submit" disabled={uploading}
            className="flex-1 px-6 py-3.5 bg-brand-accent hover:bg-brand-accent/90 text-white font-extrabold text-base rounded-xl shadow-lg shadow-brand-accent/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
            분석 시작 <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </form>
  );
}

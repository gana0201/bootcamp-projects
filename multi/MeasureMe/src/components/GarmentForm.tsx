"use client";

import { useState, useCallback } from "react";
import { Shirt, Upload, Sliders, Info, Check, ArrowRight } from "lucide-react";
import type { GarmentInput } from "@/types";

interface Props {
  onSubmit: (data: GarmentInput, garmentImageUrl?: string) => void;
  onBack: () => void;
}

const CATEGORY_MEASUREMENTS: Record<string, string[]> = {
  top: ["총장", "어깨너비", "가슴단면", "소매길이", "밑단단면"],
  bottom: ["총장", "허리단면", "엉덩이단면", "허벅지단면", "밑위", "밑단단면"],
  outer: ["총장", "어깨너비", "가슴단면", "소매길이", "밑단단면"],
  dress: ["총장", "어깨너비", "가슴단면", "허리단면", "밑단단면"],
};

const CATEGORY_LABELS: Record<string, string> = { top: "상의", bottom: "하의", outer: "아우터", dress: "원피스" };

export default function GarmentForm({ onSubmit, onBack }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("top");
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [garmentImage, setGarmentImage] = useState<string>("");
  const [garmentImageUrl, setGarmentImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const currentMeasurements = CATEGORY_MEASUREMENTS[category] || [];

  const handleCategoryChange = (cat: string) => { setCategory(cat); setMeasurements({}); };

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
    const numericMeasurements: Record<string, number> = {};
    for (const key of currentMeasurements) {
      const val = parseFloat(measurements[key] || "");
      if (!isNaN(val) && val > 0) numericMeasurements[key] = val;
    }
    onSubmit({ name: name || "미지정 의류", category: category as GarmentInput["category"], measurements: numericMeasurements }, garmentImageUrl || undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* Left Card */}
      <div className="bg-white/95 rounded-2xl border border-brand-cream/60 shadow-sm p-6 flex flex-col justify-between h-full space-y-6">
        <div className="space-y-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2.5 pb-3 border-b border-brand-cream/35">
            <div className="p-2.5 bg-brand-secondary/20 text-brand-secondary rounded-lg"><Shirt className="w-5 h-5" /></div>
            <div>
              <h2 className="text-base font-bold text-brand-dark">2-1. 피팅할 옷 사진 업로드</h2>
              <p className="text-sm text-brand-dark/50">의류 사진을 올리고 카테고리를 선택하세요</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-brand-dark/70 block">의류 이름 (선택)</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 오버핏 크루넥 맨투맨"
              className="w-full bg-brand-light/20 hover:bg-brand-light/40 border border-brand-cream/70 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 rounded-xl px-4 py-3 text-base font-bold text-brand-dark transition-all outline-none" />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-bold text-brand-dark/70 block">카테고리</span>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <button key={key} type="button" onClick={() => handleCategoryChange(key)}
                  className={`py-2 px-4 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${
                    category === key ? "bg-brand-primary border-brand-primary text-white shadow-md shadow-brand-primary/20"
                    : "bg-white border-brand-cream/50 text-brand-dark hover:bg-brand-light/40 hover:text-brand-primary"
                  }`}>{label}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file?.type.startsWith("image/")) handleGarmentImage(file); }}
              onClick={() => { const input = document.getElementById("garment-photo-input") as HTMLInputElement; input?.click(); }}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all relative overflow-hidden flex flex-col items-center justify-center flex-1 min-h-[180px] ${
                garmentImage ? "border-brand-primary bg-brand-light/30 hover:border-brand-dark" : "border-brand-cream hover:border-brand-primary hover:bg-brand-light/35"
              }`}
            >
              <input type="file" id="garment-photo-input" accept="image/*" className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleGarmentImage(file); }} disabled={uploading} />
              {garmentImage ? (
                <div className="flex flex-col items-center justify-center w-full space-y-3">
                  <div className="relative rounded-xl overflow-hidden bg-white border border-brand-cream shadow-sm p-3 max-w-[180px] group">
                    <img src={garmentImage} alt="의류 미리보기" className="max-h-[160px] w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]" />
                  </div>
                  <div className="text-center">
                    {uploading ? <span className="text-sm font-bold text-brand-primary animate-pulse">업로드 중...</span>
                    : garmentImageUrl ? <span className="text-sm font-bold text-brand-primary flex items-center justify-center gap-1 bg-brand-light border border-brand-cream/60 px-3 py-1 rounded-full w-fit mx-auto"><Check className="w-4 h-4 text-brand-secondary" /> 업로드 완료</span> : null}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-4">
                  <div className="w-14 h-14 rounded-full bg-brand-secondary/20 flex items-center justify-center text-brand-secondary shadow-inner"><Upload className="w-7 h-7 animate-pulse" /></div>
                  <div>
                    <span className="text-base font-bold text-brand-dark/85 block">여기를 클릭하여 의류 사진 업로드</span>
                    <span className="text-sm text-brand-dark/50 block mt-1">또는 이미지 파일을 이 영역으로 드래그 앤 드롭</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-3 bg-brand-secondary/15 text-brand-dark rounded-xl text-sm leading-relaxed border border-brand-secondary/35">
          <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <span><strong>의류 사진 팁:</strong> 바닥에 반듯하게 펼쳐진 옷 사진이 가장 정밀한 분석 결과를 제공합니다.</span>
        </div>
      </div>

      {/* Right Card */}
      <div className="bg-white/95 rounded-2xl border border-brand-cream/60 shadow-sm p-6 flex flex-col justify-between h-full space-y-6">
        <div className="space-y-6 flex-1 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-brand-cream/35">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-brand-light text-brand-primary rounded-lg border border-brand-cream/30"><Sliders className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-base font-bold text-brand-dark">2-2. 의류 실측 스펙 입력</h2>
                  <p className="text-sm text-brand-dark/50">아는 부분만 입력해도 분석이 가능합니다</p>
                </div>
              </div>
              <span className="text-xs font-extrabold text-brand-primary bg-brand-light border border-brand-cream/60 px-2.5 py-1.5 rounded-full">{CATEGORY_LABELS[category]}</span>
            </div>
            <div className="space-y-3.5">
              {currentMeasurements.map((m) => (
                <div key={m} className="space-y-1.5">
                  <label className="text-sm font-bold text-brand-dark/70 block">{m}</label>
                  <div className="relative rounded-xl shadow-sm">
                    <input type="number" step="0.5" min="0" value={measurements[m] || ""}
                      onChange={(e) => setMeasurements((prev) => ({ ...prev, [m]: e.target.value }))}
                      className="w-full bg-brand-light/20 hover:bg-brand-light/40 border border-brand-cream/70 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 rounded-xl px-4 py-3 text-base font-bold font-mono text-brand-dark transition-all outline-none pr-12"
                      placeholder="-" />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-sm font-extrabold text-brand-dark/45">cm</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-brand-light border border-brand-cream/50 p-4 rounded-xl text-sm leading-relaxed text-brand-dark/85 flex gap-2">
            <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
            <div><strong>의류 측정 권장사항:</strong><br />평평한 곳에 의류를 펼쳐두고 단면 치수를 cm 단위로 기입하세요. 사진만 올려도 AI가 추정 분석합니다.</div>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack} className="flex-1 py-3.5 border border-brand-cream text-brand-dark font-extrabold text-sm rounded-xl hover:bg-brand-light/40 active:scale-95 transition-all">&larr; 1단계로 이동</button>
          <button type="submit" disabled={uploading}
            className="flex-1 px-6 py-3.5 bg-gradient-to-r from-brand-primary to-brand-dark hover:from-brand-dark hover:to-brand-primary text-white font-extrabold text-base rounded-xl shadow-lg shadow-brand-primary/25 active:scale-95 transition-all flex items-center justify-center gap-2 border border-brand-primary/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >분석 시작 <ArrowRight className="w-5 h-5" /></button>
        </div>
      </div>
    </form>
  );
}

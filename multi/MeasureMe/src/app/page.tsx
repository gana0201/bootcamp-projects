"use client";

import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import GarmentForm from "@/components/GarmentForm";
import FitReportView from "@/components/FitReportView";
import { User, Shirt, Sparkles, Info } from "lucide-react";
import type { GarmentInput, AnalysisResult } from "@/types";

interface ProfileData {
  height: string;
  weight: string;
  gender: "male" | "female" | "";
}

type Step = "upload" | "garment" | "analyzing" | "report";

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [garmentImgUrl, setGarmentImgUrl] = useState<string>("");
  const [profileData, setProfileData] = useState<ProfileData>({
    height: "",
    weight: "",
    gender: "",
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string>("");

  const handleUploadComplete = (url: string, profile: ProfileData) => {
    setImageUrl(url);
    setProfileData(profile);
    setStep("garment");
    setError("");
  };

  const handleGarmentSubmit = async (garmentData: GarmentInput, garmentImageUrl?: string) => {
    setStep("analyzing");
    setError("");
    if (garmentImageUrl) setGarmentImgUrl(garmentImageUrl);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          garmentData,
          garmentImageUrl,
          profileData,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "분석 실패");
      }

      const data = await response.json();
      setResult(data.data);
      setStep("report");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
      setStep("garment");
    }
  };

  const handleReset = () => {
    setStep("upload");
    setImageUrl("");
    setGarmentImgUrl("");
    setProfileData({ height: "", weight: "", gender: "" });
    setResult(null);
    setError("");
  };

  const getActiveTabIndex = () => {
    if (step === "upload") return 0;
    if (step === "garment") return 1;
    return 2;
  };

  return (
    <div className="space-y-6">
      {/* Modern Segmented Tabs Controller */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-2xl mx-auto shadow-inner border border-slate-200/50">
        <button
          onClick={() => { if (step !== "analyzing") setStep("upload"); }}
          className={`flex-1 py-3.5 text-sm font-extrabold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
            getActiveTabIndex() === 0
              ? "bg-white text-brand-primary shadow-sm border border-slate-200/20"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <User className="w-4 h-4 text-brand-primary" /> 1. 사진 & 프로필
        </button>
        <button
          onClick={() => { if (imageUrl && step !== "analyzing") setStep("garment"); }}
          className={`flex-1 py-3.5 text-sm font-extrabold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
            getActiveTabIndex() === 1
              ? "bg-white text-brand-primary shadow-sm border border-slate-200/20"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Shirt className="w-4 h-4 text-brand-primary" /> 2. 의류 정보
        </button>
        <button
          onClick={() => { if (result) setStep("report"); }}
          className={`flex-1 py-3.5 text-sm font-extrabold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
            getActiveTabIndex() === 2
              ? "bg-white text-brand-primary shadow-sm border border-slate-200/20"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4 text-brand-accent fill-brand-accent/20" /> 3. 핏 리포트
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-red-700 text-sm flex items-start gap-2">
          <Info className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {step === "upload" && (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
          <div className="bg-gradient-to-r from-brand-light/80 via-brand-light/45 to-brand-cream/35 border border-brand-cream/70 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <Info className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">1단계: 전신 사진 및 신체 프로필 입력</h3>
              <p className="text-sm text-slate-500 leading-relaxed mt-0.5">
                전신 정면 사진을 업로드하고 성별, 키, 몸무게를 입력하세요. 정확한 정보가 더 정밀한 핏 분석을 제공합니다.
              </p>
            </div>
          </div>
          <ImageUpload onComplete={handleUploadComplete} />
        </div>
      )}

      {step === "garment" && (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
          <div className="bg-gradient-to-r from-brand-light/80 via-brand-light/45 to-brand-cream/35 border border-brand-cream/70 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <Info className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">2단계: 피팅할 의류 사진 및 실측 사이즈 입력</h3>
              <p className="text-sm text-slate-500 leading-relaxed mt-0.5">
                피팅해 보고 싶은 의류 사진을 업로드하고, 실측 정보(총장, 어깨, 가슴단면 등)를 입력하면 정밀한 AI 분석이 가능합니다.
              </p>
            </div>
          </div>
          <GarmentForm onSubmit={handleGarmentSubmit} onBack={() => setStep("upload")} />
        </div>
      )}

      {step === "analyzing" && (
        <div className="max-w-5xl mx-auto animate-fade-in">
          <div className="flex flex-col items-center justify-center py-20 space-y-5 bg-white/95 rounded-2xl border border-brand-cream/60 shadow-sm">
            <div className="relative">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-brand-cream border-t-brand-primary" />
              <Sparkles className="w-5 h-5 text-brand-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center space-y-1.5">
              <p className="text-sm font-bold text-slate-700">AI가 체형과 의류를 정밀 분석하고 있습니다...</p>
              <p className="text-[11px] text-slate-400 font-medium">보통 10-20초 소요됩니다</p>
            </div>
          </div>
        </div>
      )}

      {step === "report" && result && (
        <div className="w-full animate-fade-in">
          <FitReportView
            result={result}
            onReset={handleReset}
            humanImageUrl={imageUrl}
            garmentImageUrl={garmentImgUrl}
          />
        </div>
      )}
    </div>
  );
}

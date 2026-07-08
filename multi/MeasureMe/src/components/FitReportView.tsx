"use client";

import { useState } from "react";
import { FileText, CheckCircle2, Sparkles, Sliders, Info, Check, RefreshCw, Wand2 } from "lucide-react";
import type { AnalysisResult } from "@/types";

interface Props {
  result: AnalysisResult;
  onReset: () => void;
  humanImageUrl?: string;
  garmentImageUrl?: string;
}

export default function FitReportView({ result, onReset, humanImageUrl, garmentImageUrl }: Props) {
  const { report, bodyAnalysis, garmentData } = result;
  const [tryOnImage, setTryOnImage] = useState<string>("");
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnError, setTryOnError] = useState("");

  const canTryOn = humanImageUrl && garmentImageUrl;

  const handleTryOn = async () => {
    if (!humanImageUrl || !garmentImageUrl) return;
    setTryOnLoading(true);
    setTryOnError("");
    try {
      const res = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ humanImageUrl, garmentImageUrl }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "가상 피팅 실패"); }
      const data = await res.json();
      setTryOnImage(data.resultImageUrl);
      if (data.mock) setTryOnError("Mock 모드: 현재 전신 사진이 표시됩니다. 유료 API 연동 시 실제 합성 이미지가 생성됩니다.");
    } catch (err) { setTryOnError(err instanceof Error ? err.message : "오류가 발생했습니다"); }
    finally { setTryOnLoading(false); }
  };

  const getScoreLabel = (score: number) => {
    if (score >= 9) return "최상의 케미스트리";
    if (score >= 7) return "우수한 핏 조화";
    if (score >= 5) return "보통의 핏 매칭";
    return "재검토 권장";
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return "text-emerald-600";
    if (score >= 7) return "text-blue-600";
    if (score >= 5) return "text-amber-600";
    return "text-red-500";
  };

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Virtual Try-On + Body Analysis (sticky) */}
        <div>
          <div className="lg:sticky lg:top-24 space-y-5">
            {canTryOn && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
                  <span className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-purple-600" /> 가상 피팅
                  </span>
                  {tryOnImage && (
                    <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" /> 완료
                    </span>
                  )}
                </div>
                {tryOnImage ? (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-2xl">
                      <img src={tryOnImage} alt="가상 피팅 결과" className="w-full h-auto object-contain rounded-lg" />
                      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 font-medium flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" /> AI 합성 결과
                      </div>
                    </div>
                    {tryOnError && <p className="text-xs text-amber-700 font-medium bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">{tryOnError}</p>}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    {tryOnLoading ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <div className="h-14 w-14 animate-spin rounded-full border-4 border-slate-200 border-t-purple-600" />
                          <Sparkles className="w-5 h-5 text-purple-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-base font-bold text-slate-700">가상 피팅 이미지 생성 중...</p>
                        <p className="text-sm text-slate-400">약 20-30초 소요됩니다</p>
                      </div>
                    ) : (
                      <button onClick={handleTryOn}
                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-base rounded-xl shadow-lg shadow-purple-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto">
                        <Wand2 className="w-5 h-5" /> 가상 피팅 이미지 생성
                      </button>
                    )}
                    {tryOnError && !tryOnLoading && <p className="mt-3 text-sm text-amber-600">{tryOnError}</p>}
                  </div>
                )}
              </div>
            )}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-4">
                <Sliders className="w-5 h-5 text-blue-600" />
                <span className="text-base font-extrabold text-slate-800">체형 분석</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InfoItem label="체형 타입" value={bodyAnalysis.bodyType} />
                <InfoItem label="어깨" value={bodyAnalysis.shoulderWidth === "wide" ? "넓음" : bodyAnalysis.shoulderWidth === "narrow" ? "좁음" : "보통"} />
                <InfoItem label="비율" value={bodyAnalysis.proportions} />
                <InfoItem label="실루엣" value={bodyAnalysis.silhouette} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Scrollable Report */}
        <div className="space-y-5 lg:h-[calc(100vh-180px)] lg:overflow-y-auto lg:pr-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <span className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> AI 핏 리포트
              </span>
              <span className="flex items-center gap-1 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" /> 분석 완료
              </span>
            </div>
            <div className="flex items-center gap-5">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex flex-col items-center justify-center text-center min-w-[120px]">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">적합도</span>
                <div className="flex items-baseline">
                  <span className={`text-4xl font-black font-mono ${getScoreColor(report.fitScore)}`}>{report.fitScore}</span>
                  <span className="text-sm text-slate-400 font-bold ml-1">/ 10</span>
                </div>
                <span className={`text-[11px] font-bold mt-2 px-2.5 py-0.5 rounded-full border ${report.fitScore >= 7 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : report.fitScore >= 5 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                  {getScoreLabel(report.fitScore)}
                </span>
              </div>
              <div className="flex-1 space-y-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500 font-bold shrink-0">추천 사이즈</span>
                  <span className="text-lg font-black text-blue-600 bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-lg">{report.sizeRecommendation}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500 font-bold shrink-0">의류</span>
                  <span className="text-sm font-bold text-slate-800">{garmentData.name} · {garmentData.category === "top" ? "상의" : garmentData.category === "bottom" ? "하의" : garmentData.category === "outer" ? "아우터" : "원피스"}</span>
                </div>
                <div className="pt-1">
                  <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-700" style={{ width: `${report.fitScore * 10}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="text-base font-extrabold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-200 mb-4">
              <Sparkles className="w-5 h-5 text-amber-500" /> AI 핏 분석 소견
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-base text-slate-800 leading-relaxed font-medium whitespace-pre-line">{report.fitAnalysis}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-4">
              <Sliders className="w-5 h-5 text-indigo-500" />
              <span className="text-base font-extrabold text-slate-800">부위별 핏 분석</span>
            </div>
            <div className="divide-y divide-slate-100">
              {Object.entries(report.details).map(([key, value]) => (
                <div key={key} className="py-3.5 flex items-start gap-3">
                  <span className="text-xs font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md uppercase shrink-0 mt-0.5">{key}</span>
                  <p className="text-base text-slate-700 font-medium leading-relaxed">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {report.styling.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="text-base font-extrabold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-200 mb-4">
                <Check className="w-5 h-5 text-emerald-500" /> 스타일링 팁
              </div>
              <div className="space-y-3">
                {report.styling.map((tip, i) => (
                  <div key={i} className="flex gap-3 text-base text-slate-700 font-medium bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                    <div className="p-1 bg-emerald-100 text-emerald-600 rounded-lg shrink-0 h-fit"><Check className="w-4 h-4" /></div>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.cautions.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="text-base font-extrabold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-200 mb-4">
                <Info className="w-5 h-5 text-amber-500" /> 주의사항
              </div>
              <div className="space-y-3">
                {report.cautions.map((c, i) => (
                  <div key={i} className="flex gap-3 text-base text-slate-700 font-medium bg-amber-50 p-4 rounded-xl border border-amber-200">
                    <div className="p-1 bg-amber-100 text-amber-600 rounded-lg shrink-0 h-fit"><Info className="w-4 h-4" /></div>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 p-4 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-sm leading-relaxed">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <span>본 리포트는 AI가 입력된 신체 정보와 의류 실측 패턴을 비교 대조하여 생성한 분석 결과입니다. 실제 착용 핏과 소재 특성에 따라 오차가 발생할 수 있습니다.</span>
          </div>
        </div>
      </div>

      <button onClick={onReset}
        className="w-full py-4 bg-white hover:bg-slate-50 text-blue-600 text-base font-extrabold rounded-xl border border-slate-200 transition-all text-center flex items-center justify-center gap-2 shadow-sm">
        <RefreshCw className="w-5 h-5" /> 새로운 분석 시작하기
      </button>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5">
      <span className="text-xs text-slate-500 font-bold block">{label}</span>
      <p className="text-sm font-extrabold text-slate-800 mt-1">{value}</p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { FileText, CheckCircle2, Sparkles, Sliders, Info, Check, RefreshCw, Wand2 } from "lucide-react";
import type { AnalysisResult } from "@/types";

interface Props { result: AnalysisResult; onReset: () => void; humanImageUrl?: string; garmentImageUrl?: string; }

export default function FitReportView({ result, onReset, humanImageUrl, garmentImageUrl }: Props) {
  const { report, bodyAnalysis, garmentData } = result;
  const [tryOnImage, setTryOnImage] = useState<string>("");
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnError, setTryOnError] = useState("");
  const canTryOn = humanImageUrl && garmentImageUrl;

  const handleTryOn = async () => {
    if (!humanImageUrl || !garmentImageUrl) return;
    setTryOnLoading(true); setTryOnError("");
    try { const res = await fetch("/api/try-on", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ humanImageUrl, garmentImageUrl }) }); if (!res.ok) { const err = await res.json(); throw new Error(err.error || "가상 피팅 실패"); } const data = await res.json(); setTryOnImage(data.resultImageUrl); if (data.mock) setTryOnError("Mock 모드입니다."); }
    catch (err) { setTryOnError(err instanceof Error ? err.message : "오류 발생"); } finally { setTryOnLoading(false); }
  };

  const getScoreColor = (s: number) => s >= 9 ? "text-emerald-600" : s >= 7 ? "text-brand-primary" : s >= 5 ? "text-brand-accent" : "text-red-500";
  const getScoreLabel = (s: number) => s >= 9 ? "최상의 핏" : s >= 7 ? "우수한 핏" : s >= 5 ? "보통" : "재검토 권장";

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div><div className="lg:sticky lg:top-24 space-y-5">
          {canTryOn && (
            <div className="bg-white rounded-2xl border border-brand-cream shadow-sm p-6">
              <div className="flex items-center justify-between pb-4 border-b border-brand-cream mb-4">
                <span className="text-base font-extrabold text-slate-800 flex items-center gap-2"><Wand2 className="w-5 h-5 text-brand-accent" /> 가상 피팅</span>
                {tryOnImage && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 완료</span>}
              </div>
              {tryOnImage ? (
                <div className="flex flex-col items-center gap-4">
                  <img src={tryOnImage} alt="가상 피팅" className="w-full rounded-lg border border-brand-cream" />
                  {tryOnError && <p className="text-xs text-brand-accent">{tryOnError}</p>}
                </div>
              ) : (
                <div className="text-center py-8">
                  {tryOnLoading ? (<div className="flex flex-col items-center gap-4"><div className="h-14 w-14 animate-spin rounded-full border-4 border-brand-cream border-t-brand-accent" /><p className="text-sm font-bold text-slate-700">생성 중...</p></div>)
                  : (<button onClick={handleTryOn} className="px-8 py-4 bg-brand-accent hover:bg-brand-accent/90 text-white font-extrabold rounded-xl shadow-lg shadow-brand-accent/20 active:scale-95 transition-all flex items-center gap-2 mx-auto"><Wand2 className="w-5 h-5" /> 가상 피팅 생성</button>)}
                  {tryOnError && !tryOnLoading && <p className="mt-3 text-sm text-brand-accent">{tryOnError}</p>}
                </div>
              )}
            </div>
          )}
          <div className="bg-white rounded-2xl border border-brand-cream shadow-sm p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-brand-cream mb-4"><Sliders className="w-5 h-5 text-brand-primary" /><span className="text-base font-extrabold text-slate-800">체형 분석</span></div>
            <div className="grid grid-cols-2 gap-3">
              <InfoItem label="체형 타입" value={bodyAnalysis.bodyType} />
              <InfoItem label="어깨" value={bodyAnalysis.shoulderWidth === "wide" ? "넓음" : bodyAnalysis.shoulderWidth === "narrow" ? "좁음" : "보통"} />
              <InfoItem label="비율" value={bodyAnalysis.proportions} />
              <InfoItem label="실루엣" value={bodyAnalysis.silhouette} />
            </div>
          </div>
        </div></div>

        <div className="space-y-5 lg:h-[calc(100vh-180px)] lg:overflow-y-auto lg:pr-2">
          <div className="bg-white rounded-2xl border border-brand-cream shadow-sm p-6">
            <div className="flex items-center justify-between pb-4 border-b border-brand-cream mb-5">
              <span className="text-base font-extrabold text-slate-800 flex items-center gap-2"><FileText className="w-5 h-5 text-brand-primary" /> AI 핏 리포트</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 분석 완료</span>
            </div>
            <div className="flex items-center gap-5">
              <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-4 flex flex-col items-center min-w-[120px]">
                <span className="text-xs text-slate-500 font-bold uppercase mb-1">적합도</span>
                <span className={`text-4xl font-black ${getScoreColor(report.fitScore)}`}>{report.fitScore}</span>
                <span className="text-sm text-slate-400 font-bold">/ 10</span>
                <span className={`text-[11px] font-bold mt-2 px-2 py-0.5 rounded-full border ${report.fitScore >= 7 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : report.fitScore >= 5 ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-red-50 text-red-700 border-red-200"}`}>{getScoreLabel(report.fitScore)}</span>
              </div>
              <div className="flex-1 space-y-2.5">
                <div className="flex items-center gap-3"><span className="text-sm text-slate-500 font-bold">추천 사이즈</span><span className="text-lg font-black text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-3 py-0.5 rounded-lg">{report.sizeRecommendation}</span></div>
                <div className="flex items-center gap-3"><span className="text-sm text-slate-500 font-bold">의류</span><span className="text-sm font-bold text-slate-800">{garmentData.name} · {garmentData.category === "top" ? "상의" : garmentData.category === "bottom" ? "하의" : garmentData.category === "outer" ? "아우터" : "원피스"}</span></div>
                <div className="h-2.5 w-full rounded-full bg-brand-cream overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent transition-all duration-700" style={{ width: `${report.fitScore * 10}%` }} /></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-brand-cream shadow-sm p-6">
            <div className="text-base font-extrabold text-slate-800 flex items-center gap-2 pb-3 border-b border-brand-cream mb-4"><Sparkles className="w-5 h-5 text-brand-accent" /> AI 핏 분석 소견</div>
            <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-xl p-5"><p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">{report.fitAnalysis}</p></div>
          </div>

          <div className="bg-white rounded-2xl border border-brand-cream shadow-sm p-6">
            <div className="flex items-center gap-2 pb-3 border-b border-brand-cream mb-4"><Sliders className="w-5 h-5 text-brand-secondary" /><span className="text-base font-extrabold text-slate-800">부위별 핏 분석</span></div>
            <div className="divide-y divide-brand-cream">
              {Object.entries(report.details).map(([key, value]) => (
                <div key={key} className="py-3.5 flex items-start gap-3">
                  <span className="text-xs font-extrabold text-brand-primary bg-brand-primary/10 border border-brand-primary/20 px-2.5 py-1 rounded-md uppercase shrink-0 mt-0.5">{key}</span>
                  <p className="text-base text-slate-700 leading-relaxed">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {report.styling.length > 0 && (
            <div className="bg-white rounded-2xl border border-brand-cream shadow-sm p-6">
              <div className="text-base font-extrabold text-slate-800 flex items-center gap-2 pb-3 border-b border-brand-cream mb-4"><Check className="w-5 h-5 text-emerald-500" /> 스타일링 팁</div>
              <div className="space-y-3">{report.styling.map((tip, i) => (<div key={i} className="flex gap-3 text-slate-700 bg-emerald-50 p-4 rounded-xl border border-emerald-200"><Check className="w-4 h-4 text-emerald-500 shrink-0 mt-1" /><span>{tip}</span></div>))}</div>
            </div>
          )}

          {report.cautions.length > 0 && (
            <div className="bg-white rounded-2xl border border-brand-cream shadow-sm p-6">
              <div className="text-base font-extrabold text-slate-800 flex items-center gap-2 pb-3 border-b border-brand-cream mb-4"><Info className="w-5 h-5 text-brand-accent" /> 주의사항</div>
              <div className="space-y-3">{report.cautions.map((c, i) => (<div key={i} className="flex gap-3 text-slate-700 bg-brand-accent/5 p-4 rounded-xl border border-brand-accent/20"><Info className="w-4 h-4 text-brand-accent shrink-0 mt-1" /><span>{c}</span></div>))}</div>
            </div>
          )}

          <div className="flex gap-3 p-4 bg-brand-primary/5 border border-brand-primary/15 rounded-xl text-slate-500 text-sm">
            <Info className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
            <span>본 리포트는 AI 분석 결과이며, 실제 착용 핏과 차이가 있을 수 있습니다.</span>
          </div>
        </div>
      </div>
      <button onClick={onReset} className="w-full py-4 bg-white hover:bg-brand-light text-brand-primary text-base font-extrabold rounded-xl border border-brand-cream transition-all flex items-center justify-center gap-2 shadow-sm"><RefreshCw className="w-5 h-5" /> 새로운 분석 시작하기</button>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (<div className="bg-brand-light border border-brand-cream rounded-xl p-3.5"><span className="text-xs text-slate-500 font-bold block">{label}</span><p className="text-sm font-extrabold text-slate-800 mt-1">{value}</p></div>);
}

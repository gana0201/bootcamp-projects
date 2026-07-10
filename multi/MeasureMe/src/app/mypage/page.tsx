"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Ruler, Weight, LogOut, Save, FileText, Calendar, TrendingUp } from "lucide-react";

interface Profile { name: string; email: string; height: number | null; weight: number | null; gender: string | null; createdAt: string; }
interface AnalysisRecord { id: string; bodyAnalysis: { bodyType?: string; }; garmentData: { name?: string; category?: string; }; report: { fitScore?: number; sizeRecommendation?: string; fitAnalysis?: string; }; imageUrl: string; createdAt: string; }

export default function MyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ height: "", weight: "", gender: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileRes, historyRes] = await Promise.all([fetch("/api/profile"), fetch("/api/history")]);
        if (!profileRes.ok) { router.push("/login"); return; }
        const profileData = await profileRes.json();
        setProfile(profileData.profile);
        setFormData({ height: profileData.profile.height?.toString() || "", weight: profileData.profile.weight?.toString() || "", gender: profileData.profile.gender || "" });
        if (historyRes.ok) { const historyData = await historyRes.json(); setAnalyses(historyData.analyses || []); }
      } catch { router.push("/login"); } finally { setLoading(false); }
    }
    fetchData();
  }, [router]);

  const handleSaveProfile = async () => {
    setSaving(true); setMessage("");
    try {
      const res = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ height: formData.height ? Number(formData.height) : null, weight: formData.weight ? Number(formData.weight) : null, gender: formData.gender || null }) });
      if (res.ok) { setProfile((prev) => prev ? { ...prev, height: formData.height ? Number(formData.height) : null, weight: formData.weight ? Number(formData.weight) : null, gender: formData.gender || null } : null); setEditMode(false); setMessage("프로필이 저장되었습니다"); setTimeout(() => setMessage(""), 3000); }
    } catch { setMessage("저장에 실패했습니다"); } finally { setSaving(false); }
  };

  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; };
  const getGenderLabel = (g: string | null) => g === "male" ? "남성" : g === "female" ? "여성" : "미설정";
  const getCategoryLabel = (c: string | undefined) => { const m: Record<string, string> = { top: "상의", bottom: "하의", outer: "아우터", dress: "원피스" }; return c ? m[c] || c : "의류"; };
  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" }); } catch { return d; } };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-cream border-t-brand-primary" /></div>;
  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black text-slate-800">마이페이지</h1><p className="text-sm text-slate-500 mt-1">프로필 정보와 분석 기록을 확인하세요</p></div>
        <button onClick={handleLogout} className="flex items-center gap-2 rounded-xl border border-brand-cream px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-brand-light transition-colors"><LogOut className="w-4 h-4" />로그아웃</button>
      </div>

      {message && <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-700 text-sm font-medium">{message}</div>}

      <div className="bg-white rounded-2xl border border-brand-cream shadow-sm overflow-hidden">
        <div className="bg-brand-primary/5 px-6 py-4 border-b border-brand-cream">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-primary/10 rounded-xl"><User className="w-5 h-5 text-brand-primary" /></div>
              <div><h2 className="text-lg font-bold text-slate-800">{profile.name}</h2><p className="text-xs text-slate-500">{profile.email}</p></div>
            </div>
            {!editMode && <button onClick={() => setEditMode(true)} className="text-sm font-bold text-brand-accent hover:text-brand-accent/80">수정</button>}
          </div>
        </div>
        <div className="p-6">
          {editMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="block text-xs font-bold text-slate-600 mb-1.5">성별</label><select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full rounded-lg bg-brand-light border border-brand-cream px-3 py-2.5 text-sm text-slate-800 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"><option value="">선택</option><option value="male">남성</option><option value="female">여성</option></select></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1.5">키 (cm)</label><input type="number" value={formData.height} onChange={(e) => setFormData({ ...formData, height: e.target.value })} placeholder="170" className="w-full rounded-lg bg-brand-light border border-brand-cream px-3 py-2.5 text-sm text-slate-800 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" /></div>
                <div><label className="block text-xs font-bold text-slate-600 mb-1.5">몸무게 (kg)</label><input type="number" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder="65" className="w-full rounded-lg bg-brand-light border border-brand-cream px-3 py-2.5 text-sm text-slate-800 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary" /></div>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setEditMode(false)} className="rounded-lg border border-brand-cream px-4 py-2 text-sm font-medium text-slate-600 hover:bg-brand-light">취소</button>
                <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-2 rounded-lg bg-brand-accent px-4 py-2 text-sm font-bold text-white hover:bg-brand-accent/90 disabled:opacity-50"><Save className="w-4 h-4" />{saving ? "저장 중..." : "저장"}</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center gap-3"><div className="p-2 bg-brand-primary/10 rounded-lg"><User className="w-4 h-4 text-brand-primary" /></div><div><p className="text-xs text-slate-500">성별</p><p className="text-sm font-bold text-slate-800">{getGenderLabel(profile.gender)}</p></div></div>
              <div className="flex items-center gap-3"><div className="p-2 bg-brand-secondary/10 rounded-lg"><Ruler className="w-4 h-4 text-brand-secondary" /></div><div><p className="text-xs text-slate-500">키</p><p className="text-sm font-bold text-slate-800">{profile.height ? `${profile.height} cm` : "미설정"}</p></div></div>
              <div className="flex items-center gap-3"><div className="p-2 bg-brand-accent/10 rounded-lg"><Weight className="w-4 h-4 text-brand-accent" /></div><div><p className="text-xs text-slate-500">몸무게</p><p className="text-sm font-bold text-slate-800">{profile.weight ? `${profile.weight} kg` : "미설정"}</p></div></div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-brand-primary" /><h2 className="text-lg font-bold text-slate-800">핏 리포트 기록</h2><span className="text-xs font-bold text-slate-400 bg-brand-cream px-2 py-0.5 rounded-full">{analyses.length}건</span></div>
        {analyses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-cream p-12 text-center shadow-sm">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-sm text-slate-500">아직 분석 기록이 없습니다</p>
            <button onClick={() => router.push("/")} className="mt-4 rounded-lg bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-primary/90">핏 분석하기</button>
          </div>
        ) : (
          <div className="space-y-3">{analyses.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-brand-cream p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2"><span className="text-xs font-bold text-white bg-brand-primary px-2 py-0.5 rounded-md">{getCategoryLabel(a.garmentData?.category)}</span>{a.garmentData?.name && <span className="text-sm font-bold text-slate-800 truncate">{a.garmentData.name}</span>}</div>
                  {a.report?.fitAnalysis && <p className="text-xs text-slate-500 line-clamp-2 mb-2">{a.report.fitAnalysis}</p>}
                  <div className="flex items-center gap-4 text-xs text-slate-400"><span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(a.createdAt)}</span>{a.report?.sizeRecommendation && <span className="flex items-center gap-1"><Ruler className="w-3.5 h-3.5" />{a.report.sizeRecommendation}</span>}</div>
                </div>
                {a.report?.fitScore != null && (
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm border-2 ${a.report.fitScore >= 8 ? "border-emerald-400 text-emerald-600 bg-emerald-50" : a.report.fitScore >= 6 ? "border-brand-accent text-brand-accent bg-brand-accent/10" : "border-red-400 text-red-500 bg-red-50"}`}>{a.report.fitScore}</div>
                    <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" />핏점수</span>
                  </div>
                )}
              </div>
            </div>
          ))}</div>
        )}
      </div>
    </div>
  );
}

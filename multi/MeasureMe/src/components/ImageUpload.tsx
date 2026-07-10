"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, UserPlus, Info, Check, ArrowRight } from "lucide-react";

interface ProfileData {
  height: string;
  weight: string;
  gender: "male" | "female" | "";
}

interface Props {
  onComplete: (imageUrl: string, profile: ProfileData) => void;
}

export default function ImageUpload({ onComplete }: Props) {
  const [preview, setPreview] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({ height: "", weight: "", gender: "" });
  const [profileLoaded, setProfileLoaded] = useState(false);

  // 로그인한 경우 저장된 프로필(성별/키/몸무게)을 자동으로 불러와 폼에 채움
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return; // 비로그인(401) 등은 무시
        const data = await res.json();
        const p = data.profile;
        if (!p || !active) return;
        setProfile({
          height: p.height != null ? String(p.height) : "",
          weight: p.weight != null ? String(p.weight) : "",
          gender: p.gender === "male" || p.gender === "female" ? p.gender : "",
        });
      } catch {
        // 네트워크 오류 등은 무시하고 빈 폼 유지
      } finally {
        if (active) setProfileLoaded(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { alert("이미지 파일만 업로드 가능합니다"); return; }
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const data = await res.json();
      setImageUrl(data.imageUrl);
    } catch (err) { alert(err instanceof Error ? err.message : "업로드 실패"); setPreview(""); }
    finally { setUploading(false); }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragActive(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file); }, [handleFile]);

  const handleNext = () => { if (!imageUrl) { alert("전신 사진을 업로드해주세요"); return; } onComplete(imageUrl, profile); };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      <div className="bg-white rounded-2xl border border-brand-cream shadow-sm p-6 flex flex-col justify-between h-full space-y-6">
        <div className="space-y-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2.5 pb-3 border-b border-brand-cream">
            <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-lg"><Upload className="w-5 h-5" /></div>
            <div>
              <h2 className="text-base font-bold text-slate-800">1-1. 전신 사진 업로드</h2>
              <p className="text-sm text-slate-500">정면 전신 사진을 드래그하거나 클릭하여 업로드하세요</p>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => { const input = document.getElementById("body-photo-input") as HTMLInputElement; input?.click(); }}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all relative overflow-hidden flex flex-col items-center justify-center flex-1 min-h-[220px] ${
                preview ? "border-brand-primary bg-brand-primary/5" : dragActive ? "border-brand-accent bg-brand-accent/5" : "border-brand-cream hover:border-brand-primary hover:bg-brand-light"
              }`}
            >
              <input type="file" id="body-photo-input" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFile(file); }} disabled={uploading} />
              {preview ? (
                <div className="flex flex-col items-center justify-center w-full space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-brand-cream shadow-sm group">
                    <img src={preview} alt="업로드된 전신 사진" className="max-h-[300px] w-auto h-auto object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-sm font-bold text-white bg-brand-primary px-3 py-1.5 rounded-full">클릭하여 사진 변경</span>
                    </div>
                  </div>
                  {uploading ? <span className="text-sm font-bold text-brand-primary animate-pulse">업로드 중...</span>
                  : imageUrl ? <span className="text-sm font-bold text-brand-primary flex items-center gap-1"><Check className="w-4 h-4 text-brand-secondary" /> 업로드 완료</span> : null}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-6">
                  <div className="w-14 h-14 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary"><Upload className="w-7 h-7" /></div>
                  <span className="text-base font-bold text-slate-700">여기를 클릭하여 전신 사진 업로드</span>
                  <span className="text-sm text-slate-400">또는 이미지 파일을 드래그 앤 드롭</span>
                  <span className="text-xs text-slate-400 pt-2 border-t border-brand-cream">정면 전신 사진 권장 (JPG, PNG, WebP)</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2 p-3 bg-brand-accent/5 text-slate-700 rounded-xl text-sm border border-brand-accent/20">
          <Info className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
          <span><strong>팁:</strong> 머리부터 발끝까지 바르게 서 있는 정면 사진이 가장 이상적입니다.</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-cream shadow-sm p-6 flex flex-col justify-between h-full space-y-6">
        <div className="space-y-5 flex flex-col h-full justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-brand-cream">
              <div className="p-2.5 bg-brand-primary/10 text-brand-primary rounded-lg"><UserPlus className="w-5 h-5" /></div>
              <div>
                <h2 className="text-base font-bold text-slate-800">1-2. 신체 프로필 입력</h2>
                <p className="text-sm text-slate-500">성별, 키, 몸무게를 입력하면 더 정확한 핏 분석이 가능합니다</p>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-bold text-slate-700">성별</span>
              <div className="grid grid-cols-2 gap-2.5">
                {(["male", "female"] as const).map((g) => (
                  <button key={g} type="button" onClick={() => setProfile((p) => ({ ...p, gender: p.gender === g ? "" : g }))}
                    className={`py-3 px-3 rounded-xl text-sm font-extrabold transition-all border ${
                      profile.gender === g ? "bg-brand-primary border-brand-primary text-white shadow-md" : "bg-brand-light border-brand-cream text-slate-700 hover:border-brand-primary"
                    }`}>{g === "male" ? "남성" : "여성"}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">키</label>
                <div className="relative">
                  <input type="number" min="130" max="230" value={profile.height} onChange={(e) => setProfile((p) => ({ ...p, height: e.target.value }))}
                    className="w-full bg-brand-light border border-brand-cream focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 rounded-xl px-4 py-3.5 text-base font-bold text-slate-800 outline-none pr-12" placeholder="178" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">cm</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">몸무게</label>
                <div className="relative">
                  <input type="number" min="30" max="180" value={profile.weight} onChange={(e) => setProfile((p) => ({ ...p, weight: e.target.value }))}
                    className="w-full bg-brand-light border border-brand-cream focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 rounded-xl px-4 py-3.5 text-base font-bold text-slate-800 outline-none pr-12" placeholder="72" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">kg</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-brand-primary/5 border border-brand-primary/15 rounded-xl p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-sm font-bold text-brand-primary">
              <Info className="w-4 h-4" /> 정밀 피팅 가이드
              {profileLoaded && (profile.height || profile.weight || profile.gender) && (
                <span className="ml-auto flex items-center gap-1 text-xs font-bold text-brand-secondary"><Check className="w-3.5 h-3.5" /> 저장된 프로필 불러옴</span>
              )}
            </div>
            <p className="text-sm text-slate-600">
              {profile.height && profile.weight ? (<>현재 <strong>{profile.height}cm / {profile.weight}kg</strong> ({profile.gender === "male" ? "남성" : profile.gender === "female" ? "여성" : "미선택"}) 기준으로 분석합니다.</>) : (<>키와 몸무게를 입력하면 정확도가 크게 향상됩니다.</>)}
            </p>
          </div>
        </div>
        <button onClick={handleNext} disabled={!imageUrl || uploading}
          className="w-full px-8 py-4 bg-brand-accent hover:bg-brand-accent/90 text-white font-extrabold text-base rounded-xl shadow-lg shadow-brand-accent/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
          다음 단계: 의류 정보 입력하기 <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

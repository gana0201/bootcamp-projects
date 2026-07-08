"use client";

import { useState, useCallback } from "react";
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
  const [profile, setProfile] = useState<ProfileData>({
    height: "",
    weight: "",
    gender: "",
  });

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      const data = await res.json();
      setImageUrl(data.imageUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : "업로드 실패");
      setPreview("");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleNext = () => {
    if (!imageUrl) {
      alert("전신 사진을 업로드해주세요");
      return;
    }
    onComplete(imageUrl, profile);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {/* Left Card: Photo Upload */}
      <div className="bg-white/95 rounded-2xl border border-brand-cream/60 shadow-sm p-6 flex flex-col justify-between h-full space-y-6">
        <div className="space-y-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2.5 pb-3 border-b border-brand-cream/35">
            <div className="p-2.5 bg-brand-secondary/20 text-brand-secondary rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-dark">1-1. 전신 사진 업로드</h2>
              <p className="text-sm text-brand-dark/50">정면 전신 사진을 드래그하거나 클릭하여 업로드하세요</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => {
                const input = document.getElementById("body-photo-input") as HTMLInputElement;
                input?.click();
              }}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all relative overflow-hidden flex flex-col items-center justify-center flex-1 min-h-[220px] ${
                preview
                  ? "border-brand-primary bg-brand-light/30 hover:border-brand-dark"
                  : dragActive
                  ? "border-brand-primary bg-brand-light/35"
                  : "border-brand-cream hover:border-brand-primary hover:bg-brand-light/35"
              }`}
            >
              <input
                type="file"
                id="body-photo-input"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
                disabled={uploading}
              />

              {preview ? (
                <div className="flex flex-col items-center justify-center w-full space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-brand-light/40 border border-brand-cream shadow-sm group">
                    <img
                      src={preview}
                      alt="업로드된 전신 사진"
                      className="max-h-[300px] w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-brand-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-sm font-bold text-white bg-brand-dark/90 px-3 py-1.5 rounded-full border border-white/20">
                        클릭하여 사진 변경
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    {uploading ? (
                      <span className="text-sm font-bold text-brand-primary animate-pulse">업로드 중...</span>
                    ) : imageUrl ? (
                      <span className="text-sm font-bold text-brand-primary flex items-center justify-center gap-1 bg-brand-light/80 border border-brand-cream px-3 py-1 rounded-full w-fit mx-auto">
                        <Check className="w-4 h-4 text-brand-secondary" /> 전신 사진 업로드 완료
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-6">
                  <div className="w-14 h-14 rounded-full bg-brand-light flex items-center justify-center text-brand-primary shadow-inner border border-brand-cream/30">
                    <Upload className="w-7 h-7 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-base font-bold text-brand-dark/85 block">여기를 클릭하여 전신 사진 업로드</span>
                    <span className="text-sm text-brand-dark/50 block mt-1">또는 이미지 파일을 이 영역으로 드래그 앤 드롭</span>
                  </div>
                  <span className="text-xs text-brand-dark/50 leading-normal max-w-xs mx-auto pt-2 border-t border-brand-cream/35">
                    정면을 똑바로 바라보고 바른 자세로 서 있는<br />전신 정면 사진을 권장합니다. (JPG, PNG, WebP)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="flex gap-2 p-3 bg-brand-secondary/15 text-brand-dark rounded-xl text-sm leading-relaxed border border-brand-secondary/35">
          <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <span>
            <strong>정면 전신 자세 팁:</strong> 머리부터 발끝까지 수직으로 바르게 서 있고, 가려짐이 적은 사진이 가장 이상적입니다.
          </span>
        </div>
      </div>

      {/* Right Card: Profile Specs */}
      <div className="bg-white/95 rounded-2xl border border-brand-cream/60 shadow-sm p-6 flex flex-col justify-between h-full space-y-6">
        <div className="space-y-5 flex flex-col h-full justify-between">
          <div className="space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-brand-cream/35">
              <div className="p-2.5 bg-brand-light text-brand-primary rounded-lg border border-brand-cream/30">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-brand-dark">1-2. 신체 프로필 입력</h2>
                <p className="text-sm text-brand-dark/50">성별, 키, 몸무게를 입력하면 더 정확한 핏 분석이 가능합니다</p>
              </div>
            </div>

            {/* Gender Selection */}
            <div className="space-y-2">
              <span className="text-sm font-bold text-brand-dark/70 block">성별 (Gender)</span>
              <div className="grid grid-cols-2 gap-2.5">
                {(["male", "female"] as const).map((genderOption) => (
                  <button
                    key={genderOption}
                    type="button"
                    onClick={() =>
                      setProfile((p) => ({
                        ...p,
                        gender: p.gender === genderOption ? "" : genderOption,
                      }))
                    }
                    className={`py-3 px-3 rounded-xl text-sm font-extrabold transition-all border ${
                      profile.gender === genderOption
                        ? "bg-brand-primary border-brand-primary text-white shadow-md shadow-brand-primary/25"
                        : "bg-white border-brand-cream/50 text-brand-dark hover:bg-brand-light/40 hover:border-brand-primary/40"
                    }`}
                  >
                    {genderOption === "male" ? "남성" : "여성"}
                  </button>
                ))}
              </div>
            </div>

            {/* Height & Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="height-input" className="text-sm font-bold text-brand-dark/70 block">
                  키 (Height)
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type="number"
                    id="height-input"
                    min="130"
                    max="230"
                    value={profile.height}
                    onChange={(e) => setProfile((p) => ({ ...p, height: e.target.value }))}
                    className="w-full bg-brand-light/20 hover:bg-brand-light/40 border border-brand-cream/70 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 rounded-xl px-4 py-3.5 text-base font-bold font-mono text-brand-dark transition-all outline-none pr-12"
                    placeholder="예: 178"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-sm font-extrabold text-brand-dark/40">cm</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="weight-input" className="text-sm font-bold text-brand-dark/70 block">
                  몸무게 (Weight)
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <input
                    type="number"
                    id="weight-input"
                    min="30"
                    max="180"
                    value={profile.weight}
                    onChange={(e) => setProfile((p) => ({ ...p, weight: e.target.value }))}
                    className="w-full bg-brand-light/20 hover:bg-brand-light/40 border border-brand-cream/70 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 rounded-xl px-4 py-3.5 text-base font-bold font-mono text-brand-dark transition-all outline-none pr-12"
                    placeholder="예: 72"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-sm font-extrabold text-brand-dark/40">kg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Guide Card */}
          <div className="bg-brand-light/60 border border-brand-cream/60 rounded-xl p-4 mt-2 space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm font-bold text-brand-primary">
              <Info className="w-4 h-4 text-brand-secondary shrink-0" />
              정밀 피팅 가이드
            </div>
            <p className="text-sm text-brand-dark/75 leading-relaxed font-medium">
              {profile.height && profile.weight ? (
                <>현재 입력된 <strong>{profile.height}cm / {profile.weight}kg</strong> ({profile.gender === "male" ? "남성" : profile.gender === "female" ? "여성" : "미선택"}) 기준으로 의류 치수를 비교 분석합니다.</>
              ) : (
                <>키와 몸무게를 입력하면 AI가 체형에 맞는 정밀 피팅 분석을 제공합니다. 선택사항이지만 입력 시 정확도가 크게 향상됩니다.</>
              )}
            </p>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={!imageUrl || uploading}
          className="w-full px-8 py-4 bg-gradient-to-r from-brand-primary to-brand-dark hover:from-brand-dark hover:to-brand-primary text-white font-extrabold text-base rounded-xl shadow-lg shadow-brand-primary/25 active:scale-95 transition-all flex items-center justify-center gap-2 border border-brand-primary/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          다음 단계: 의류 정보 입력하기 <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

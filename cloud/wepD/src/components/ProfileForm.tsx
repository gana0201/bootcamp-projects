import React, { useRef } from 'react';
import { UserProfile, PresetModel } from '../types';
import { PRESET_MODELS } from '../data';
import { Upload, User, UserPlus, Info, Check } from 'lucide-react';

interface ProfileFormProps {
  profile: UserProfile;
  onChange: (profile: UserProfile) => void;
  mode?: 'all' | 'upload' | 'specs';
}

export default function ProfileForm({ profile, onChange, mode = 'all' }: ProfileFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePresetSelect = (model: PresetModel) => {
    onChange({
      ...profile,
      gender: model.gender,
      height: model.height,
      weight: model.weight,
      bodyShape: model.bodyShape,
      selectedPresetModelId: model.id,
      customPhotoUrl: null // reset custom photo when preset is clicked
    });
  };

  const handleProfileFieldChange = (field: keyof UserProfile, value: any) => {
    onChange({
      ...profile,
      [field]: value,
      // If updating fields that conflict with selected preset, mark custom model mode
      selectedPresetModelId: field === 'selectedPresetModelId' ? value : 'custom'
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onChange({
          ...profile,
          customPhotoUrl: reader.result as string,
          selectedPresetModelId: 'custom'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        onChange({
          ...profile,
          customPhotoUrl: reader.result as string,
          selectedPresetModelId: 'custom'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const renderPhotoUpload = () => (
    <div className="space-y-6">
      <div id="photo-upload-card" className="bg-white/95 rounded-2xl border border-brand-cream/60 shadow-sm p-6 flex flex-col justify-between h-full space-y-6">
        <div className="space-y-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2 pb-2 border-b border-brand-cream/35">
            <div className="p-2 bg-brand-secondary/20 text-brand-secondary rounded-lg">
              <Upload className="w-5 h-5" id="upload-icon" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-brand-dark font-sans">1-1. 직접 찍은 전신 사진 사용 (선택)</h2>
              <p className="text-xs text-brand-dark/50">자신의 사진을 드래그하거나 업로드하여 전용 피팅 모델로 설정합니다</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div
              id="custom-body-dropzone"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all relative overflow-hidden flex flex-col items-center justify-center flex-1 min-h-[220px] ${
                profile.customPhotoUrl
                  ? 'border-brand-primary bg-brand-light/30 hover:border-brand-dark'
                  : 'border-brand-cream hover:border-brand-primary hover:bg-brand-light/35'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
                id="body-photo-uploader"
              />
              {profile.customPhotoUrl ? (
                <div className="flex flex-col items-center justify-center w-full space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-brand-light/40 border border-brand-cream shadow-sm group">
                    <img
                      src={profile.customPhotoUrl}
                      alt="Custom body model"
                      className="max-h-[300px] w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-brand-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs font-bold text-white bg-brand-dark/90 px-3 py-1.5 rounded-full border border-white/20">
                        클릭하여 사진 변경
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-brand-primary flex items-center justify-center gap-1 mb-1 bg-brand-light/80 border border-brand-cream px-3 py-1 rounded-full w-fit mx-auto">
                      <Check className="w-3.5 h-3.5 text-brand-secondary" /> 전신 사진 업로드 완료
                    </span>
                    <p className="text-[10px] text-brand-dark/60 leading-relaxed mt-1">
                      마우스 드래그나 자동 피팅 버튼을 사용하여 옷의 크기와 높낮이를 조절해보세요.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-6">
                  <div className="w-12 h-12 rounded-full bg-brand-light flex items-center justify-center text-brand-primary shadow-inner border border-brand-cream/30">
                    <Upload className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-brand-dark/85 block">여기를 클릭하여 내 전신 사진 업로드</span>
                    <span className="text-[10px] text-brand-dark/50 block mt-1">또는 이미지 파일을 이 영역으로 드래그 앤 드롭</span>
                  </div>
                  <span className="text-[10px] text-brand-dark/50 leading-normal max-w-xs mx-auto pt-2 border-t border-brand-cream/35">
                    정면을 똑바로 바라보고 바른 자세로 서 있는<br />전신 정면 사진을 권장합니다. (JPG, PNG)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Warning info about 2D overlay */}
        <div className="flex gap-2 p-3 bg-brand-secondary/15 text-brand-dark rounded-xl text-[11px] leading-relaxed border border-brand-secondary/35">
          <Info className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <span>
            <strong>정면 전신 자세의 정렬 팁:</strong> 옷을 깔끔하게 피팅하려면, 머리부터 발끝까지 수직으로 바르게 서 있고 가려짐이 적은 사진이 가장 이상적입니다.
          </span>
        </div>
      </div>
    </div>
  );

  const renderBodySpecs = (withCardStyle = false) => {
    const content = (
      <div className="space-y-5 flex flex-col h-full justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-brand-cream/35">
            <div className="p-2 bg-brand-light text-brand-primary rounded-lg border border-brand-cream/30">
              <UserPlus className="w-5 h-5" id="specs-icon" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-brand-dark font-sans">1-2. 신체 스펙 입력 및 세부 조정</h2>
              <p className="text-xs text-brand-dark/50">성별, 키, 몸무게 등을 세부 조정하여 더욱 정확한 핏을 확인하세요</p>
            </div>
          </div>

          {/* Gender Selection */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-brand-dark/70 block">성별 (Gender)</span>
            <div className="grid grid-cols-3 gap-2.5">
              {(['male', 'female', 'unisex'] as const).map((genderOption) => (
                <button
                  key={genderOption}
                  id={`gender-opt-${genderOption}`}
                  type="button"
                  onClick={() => handleProfileFieldChange('gender', genderOption)}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                    profile.gender === genderOption
                      ? 'bg-brand-primary border-brand-primary text-white shadow-md shadow-brand-primary/25'
                      : 'bg-white border-brand-cream/50 text-brand-dark hover:bg-brand-light/40 hover:border-brand-primary/40'
                  }`}
                >
                  {genderOption === 'male' ? '남성' : genderOption === 'female' ? '여성' : '공용'}
                </button>
              ))}
            </div>
          </div>

          {/* Height & Weight Input Fields */}
          <div className="grid grid-cols-2 gap-4">
            {/* Height Input */}
            <div className="space-y-2">
              <label htmlFor="height-number-input" className="text-xs font-bold text-brand-dark/70 block">
                키 (Height)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type="number"
                  id="height-number-input"
                  min="130"
                  max="230"
                  value={profile.height || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    handleProfileFieldChange('height', isNaN(val) ? 0 : val);
                  }}
                  className="w-full bg-brand-light/20 hover:bg-brand-light/40 border border-brand-cream/70 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 rounded-xl px-4 py-3 text-sm font-bold font-mono text-brand-dark transition-all outline-none pr-12"
                  placeholder="예: 178"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-xs font-extrabold text-brand-dark/40">cm</span>
                </div>
              </div>
            </div>

            {/* Weight Input */}
            <div className="space-y-2">
              <label htmlFor="weight-number-input" className="text-xs font-bold text-brand-dark/70 block">
                몸무게 (Weight)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type="number"
                  id="weight-number-input"
                  min="30"
                  max="180"
                  value={profile.weight || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    handleProfileFieldChange('weight', isNaN(val) ? 0 : val);
                  }}
                  className="w-full bg-brand-light/20 hover:bg-brand-light/40 border border-brand-cream/70 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 rounded-xl px-4 py-3 text-sm font-bold font-mono text-brand-dark transition-all outline-none pr-12"
                  placeholder="예: 72"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <span className="text-xs font-extrabold text-brand-dark/40">kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Body Shape */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-brand-dark/70 block">체격 형태 (Body Shape)</span>
            <div className="grid grid-cols-5 gap-1.5">
              {(['slim', 'standard', 'athletic', 'muscular', 'curvy'] as const).map((shape) => (
                <button
                  key={shape}
                  id={`shape-opt-${shape}`}
                  type="button"
                  onClick={() => handleProfileFieldChange('bodyShape', shape)}
                  className={`py-2 rounded-lg text-[11px] font-extrabold border transition-all truncate ${
                    profile.bodyShape === shape
                      ? 'bg-brand-primary border-brand-primary text-white shadow-md shadow-brand-primary/25'
                      : 'bg-white border-brand-cream/55 text-brand-dark hover:bg-brand-light/40 hover:border-brand-primary/40'
                  }`}
                >
                  {shape === 'slim' ? '슬림' : shape === 'standard' ? '보통' : shape === 'athletic' ? '탄탄' : shape === 'muscular' ? '근육질' : '글래머'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Spec Helper Tip Card - Fills layout beautifully, zero feeling of empty space */}
        <div className="bg-brand-light/60 border border-brand-cream/60 rounded-xl p-4 mt-2 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-brand-primary">
            <Info className="w-3.5 h-3.5 text-brand-secondary shrink-0" />
            정밀 피팅 수치 가이드
          </div>
          <p className="text-[11px] text-brand-dark/75 leading-relaxed font-medium">
            현재 선택된 <strong>{profile.height || '0'}cm / {profile.weight || '0'}kg</strong> ({
              profile.bodyShape === 'slim' ? '슬림한' :
              profile.bodyShape === 'standard' ? '보통 체형의' :
              profile.bodyShape === 'athletic' ? '탄탄한' :
              profile.bodyShape === 'muscular' ? '근육질의' : '글래머러스한'
            } {profile.gender === 'male' ? '남성' : profile.gender === 'female' ? '여성' : '공용'}) 모델 비율에 맞추어 의류 치수와 조화를 맞추시면 최적의 2D 피팅 실루엣이 생성됩니다.
          </p>
        </div>
      </div>
    );

    if (withCardStyle) {
      return (
        <div id="body-specs-card" className="bg-white/95 rounded-2xl border border-brand-cream/60 shadow-sm p-6 flex flex-col justify-between h-full space-y-6">
          {content}
        </div>
      );
    }

    return (
      <div id="body-specs-card" className="flex flex-col justify-between h-full space-y-6">
        {content}
      </div>
    );
  };

  if (mode === 'upload') {
    return renderPhotoUpload();
  }

  if (mode === 'specs') {
    return renderBodySpecs(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {renderPhotoUpload()}
      {renderBodySpecs(true)}
    </div>
  );
}

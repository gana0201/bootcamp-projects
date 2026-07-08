import React, { useState } from 'react';
import { UserProfile, ClothingItem, AiFittingResponse } from './types';
import { PRESET_MODELS, PRESET_CLOTHES } from './data';
import ProfileForm from './components/ProfileForm';
import ClothesSelector from './components/ClothesSelector';
import FittingCanvas from './components/FittingCanvas';
import { Sparkles, Shirt, ShieldCheck, Heart, Info, HelpCircle, CheckCircle2, ChevronRight, User, Image, ArrowRight, Sliders, FileText, Check } from 'lucide-react';

export default function App() {
  // Navigation active tab (Step 1: 'body', Step 2: 'clothes', Step 3: 'fitting')
  const [activeTab, setActiveTab] = useState<'body' | 'clothes' | 'fitting'>('body');

  // Initialize standard user profile state
  const [profile, setProfile] = useState<UserProfile>({
    height: 178,
    weight: 72,
    gender: 'male',
    bodyShape: 'standard',
    customPhotoUrl: null,
    selectedPresetModelId: PRESET_MODELS[0].id,
  });

  // Initialize selected garment item state (default to first preset white T-shirt)
  const [selectedClothing, setSelectedClothing] = useState<ClothingItem>(PRESET_CLOTHES[0]);
  const [clothingPhotoBase64, setClothingPhotoBase64] = useState<string | undefined>(undefined);

  // AI analysis result from Gemini
  const [analysisResult, setAnalysisResult] = useState<AiFittingResponse | null>(null);

  const handleClothingSelect = (item: ClothingItem, originalBase64?: string) => {
    setSelectedClothing(item);
    if (originalBase64) {
      setClothingPhotoBase64(originalBase64);
    } else {
      setClothingPhotoBase64(undefined);
    }
  };

  // Helper tightness translator
  const getTightnessBadge = (level: string) => {
    switch (level) {
      case 'tight':
        return { text: '타이트함 (Slim-fit)', color: 'bg-orange-50 text-orange-600 border-orange-100' };
      case 'perfect':
        return { text: '정사이즈 (Perfect)', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      case 'loose':
        return { text: '루즈함 (Relaxed)', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
      case 'oversized':
        return { text: '오버핏 (Oversized)', color: 'bg-purple-50 text-purple-600 border-purple-100' };
      default:
        return { text: '보통', color: 'bg-slate-50 text-slate-600 border-slate-100' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-light/75 via-white to-brand-cream/60 flex flex-col font-sans" id="app-root-container">
      
      {/* Visual Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-brand-primary text-white rounded-xl shadow-md shadow-brand-primary/10">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                AI Virtual Fitting Room <span className="text-[10px] bg-brand-accent/20 text-brand-dark font-black px-1.5 py-0.5 rounded-md border border-brand-accent/30">Beta v1.4</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">사용자 프로필 & 업로드 의류 매칭 2D 레이아웃 피팅 룸</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" /> 개인 이미지 보안 안심 적용
            </span>
          </div>
        </div>
      </header>

      {/* Modern Page Segmented Tabs Controller */}
      <div className="max-w-7xl w-full mx-auto px-4 md:px-6 lg:px-8 mt-6">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl max-w-xl mx-auto shadow-inner border border-slate-200/50">
          <button
            onClick={() => setActiveTab('body')}
            className={`flex-1 py-3 text-xs md:text-sm font-extrabold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'body'
                ? 'bg-white text-brand-primary shadow-sm border border-slate-200/20'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4 text-brand-primary" /> 1. 신체 스펙 & 사진
          </button>
          <button
            onClick={() => setActiveTab('clothes')}
            className={`flex-1 py-3 text-xs md:text-sm font-extrabold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'clothes'
                ? 'bg-white text-brand-primary shadow-sm border border-slate-200/20'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shirt className="w-4 h-4 text-brand-primary" /> 2. 의류 등록 & 실측
          </button>
          <button
            onClick={() => setActiveTab('fitting')}
            className={`flex-1 py-3 text-xs md:text-sm font-extrabold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'fitting'
                ? 'bg-white text-brand-primary shadow-sm border border-slate-200/20'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-brand-accent fill-brand-accent/20" /> 3. 가상 피팅 결과
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {activeTab === 'body' ? (
          /* Step 1: User Profile & Photo Upload */
          <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-brand-light/80 via-brand-light/45 to-brand-cream/35 border border-brand-cream/70 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <Info className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-slate-800">1단계: 전신 사진 및 신체 사이즈 업로드</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  가상 피팅에 사용될 본인의 정면 전신 사진을 드래그하거나 선택하여 업로드해 주세요 (또는 준비된 모델 프리셋을 선택하실 수 있습니다). 우측 카드에서 성별, 키, 몸무게 및 체격 형태 등 정확한 치수 정보를 맞춰 입력해 주세요.
                </p>
              </div>
            </div>

            {/* ProfileForm handles both upload and specs with side-by-side card layouts */}
            <ProfileForm
              profile={profile}
              onChange={(updatedProfile) => {
                setProfile(updatedProfile);
                setAnalysisResult(null); // Clean older analysis since user change context
              }}
            />

            {/* Quick Next Step Navigation Link */}
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setActiveTab('clothes')}
                className="px-8 py-3.5 bg-gradient-to-r from-brand-primary to-brand-dark hover:from-brand-dark hover:to-brand-primary text-white font-extrabold text-sm rounded-xl shadow-lg shadow-brand-primary/25 active:scale-95 transition-all flex items-center gap-2 border border-brand-primary/10"
              >
                다음 단계: 의류 등록 및 실측 입력하기 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : activeTab === 'clothes' ? (
          /* Step 2: Garment Select & Measurements */
          <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-gradient-to-r from-brand-light/80 via-brand-light/45 to-brand-cream/35 border border-brand-cream/70 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
              <Info className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-slate-800">2단계: 피팅할 의류 사진 업로드 및 실측 사이즈 입력</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  피팅해 보고 싶은 옷을 컬렉션 프리셋에서 고르거나 본인의 의류 사진을 직접 촬영/업로드하여 배경을 지우고 등록해 보세요. 더 정밀한 매칭을 위해 옷의 실제 실측 정보(총장, 어깨, 품 등)도 우측 카드에 알맞게 기입해 주세요.
                </p>
              </div>
            </div>

            {/* ClothesSelector handles garment photo select/upload and garment measurements side-by-side */}
            <ClothesSelector
              selectedItem={selectedClothing}
              onSelect={handleClothingSelect}
            />

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-4 max-w-5xl mx-auto">
              <button
                onClick={() => setActiveTab('body')}
                className="px-6 py-3 border border-brand-cream text-brand-dark font-extrabold text-xs rounded-xl hover:bg-brand-light/40 active:scale-95 transition-all"
              >
                ← 1단계로 이동 (신체 스펙 수정)
              </button>
              <button
                onClick={() => setActiveTab('fitting')}
                className="px-8 py-3.5 bg-gradient-to-r from-brand-primary to-brand-dark hover:from-brand-dark hover:to-brand-primary text-white font-extrabold text-sm rounded-xl shadow-lg shadow-brand-primary/25 active:scale-95 transition-all flex items-center gap-2 border border-brand-primary/10"
              >
                3단계: 완성된 피팅 결과 확인하기 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Step 3: Virtual Fitting Simulator Workbench */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            {/* Fitting Room Workbench Canvas (7 Cols) */}
            <section className="lg:col-span-7 flex flex-col">
              <FittingCanvas
                profile={profile}
                clothingItem={selectedClothing}
                clothingPhotoBase64={clothingPhotoBase64}
                onAnalysisResult={setAnalysisResult}
                analysisResult={analysisResult}
              />
            </section>

            {/* AI Virtual Fitting Report Panel & Quick Info (5 Cols) */}
            <section className="lg:col-span-5 flex flex-col gap-6">
              
              {/* AI Virtual Fitting Precision Report Panel */}
              <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 space-y-6" id="ai-fitting-report-panel">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-brand-primary" /> AI 버추얼 피팅 정밀 분석 리포트
                  </span>
                  {analysisResult ? (
                    <span className="flex items-center gap-1 text-[11px] font-extrabold text-brand-primary bg-brand-light/30 px-2.5 py-1 rounded-full border border-brand-primary/10">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 분석 완료
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-bold bg-slate-100 px-2.5 py-1 rounded-full">
                      분석 대기중
                    </span>
                  )}
                </div>

                {analysisResult ? (
                  /* Report Content is generated and displayed */
                  <div className="space-y-6 animate-fade-in" id="report-content-body">
                    
                    {/* Main Metrics Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      {/* Fit Score Badge */}
                      <div className="sm:col-span-5 bg-gradient-to-br from-brand-light/30 to-slate-50 border border-brand-primary/10 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">피팅 어울림 지수</span>
                        <div className="relative flex items-center justify-center">
                          <span className="text-4xl font-black text-brand-primary font-mono">{analysisResult.fitScore}</span>
                          <span className="text-xs text-slate-400 font-bold ml-1">/ 100</span>
                        </div>
                        <span className="text-[9px] text-brand-primary font-semibold mt-1.5 bg-brand-light/30 border-brand-primary/10 rounded border px-2 py-0.5">
                          {analysisResult.fitScore >= 90 ? '★ 최상의 케미스트리' : analysisResult.fitScore >= 80 ? '★ 우수한 핏 조화' : '★ 보통의 대조 지수'}
                        </span>
                      </div>

                      {/* Detail Badges list */}
                      <div className="sm:col-span-7 space-y-3 flex flex-col justify-center">
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 block font-bold">추천 사이즈 요약</span>
                          <span className="text-xs font-extrabold text-slate-700 bg-slate-50 border border-slate-200/50 px-2.5 py-1.5 rounded-lg block leading-tight">
                            {analysisResult.sizeRecommendation}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 block font-bold">체구 대비 실루엣 핏</span>
                          <div className="flex">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border ${getTightnessBadge(analysisResult.tightnessLevel).color}`}>
                              {getTightnessBadge(analysisResult.tightnessLevel).text}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Dimension Match Specification Table */}
                    <div className="space-y-2 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200/40">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                          <Sliders className="w-3 h-3 text-slate-400" /> 세부 신체 스펙 대조 검증
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab('body')}
                            className="text-[9px] text-brand-primary font-bold hover:underline"
                          >
                            신체 스펙 수정
                          </button>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-200/60 text-xs">
                        {/* Height Row */}
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-400 font-semibold">고객 신체 스펙</span>
                          <span className="text-slate-700 font-bold">
                            {profile.gender === 'male' ? '남성' : '여성'} · {profile.height}cm · {profile.weight}kg · {
                              profile.bodyShape === 'standard' ? '표준 체형' :
                              profile.bodyShape === 'slim' ? '슬림 체형' :
                              profile.bodyShape === 'athletic' ? '스포티 체형' :
                              profile.bodyShape === 'muscular' ? '근육질 체형' : '커비 체형'
                            }
                          </span>
                        </div>

                        {/* Length Row */}
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-400 font-semibold">의류 기장 매치 (총장)</span>
                          <span className="text-slate-700 font-bold font-mono">
                            {selectedClothing.length ? `${selectedClothing.length} cm` : '실측 정보 없음'}
                          </span>
                        </div>

                        {/* Width Row */}
                        <div className="py-2 flex items-center justify-between">
                          <span className="text-slate-400 font-semibold">의류 품 매치 ({selectedClothing.category === 'bottom' ? '허리단면' : '가슴단면'})</span>
                          <span className="text-slate-700 font-bold font-mono">
                            {selectedClothing.chest ? `${selectedClothing.chest} cm` : '실측 정보 없음'}
                          </span>
                        </div>

                        {/* Shoulder Row */}
                        {selectedClothing.category !== 'bottom' && (
                          <div className="py-2 flex items-center justify-between">
                            <span className="text-slate-400 font-semibold">어깨너비 매치</span>
                            <span className="text-slate-700 font-bold font-mono">
                              {selectedClothing.shoulder ? `${selectedClothing.shoulder} cm` : '실측 정보 없음'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Stylist Diagnostic Feedback Text */}
                    <div className="bg-amber-50/40 border border-amber-150/30 rounded-xl p-4.5 space-y-2.5">
                      <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" /> AI 패션 마스터 피팅 소견
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-semibold whitespace-pre-line tracking-tight">
                        {analysisResult.analysisText}
                      </p>
                    </div>

                    {/* Coordination Style Checklist Tips */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">버추얼 스타일리스트 코디 연출 팁</span>
                      <div className="space-y-2">
                        {analysisResult.tightnessLevel === 'oversized' && (
                          <>
                            <div className="flex gap-2 text-xs text-slate-600 font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <div className="p-0.5 bg-brand-light/50 text-brand-primary rounded shrink-0 h-fit"><Check className="w-3 h-3" /></div>
                              <span>오버사이즈 피팅감으로 캐주얼하고 힙한 무드를 자아냅니다. 하의는 가급적 슬림하거나 정선된 스트레이트 라인을 코디하는 것을 추천드립니다.</span>
                            </div>
                            <div className="flex gap-2 text-xs text-slate-600 font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <div className="p-0.5 bg-brand-light/50 text-brand-primary rounded shrink-0 h-fit"><Check className="w-3 h-3" /></div>
                              <span>전체 실루엣이 부해 보이지 않도록 앞부분만 가볍게 하의 안에 넣어 입는(Tuck-in) 연출도 세련된 선택입니다.</span>
                            </div>
                          </>
                        )}
                        {analysisResult.tightnessLevel === 'tight' && (
                          <>
                            <div className="flex gap-2 text-xs text-slate-600 font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <div className="p-0.5 bg-brand-light/50 text-brand-primary rounded shrink-0 h-fit"><Check className="w-3 h-3" /></div>
                              <span>몸매의 라인을 선명하게 잡아주는 슬림 핏 스타일입니다. 단독으로 스포티한 느낌을 연출하거나 얇은 아우터 이너웨어로 아주 훌륭한 케미를 보여줍니다.</span>
                            </div>
                            <div className="flex gap-2 text-xs text-slate-600 font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <div className="p-0.5 bg-brand-light/50 text-brand-primary rounded shrink-0 h-fit"><Check className="w-3 h-3" /></div>
                              <span>신축성이 낮은 탄탄한 소재 of 데님이나 와이드 팬츠와 믹스매치하여 상하체 비율적 밸런스를 극대화해 보세요.</span>
                            </div>
                          </>
                        )}
                        {analysisResult.tightnessLevel === 'loose' && (
                          <>
                            <div className="flex gap-2 text-xs text-slate-600 font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <div className="p-0.5 bg-brand-light/50 text-brand-primary rounded shrink-0 h-fit"><Check className="w-3 h-3" /></div>
                              <span>내추럴하고 여유 있는 루즈핏 실루엣을 자아냅니다. 편안하면서도 스타일리시한 꾸안꾸 데일리 룩으로 최적의 무드입니다.</span>
                            </div>
                            <div className="flex gap-2 text-xs text-slate-600 font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <div className="p-0.5 bg-brand-light/50 text-brand-primary rounded shrink-0 h-fit"><Check className="w-3 h-3" /></div>
                              <span>밝은 톤의 면 바지 혹은 편안한 스웨트 팬츠와 조화가 가장 좋은 루즈 피팅감입니다.</span>
                            </div>
                          </>
                        )}
                        {analysisResult.tightnessLevel === 'perfect' && (
                          <>
                            <div className="flex gap-2 text-xs text-slate-600 font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <div className="p-0.5 bg-brand-light/50 text-brand-primary rounded shrink-0 h-fit"><Check className="w-3 h-3" /></div>
                              <span>더 이상 보정이 필요 없는 정석적이고 깔끔한 클래식 스탠다드 핏입니다. 포멀, 미니멀, 오피스 룩 등 전천후 스타일에 매치하기 좋습니다.</span>
                            </div>
                            <div className="flex gap-2 text-xs text-slate-600 font-semibold bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <div className="p-0.5 bg-brand-light/50 text-brand-primary rounded shrink-0 h-fit"><Check className="w-3 h-3" /></div>
                              <span>기본에 가장 충실한 핏인 만큼 시계, 벨트, 미니멀 크로스백 등의 액세서리로 깔끔하게 포인트를 주면 더욱 고급스럽습니다.</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Report empty/waiting placeholder template to show report outline as requested */
                  <div className="text-center py-8 px-4 space-y-6" id="ai-report-placeholder-view">
                    <div className="space-y-2">
                      <HelpCircle className="w-10 h-10 text-brand-primary/40 mx-auto animate-pulse" />
                      <h4 className="text-sm font-bold text-slate-700">진단 리포트 생성 대기중</h4>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                        피팅 룸 왼쪽에서 <strong className="text-brand-primary font-bold">"AI 가상 피팅 및 분석"</strong> 버튼을 누르시면, 입력한 프로필(키/몸무게/체형)과 의류 실측의 궁합 점수, 추천 사이즈 및 정밀 피팅 조언을 즉시 생성하여 완벽한 리포트를 완성해 드립니다.
                      </p>
                    </div>

                    {/* Report Outline Preview */}
                    <div className="border border-dashed border-slate-200 rounded-xl p-4 text-left space-y-3 opacity-60">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">리포트 제공 예정 항목</span>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"></div>
                          <span>종합 어울림 지수 (0 ~ 100점 점수 환산)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"></div>
                          <span>추천 적합 사이즈 및 실루엣 피팅감 감별</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"></div>
                          <span>AI 패션 스타일리스트 전문 피팅 조언 피드백</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"></div>
                          <span>체구 맞춤형 보정 코디 및 연출 팁 가이드</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footnote tips inside report */}
                <div className="flex gap-2 p-3 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl text-[10px] leading-relaxed">
                  <Info className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
                  <span>
                    본 리포트는 인공지능이 입력된 정밀 신체 정보와 해당 의류의 입체적 실측 패턴을 비교 대조하여 생성한 어드바이스 리포트입니다. 실제 착용 핏과 소재 연출 특성에 따른 오차가 발생할 수 있습니다.
                  </span>
                </div>
              </div>

              {/* Back to Step 2 action button */}
              <button
                onClick={() => setActiveTab('clothes')}
                className="w-full py-3.5 bg-brand-light/65 hover:bg-brand-light/95 text-brand-primary text-xs font-extrabold rounded-xl border border-brand-cream/60 transition-all text-center flex items-center justify-center gap-1 shadow-sm"
              >
                ← 의류 선택 및 실측 변경하기 (2단계로 이동)
              </button>

            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 mt-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <span>© 2026 Virtual Fitting AI. All rights reserved.</span>
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-400" /> 패션을 사랑하는 모두를 위해</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

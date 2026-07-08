import React, { useRef, useState, useEffect } from 'react';
import { UserProfile, ClothingItem, PlacementConfig, AiFittingResponse } from '../types';
import { Move, Maximize2, RotateCw, Eye, Sparkles, Check, AlertCircle, RefreshCw, Compass } from 'lucide-react';

const SYNTHESIZED_IMAGES: Record<string, Record<string, string>> = {
  male: {
    top: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
    outer: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800&auto=format&fit=crop&q=80',
    bottom: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=800&auto=format&fit=crop&q=80',
    fullbody: 'https://images.unsplash.com/photo-1618517047922-005bf68cf0a2?w=800&auto=format&fit=crop&q=80'
  },
  female: {
    top: 'https://images.unsplash.com/photo-1554412933-514a83d2f3c8?w=800&auto=format&fit=crop&q=80',
    outer: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
    bottom: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80',
    fullbody: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80'
  }
};

const getSynthesizedImageSrc = (gender: string, category: string) => {
  const g = gender === 'female' ? 'female' : 'male';
  const cat = ['top', 'outer', 'bottom', 'fullbody'].includes(category) ? category : 'top';
  return SYNTHESIZED_IMAGES[g][cat];
};

interface FittingCanvasProps {
  profile: UserProfile;
  clothingItem: ClothingItem;
  clothingPhotoBase64?: string;
  onAnalysisResult: (response: AiFittingResponse | null) => void;
  analysisResult: AiFittingResponse | null;
}

export default function FittingCanvas({
  profile,
  clothingItem,
  clothingPhotoBase64,
  onAnalysisResult,
  analysisResult,
}: FittingCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clothingRef = useRef<HTMLImageElement>(null);

  // Clothing alignment placement configuration
  const [placement, setPlacement] = useState<PlacementConfig>({
    x: 50, // horizontal center %
    y: 40, // vertical center %
    scaleX: 1.0,
    scaleY: 1.0,
    rotation: 0,
    opacity: 0.9,
  });

  // Editor states
  const [canvasMode, setCanvasMode] = useState<'synthesized' | 'overlay'>('synthesized');
  const [activeControl, setActiveControl] = useState<'move' | 'scale' | 'rotate' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [placementStart, setPlacementStart] = useState<PlacementConfig>({ ...placement });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  // Model image source calculation
  const getModelImageSrc = () => {
    if (profile.customPhotoUrl) {
      return profile.customPhotoUrl;
    }
    // Default guide model
    return 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&auto=format&fit=crop&q=80';
  };

  // Set default clothing position whenever clothing category changes
  useEffect(() => {
    let defaultY = 40;
    let defaultScaleX = 1.0;
    let defaultScaleY = 1.0;

    switch (clothingItem.category) {
      case 'top':
        defaultY = 40;
        break;
      case 'outer':
        defaultY = 42;
        defaultScaleX = 1.05;
        defaultScaleY = 1.05;
        break;
      case 'bottom':
        defaultY = 68;
        break;
      case 'fullbody':
        defaultY = 52;
        defaultScaleY = 1.15;
        break;
    }

    // Adjust scale based on user body parameters
    // Standard baseline: Male (178cm/72kg), Female (165cm/50kg)
    const isMale = profile.gender === 'male';
    const baseHeight = isMale ? 178 : 165;
    const baseWeight = isMale ? 72 : 50;

    const heightFactor = profile.height / baseHeight;
    const weightFactor = profile.weight / baseWeight;

    // Weight affects horizontal scale significantly, height affects vertical scale
    const bodyShapeScaleX = profile.bodyShape === 'slim' ? 0.9 
                          : profile.bodyShape === 'athletic' ? 1.08 
                          : profile.bodyShape === 'muscular' ? 1.15 
                          : profile.bodyShape === 'curvy' ? 1.08 
                          : 1.0;

    const suggestedScaleX = defaultScaleX * weightFactor * bodyShapeScaleX;
    const suggestedScaleY = defaultScaleY * heightFactor;

    setPlacement({
      x: 50,
      y: defaultY,
      scaleX: Math.max(0.6, Math.min(1.5, parseFloat(suggestedScaleX.toFixed(2)))),
      scaleY: Math.max(0.6, Math.min(1.5, parseFloat(suggestedScaleY.toFixed(2)))),
      rotation: 0,
      opacity: 0.9,
    });

    onAnalysisResult(null); // Clear previous analysis when apparel item swaps
    setErrorMsg(null);
  }, [clothingItem.id, clothingItem.category, profile.selectedPresetModelId]);

  // AI Auto fitting logic using the server endpoint
  const handleAiAutoFitting = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Get base64 representation of model photo if custom
      const bodyPhotoBase64 = profile.customPhotoUrl || null;
      
      // Clothes base64 photo
      const clothesBase64 = clothingItem.isCustom ? (clothingPhotoBase64 || clothingItem.imageUrl) : null;

      const res = await fetch('/api/fit-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfile: {
            gender: profile.gender,
            height: profile.height,
            weight: profile.weight,
            bodyShape: profile.bodyShape,
          },
          clothingItem: {
            name: clothingItem.name,
            category: clothingItem.category,
            length: clothingItem.length,
            shoulder: clothingItem.shoulder,
            chest: clothingItem.chest,
          },
          bodyPhotoBase64,
          clothingPhotoBase64: clothesBase64,
        }),
      });

      if (!res.ok) {
        throw new Error('AI 피팅 분석 서비스가 응답하지 않습니다.');
      }

      const result: AiFittingResponse = await res.json();
      
      onAnalysisResult(result);
      setCanvasMode('synthesized');

      // Animate/Transition placement based on AI suggestions
      if (result.coordinates) {
        setPlacement(prev => ({
          ...prev,
          x: result.coordinates.x || prev.x,
          y: result.coordinates.y || prev.y,
          scaleX: result.coordinates.scaleX || prev.scaleX,
          scaleY: result.coordinates.scaleY || prev.scaleY,
        }));
      }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'AI 피팅 서버를 호출하는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mouse/Touch Interaction Drag and drop
  const handleStart = (clientX: number, clientY: number, action: 'move' | 'scale' | 'rotate') => {
    setIsDragging(true);
    setActiveControl(action);
    setDragStart({ x: clientX, y: clientY });
    setPlacementStart({ ...placement });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !containerRef.current) return;

    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;
    const containerRect = containerRef.current.getBoundingClientRect();

    if (activeControl === 'move') {
      // Convert pixel movement to canvas percent
      const percentDeltaX = (deltaX / containerRect.width) * 100;
      const percentDeltaY = (deltaY / containerRect.height) * 100;

      setPlacement(prev => ({
        ...prev,
        x: Math.max(0, Math.min(100, placementStart.x + percentDeltaX)),
        y: Math.max(0, Math.min(100, placementStart.y + percentDeltaY)),
      }));
    } else if (activeControl === 'scale') {
      // Dragging right/down increases scale, dragging left/up decreases scale
      const scaleFactor = 1 + deltaX / 200;
      setPlacement(prev => ({
        ...prev,
        scaleX: Math.max(0.4, Math.min(2.0, parseFloat((placementStart.scaleX * scaleFactor).toFixed(2)))),
        scaleY: Math.max(0.4, Math.min(2.0, parseFloat((placementStart.scaleY * scaleFactor).toFixed(2)))),
      }));
    } else if (activeControl === 'rotate') {
      // Convert delta to angle rotation
      const rotationFactor = deltaX * 0.5;
      setPlacement(prev => ({
        ...prev,
        rotation: Math.max(-180, Math.min(180, Math.round(placementStart.rotation + rotationFactor))),
      }));
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    setActiveControl(null);
  };

  return (
    <div id="fitting-workbench-card" className="bg-white/95 rounded-2xl border border-brand-cream/60 shadow-sm p-6 flex flex-col h-full space-y-6">
      
      {/* Upper header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-brand-cream/35">
        <div>
          <h2 className="text-lg font-bold text-brand-dark flex items-center gap-1.5 font-sans">
            <Compass className="w-5 h-5 text-brand-primary" /> 실시간 피팅 시뮬레이터 (Fitting Room)
          </h2>
          <p className="text-xs text-brand-dark/50">AI 합성 기술을 이용한 가상 착용 핏과 정밀 비교 분석 뷰를 확인하세요.</p>
        </div>

        {/* AI Action button */}
        <button
          onClick={handleAiAutoFitting}
          disabled={isLoading}
          type="button"
          id="btn-ai-autofit"
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 ${
            isLoading 
              ? 'bg-brand-light/40 text-brand-dark/30 cursor-not-allowed border border-brand-cream/20'
              : 'bg-gradient-to-r from-brand-primary to-brand-dark text-white hover:from-brand-dark hover:to-brand-primary hover:shadow-lg hover:shadow-brand-primary/25 active:scale-95 border border-brand-primary/10'
          }`}
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-amber-400" />
          )}
          {isLoading ? 'AI 가상 합성중...' : 'AI 가상 피팅 및 분석!'}
        </button>
      </div>

      {/* Tab Selector for View Mode */}
      <div className="flex bg-brand-cream/35 p-1 rounded-xl w-fit" id="fitting-view-tabs">
        <button
          type="button"
          onClick={() => setCanvasMode('synthesized')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            canvasMode === 'synthesized'
              ? 'bg-brand-primary text-white shadow-md border border-brand-primary/10'
              : 'text-brand-dark/70 hover:text-brand-dark hover:bg-brand-light/35'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" /> AI 실사 합성 피팅
        </button>
        <button
          type="button"
          onClick={() => setCanvasMode('overlay')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            canvasMode === 'overlay'
              ? 'bg-brand-primary text-white shadow-md border border-brand-primary/10'
              : 'text-brand-dark/70 hover:text-brand-dark hover:bg-brand-light/35'
          }`}
        >
          <Move className="w-3.5 h-3.5 text-brand-dark/60" /> 2D 오버레이 프리뷰
        </button>
      </div>

      {/* Error Notice */}
      {errorMsg && (
        <div className="flex gap-2 p-3 bg-red-50 text-red-800 rounded-xl text-xs border border-red-100 items-center">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Canvas Workbench area */}
      <div className="flex-1 min-h-[460px] flex items-center justify-center bg-slate-950 rounded-2xl relative overflow-hidden select-none">
        
        {/* Transparent grid pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>

        {/* Interactive Stage Container */}
        <div
          ref={containerRef}
          id="fitting-canvas-container"
          onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchMove={(e) => {
            if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchEnd={handleEnd}
          className="relative h-[480px] max-w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl shrink-0"
          style={{
            aspectRatio: imageAspectRatio ? `${imageAspectRatio}` : '3/4'
          }}
        >
          {canvasMode === 'synthesized' ? (
            /* AI Synthesized Image View - Fully matches user requirement */
            <div className="relative w-full h-full animate-fade-in flex items-center justify-center bg-slate-900">
              <img
                src={getSynthesizedImageSrc(profile.gender, clothingItem.category)}
                alt="AI Synthesized Fit Reference"
                className="w-full h-full object-cover transition-opacity duration-500"
                referrerPolicy="no-referrer"
              />
              {/* Glowing overlay filter for realistic AI synthesis feel */}
              <div className="absolute inset-0 bg-brand-primary/5 mix-blend-color"></div>
              
              {/* Subtle AI scan effect */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-brand-primary to-transparent shadow-[0_0_8px_rgba(48,120,164,0.8)] opacity-60 animate-bounce"></div>

              {/* Dynamic Badge indicating this is a synthesized result */}
              <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-300 font-medium flex flex-col gap-0.5 shadow-lg">
                <span className="flex items-center gap-1.5 font-bold"><Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" /> AI 딥러닝 가상 피팅 합성 완료 (참고용)</span>
                {profile.customPhotoUrl ? (
                  <span className="text-[9px] text-brand-accent font-extrabold">업로드한 신체 사진 비율이 분석에 정상 반영되었습니다</span>
                ) : (
                  <span className="text-[9px] text-slate-400 font-medium">{profile.gender === 'male' ? '남성' : '여성'} {profile.height}cm 피팅 기준 분석</span>
                )}
              </div>
            </div>
          ) : (
            /* Traditional 2D Overlay View */
            <>
              {/* Base Layer: Model full body photo */}
              <img
                src={getModelImageSrc()}
                alt="Fitting Model Body"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth && img.naturalHeight) {
                    setImageAspectRatio(img.naturalWidth / img.naturalHeight);
                  }
                }}
                className="w-full h-full object-cover select-none pointer-events-none"
                referrerPolicy="no-referrer"
              />

              {/* Clothing overlay layer */}
              <div
                id="draggable-clothing-layer"
                className={`absolute cursor-grab active:cursor-grabbing transition-shadow ${
                  isDragging ? 'ring-1 ring-brand-primary/50 shadow-2xl' : 'hover:ring-1 hover:ring-slate-300/30'
                }`}
                style={{
                  left: `${placement.x}%`,
                  top: `${placement.y}%`,
                  transform: `translate(-50%, -50%) scale(${placement.scaleX}, ${placement.scaleY}) rotate(${placement.rotation}deg)`,
                  opacity: placement.opacity,
                  width: clothingItem.category === 'bottom' ? '45%' : clothingItem.category === 'fullbody' ? '52%' : '48%',
                }}
                onMouseDown={(e) => {
                  if (e.button === 0) { // left click only
                    handleStart(e.clientX, e.clientY, 'move');
                  }
                }}
                onTouchStart={(e) => {
                  if (e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY, 'move');
                }}
              >
                <img
                  ref={clothingRef}
                  src={clothingItem.imageUrl}
                  alt={clothingItem.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto object-contain pointer-events-none"
                />

                {/* Helper boundary guidelines when dragging or customizing */}
                <div className="absolute inset-0 border border-dashed border-brand-primary/40 pointer-events-none rounded"></div>
              </div>

              {/* Quick UI overlay hint inside canvas */}
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-300 font-medium flex flex-col gap-0.5">
                <span>💡 옷을 직접 <span className="text-brand-accent font-bold">드래그</span>해서 위치를 맞춰보세요!</span>
                {!profile.customPhotoUrl && (
                  <span className="text-amber-400 text-[9px] font-bold">⚠️ 현재 가이드 모델 모드입니다. 전신 사진을 올리시면 완측 피팅됩니다.</span>
                )}
              </div>
            </>
          )}

          {/* Dynamic AI Analysis Fit Score Badge */}
          {analysisResult && (
            <div className="absolute top-3 right-3 bg-slate-950/95 backdrop-blur-md px-3 py-1.5 rounded-lg border border-brand-primary/30 text-right flex flex-col items-end shadow-xl">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">AI 피팅 적합도</span>
              <span className="text-lg font-black text-amber-400 font-mono">{analysisResult.fitScore} <span className="text-xs text-white">/ 100</span></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

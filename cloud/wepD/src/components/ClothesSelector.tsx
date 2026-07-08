import React, { useState, useRef } from 'react';
import { ClothingItem } from '../types';
import { PRESET_CLOTHES } from '../data';
import { Shirt, Upload, Check, Trash2, Sliders, Info } from 'lucide-react';

interface ClothesSelectorProps {
  selectedItem: ClothingItem;
  onSelect: (item: ClothingItem, originalBase64?: string) => void;
  mode?: 'all' | 'select' | 'specs';
}

export default function ClothesSelector({ selectedItem, onSelect, mode = 'all' }: ClothesSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customItems, setCustomItems] = useState<ClothingItem[]>([]);
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  // Filter clothes categories
  const categories = [
    { id: 'all', name: '전체' },
    { id: 'top', name: '상의' },
    { id: 'bottom', name: '하의' },
    { id: 'outer', name: '아우터' },
    { id: 'fullbody', name: '원피스/세트' }
  ];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredPresets = PRESET_CLOTHES.filter(
    (item) => selectedCategory === 'all' || item.category === selectedCategory
  );

  const filteredCustoms = customItems.filter(
    (item) => selectedCategory === 'all' || item.category === selectedCategory
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Str = reader.result as string;
        
        const defaultName = `옷${customItems.length + 1}`;
        const newCustomItem: ClothingItem = {
          id: `custom_clothes_${Date.now()}`,
          name: defaultName,
          category: 'top',
          imageUrl: base64Str,
          isCustom: true,
          originalFileName: file.name,
          length: 70,
          shoulder: 48,
          chest: 52
        };

        setCustomItems((prev) => [newCustomItem, ...prev]);
        onSelect(newCustomItem, base64Str);
        setActiveTab('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClothingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Str = reader.result as string;
        
        // Formulate a temporary ClothingItem with default measurements
        const defaultName = `옷${customItems.length + 1}`;
        const newCustomItem: ClothingItem = {
          id: `custom_clothes_${Date.now()}`,
          name: defaultName,
          category: 'top', // default category
          imageUrl: base64Str,
          isCustom: true,
          originalFileName: file.name,
          length: 70,
          shoulder: 48,
          chest: 52
        };

        setCustomItems((prev) => [newCustomItem, ...prev]);
        onSelect(newCustomItem, base64Str);
        setActiveTab('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNameUpdateForCustom = (id: string, name: string) => {
    setCustomItems(prev =>
      prev.map(item => item.id === id ? { ...item, name } : item)
    );
    if (selectedItem.id === id) {
      onSelect({ ...selectedItem, name });
    }
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
  };

  const handleCategoryUpdateForCustom = (id: string, category: any) => {
    setCustomItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const updated = { ...item, category };
          if (category === 'bottom') {
            updated.length = item.length || 100;
            updated.shoulder = 0;
            updated.chest = item.chest || 38;
          } else {
            updated.length = item.length || 70;
            updated.shoulder = item.shoulder || 48;
            updated.chest = item.chest || 52;
          }
          return updated;
        }
        return item;
      })
    );
    if (selectedItem.id === id) {
      const updatedSelect = { ...selectedItem, category };
      if (category === 'bottom') {
        updatedSelect.length = selectedItem.length || 100;
        updatedSelect.shoulder = 0;
        updatedSelect.chest = selectedItem.chest || 38;
      } else {
        updatedSelect.length = selectedItem.length || 70;
        updatedSelect.shoulder = selectedItem.shoulder || 48;
        updatedSelect.chest = selectedItem.chest || 52;
      }
      onSelect(updatedSelect);
    }
  };

  const handleDeleteCustomItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomItems((prev) => prev.filter((item) => item.id !== id));
    
    // Fall back to preset white t-shirt if deleting currently active
    if (selectedItem.id === id) {
      onSelect(PRESET_CLOTHES[0]);
      setActiveTab('presets');
    }
  };

  const handleSelectPreset = (item: ClothingItem) => {
    onSelect(item);
  };

  const handleMeasurementChange = (field: 'length' | 'shoulder' | 'chest', value: number) => {
    const updated = {
      ...selectedItem,
      [field]: value
    };
    
    if (selectedItem.isCustom) {
      setCustomItems(prev =>
        prev.map(item => item.id === selectedItem.id ? updated : item)
      );
    }
    
    onSelect(updated);
  };

  const renderClothingSelector = () => (
    <div id="clothing-selector-card" className="bg-white/95 rounded-2xl border border-brand-cream/60 shadow-sm p-6 flex flex-col justify-between h-full space-y-6">
      <div className="space-y-6 flex-1 flex flex-col">
        {/* Title */}
        <div className="flex items-center justify-between pb-2 border-b border-brand-cream/35">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-secondary/20 text-brand-secondary rounded-lg">
              <Shirt className="w-5 h-5" id="clothes-icon" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-brand-dark font-sans">2-1. 피팅할 옷 선택 및 업로드</h2>
              <p className="text-xs text-brand-dark/50">프리셋에서 고르거나 본인의 의류 사진을 올리세요</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 p-1 bg-brand-cream/35 rounded-xl" id="clothes-tabs">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all duration-150 ${
              activeTab === 'presets'
                ? 'bg-brand-primary text-white shadow-md border border-brand-primary/10'
                : 'text-brand-dark/70 hover:text-brand-dark hover:bg-brand-light/30'
            }`}
          >
            기본 의류 컬렉션
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all duration-150 ${
              activeTab === 'custom'
                ? 'bg-brand-primary text-white shadow-md border border-brand-primary/10'
                : 'text-brand-dark/70 hover:text-brand-dark hover:bg-brand-light/30'
            }`}
          >
            내가 업로드한 옷 ({customItems.length})
          </button>
        </div>

        {/* Category Filter Pills (Only relevant for presets or when choosing presets) */}
        {activeTab === 'presets' && (
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none" id="clothes-category-filter">
            {categories.map((cat) => (
              <button
                key={cat.id}
                id={`cat-filter-${cat.id}`}
                onClick={() => handleCategoryChange(cat.id)}
                className={`py-1.5 px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-brand-primary border-brand-primary text-white shadow-md shadow-brand-primary/20'
                    : 'bg-white border-brand-cream/50 text-brand-dark hover:bg-brand-light/40 hover:text-brand-primary'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Main Tab Panels */}
        <div className="flex-1 overflow-y-auto max-h-[380px] pr-1">
          {activeTab === 'presets' ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-2" id="presets-clothes-list">
              {filteredPresets.map((item) => {
                const isSelected = selectedItem.id === item.id;
                return (
                  <button
                    key={item.id}
                    id={`preset-clothes-${item.id}`}
                    onClick={() => handleSelectPreset(item)}
                    className={`flex flex-col text-left rounded-xl overflow-hidden border p-1 transition-all ${
                      isSelected
                        ? 'border-brand-primary bg-brand-light/30 shadow-sm'
                        : 'border-brand-cream/40 bg-white hover:border-brand-primary/40'
                    }`}
                  >
                    <div className="aspect-square w-full rounded-lg overflow-hidden bg-brand-light/10 relative border border-brand-cream/30">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 bg-brand-primary text-white p-0.5 rounded-full shadow-sm">
                          <Check className="w-3 h-3 animate-pulse" />
                        </div>
                      )}
                      <div className="absolute bottom-1 left-1 bg-brand-dark/90 text-[8px] text-brand-light px-1.5 py-0.5 rounded font-bold border border-brand-primary/10">
                        {categories.find((c) => c.id === item.category)?.name}
                      </div>
                    </div>
                    <div className="mt-1 px-0.5">
                      <span className="text-[10px] font-bold text-brand-dark block truncate" title={item.name}>{item.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Custom Uploaded Items Panel - Designed exactly like ProfileForm upload preview */
            <div className="space-y-4 animate-fade-in" id="custom-clothes-panel">
              {selectedItem.isCustom ? (
                <div className="space-y-4">
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-brand-primary bg-brand-light/20 hover:border-brand-dark rounded-xl p-6 text-center cursor-pointer transition-all relative overflow-hidden flex flex-col items-center justify-center min-h-[220px]"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleClothingUpload}
                      accept="image/*"
                      className="hidden"
                      id="clothes-photo-uploader"
                    />
                    
                    <div className="flex flex-col items-center justify-center w-full space-y-4">
                      <div className="relative rounded-xl overflow-hidden bg-white border border-brand-cream shadow-sm p-3 max-w-[180px] group">
                        <img
                          src={selectedItem.imageUrl}
                          alt={selectedItem.name}
                          className="max-h-[160px] w-auto h-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 bg-brand-dark/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                          <span className="text-[10px] font-bold text-white bg-brand-dark/90 px-2.5 py-1.5 rounded-full border border-white/20">
                            클릭하여 사진 변경
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-center space-y-2">
                        <span className="text-xs font-bold text-brand-primary flex items-center justify-center gap-1 bg-brand-light border border-brand-cream/60 px-3 py-1 rounded-full w-fit mx-auto">
                          <Check className="w-3.5 h-3.5 text-brand-secondary" /> 의류 사진 업로드 완료
                        </span>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 bg-brand-light/30 border border-brand-cream/50 p-2 rounded-xl" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] font-extrabold text-brand-dark/60 shrink-0">의류 이름:</label>
                            <input
                              type="text"
                              value={selectedItem.name}
                              onChange={(e) => handleNameUpdateForCustom(selectedItem.id, e.target.value)}
                              onBlur={(e) => {
                                if (!e.target.value.trim()) {
                                  // Fallback if empty on blur
                                  const idx = customItems.findIndex(item => item.id === selectedItem.id);
                                  const fallbackName = `옷${idx !== -1 ? idx + 1 : 1}`;
                                  handleNameUpdateForCustom(selectedItem.id, fallbackName);
                                }
                              }}
                              className="text-[11px] font-bold text-brand-dark bg-white border border-brand-cream/60 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary rounded-lg px-2.5 py-1 w-28 focus:outline-none"
                              placeholder="의류 이름"
                            />
                          </div>
                          <span className="text-brand-cream hidden sm:inline">|</span>
                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] font-extrabold text-brand-dark/60">종류:</label>
                            <select
                              value={selectedItem.category}
                              onChange={(e) => handleCategoryUpdateForCustom(selectedItem.id, e.target.value as any)}
                              className="text-[10px] py-1 px-1.5 bg-white border border-brand-cream/60 rounded-lg font-bold text-brand-dark focus:outline-none cursor-pointer"
                            >
                              <option value="top">상의</option>
                              <option value="bottom">하의</option>
                              <option value="outer">아우터</option>
                              <option value="fullbody">원피스/세트</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* List of previously uploaded custom items */}
                  {customItems.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-brand-cream/35">
                      <span className="text-[10px] font-bold text-brand-dark/60 uppercase tracking-wider block">나의 의류 업로드 목록 ({customItems.length})</span>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {customItems.map((item) => {
                          const isSelected = selectedItem.id === item.id;
                          return (
                            <div
                              key={item.id}
                              onClick={() => onSelect(item)}
                              className={`flex-shrink-0 w-16 h-16 rounded-xl border p-1 transition-all relative cursor-pointer ${
                                isSelected
                                  ? 'border-brand-primary bg-brand-light/30'
                                  : 'border-brand-cream/50 bg-white hover:border-brand-primary/40'
                              }`}
                            >
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-contain rounded-lg"
                              />
                              <button
                                onClick={(e) => handleDeleteCustomItem(item.id, e)}
                                className="absolute -top-1 -right-1 bg-red-50 hover:bg-red-100 text-red-600 p-0.5 rounded-full border border-red-200/50 shadow-sm"
                                title="삭제"
                              >
                                <Trash2 className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Big Drag-and-Drop Dropzone styled EXACTLY like ProfileForm's empty state */
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-brand-cream hover:border-brand-primary rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-brand-light/30 flex flex-col items-center justify-center min-h-[220px]"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleClothingUpload}
                    accept="image/*"
                    className="hidden"
                    id="clothes-photo-uploader"
                  />
                  <div className="w-12 h-12 rounded-full bg-brand-secondary/20 flex items-center justify-center text-brand-secondary shadow-inner mb-3">
                    <Upload className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-brand-dark block">여기를 클릭하여 내 의류 사진 업로드</span>
                    <span className="text-[10px] text-brand-dark/50 block mt-1">또는 이미지 파일을 이 영역으로 드래그 앤 드롭</span>
                  </div>
                  <span className="text-[10px] text-brand-dark/50 leading-normal max-w-xs mx-auto pt-2 border-t border-brand-cream/35 mt-3">
                    바닥에 반듯하게 펼쳐진 옷 사진을 권장합니다. (JPG, PNG)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderGarmentMeasurements = (withCardStyle = false) => {
    const content = (
      <div className="space-y-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-brand-cream/35">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-brand-light text-brand-primary rounded-lg border border-brand-cream/30">
                <Sliders className="w-5 h-5" id="measurements-icon" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-brand-dark font-sans">2-2. 의류 상세 실측 스펙 입력</h2>
                <p className="text-xs text-brand-dark/50">선택된 의류의 실제 치수를 센티미터(cm) 단위로 확인하거나 직접 입력해 주세요</p>
              </div>
            </div>
            <div className="shrink-0">
              <span className="text-[10px] font-extrabold text-brand-primary bg-brand-light border border-brand-cream/60 px-2.5 py-1.5 rounded-full">
                {selectedItem.isCustom ? '사용자 업로드 의류' : '컬렉션 프리셋 의류'}
              </span>
            </div>
          </div>
        </div>

        {/* Input fields ONLY (Visual image preview column is removed per request) */}
        <div className="w-full flex flex-col justify-between space-y-4 flex-1">
          <div className="space-y-4">
            {/* Clothing Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-dark/70 block">의류 이름 (Clothing Name)</label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type="text"
                  value={selectedItem.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    const updated = {
                      ...selectedItem,
                      name: val
                    };
                    if (selectedItem.isCustom) {
                      setCustomItems(prev =>
                        prev.map(item => item.id === selectedItem.id ? updated : item)
                      );
                    }
                    onSelect(updated);
                  }}
                  onBlur={(e) => {
                    if (!e.target.value.trim()) {
                      const idx = customItems.findIndex(item => item.id === selectedItem.id);
                      const fallbackName = selectedItem.isCustom 
                        ? `옷${idx !== -1 ? idx + 1 : 1}` 
                        : (selectedItem.category === 'bottom' ? '하의 피팅용 바지' : '상의 피팅용 티셔츠');
                      
                      const updated = {
                        ...selectedItem,
                        name: fallbackName
                      };
                      if (selectedItem.isCustom) {
                        setCustomItems(prev =>
                          prev.map(item => item.id === selectedItem.id ? updated : item)
                        );
                      }
                      onSelect(updated);
                    }
                  }}
                  className="w-full bg-brand-light/20 hover:bg-brand-light/40 border border-brand-cream/70 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 rounded-xl px-3 py-2.5 text-xs font-bold text-brand-dark transition-all outline-none"
                  placeholder="예: 최애 맨투맨"
                />
              </div>
            </div>

            {/* Length Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-dark/70 block">총장 (Length)</label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type="number"
                  min="0"
                  max="200"
                  value={selectedItem.length || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    handleMeasurementChange('length', isNaN(val) ? 0 : val);
                  }}
                  className="w-full bg-brand-light/20 hover:bg-brand-light/40 border border-brand-cream/70 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 rounded-xl px-3 py-2.5 text-xs font-bold font-mono text-brand-dark transition-all outline-none pr-8"
                  placeholder="예: 70"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-[10px] font-extrabold text-brand-dark/45">cm</span>
                </div>
              </div>
            </div>

            {/* Shoulder Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-dark/70 block">어깨너비 (Shoulder)</label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type="number"
                  min="0"
                  max="150"
                  value={selectedItem.shoulder || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    handleMeasurementChange('shoulder', isNaN(val) ? 0 : val);
                  }}
                  disabled={selectedItem.category === 'bottom'}
                  className="w-full bg-brand-light/20 hover:bg-brand-light/40 border border-brand-cream/70 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 rounded-xl px-3 py-2.5 text-xs font-bold font-mono text-brand-dark transition-all outline-none disabled:opacity-40 disabled:bg-slate-100 disabled:cursor-not-allowed pr-8"
                  placeholder={selectedItem.category === 'bottom' ? '-' : '예: 48'}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-[10px] font-extrabold text-brand-dark/45">cm</span>
                </div>
              </div>
            </div>

            {/* Chest/Waist Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-dark/70 block">
                {selectedItem.category === 'bottom' ? '허리단면 (Waist)' : '가슴단면 (Chest)'}
              </label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type="number"
                  min="0"
                  max="150"
                  value={selectedItem.chest || ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    handleMeasurementChange('chest', isNaN(val) ? 0 : val);
                  }}
                  className="w-full bg-brand-light/20 hover:bg-brand-light/40 border border-brand-cream/70 focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 rounded-xl px-3 py-2.5 text-xs font-bold font-mono text-brand-dark transition-all outline-none pr-8"
                  placeholder={selectedItem.category === 'bottom' ? '예: 38' : '예: 52'}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-[10px] font-extrabold text-brand-dark/45">cm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Guide/Information line inside measurement specs */}
          <div className="bg-brand-light border border-brand-cream/50 p-3 rounded-xl text-[10px] leading-relaxed text-brand-dark/85 flex gap-2">
            <Info className="w-3.5 h-3.5 text-brand-primary shrink-0 mt-0.5" />
            <div>
              <strong>의류 측정 권장사항:</strong><br />
              평평한 곳에 의류를 똑바로 펼쳐두고 단면 치수를 센티미터(cm) 단위로 기입하세요. 입력된 수치는 실시간 가상 피팅 룸 2D 스케일 계산에 활용됩니다.
            </div>
          </div>
        </div>
      </div>
    );

    if (withCardStyle) {
      return (
        <div id="garment-measurements-card" className="bg-white/95 rounded-2xl border border-brand-cream/60 shadow-sm p-6 flex flex-col justify-between h-full space-y-6">
          {content}
        </div>
      );
    }

    return (
      <div id="garment-measurements-card" className="flex flex-col justify-between h-full space-y-6">
        {content}
      </div>
    );
  };

  if (mode === 'select') {
    return (
      <>
        {renderClothingSelector()}
      </>
    );
  }

  if (mode === 'specs') {
    return (
      <>
        {renderGarmentMeasurements(false)}
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      {renderClothingSelector()}
      {renderGarmentMeasurements(true)}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import {
  Wand2,
  Download,
  Check,
  Eye,
  Sliders,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRightLeft,
  Sun,
  Contrast,
  Palette,
  Maximize2,
  Scissors,
} from 'lucide-react';
import {
  PhotoBackdropId,
  PhotoEditAdjustments,
  TransformedPhotoVersion,
} from '../types';
import {
  BACKDROP_CONFIGS,
  DEFAULT_PHOTO_ADJUSTMENTS,
  transformProductPhoto,
  generateAllPhotoVersions,
} from '../utils/photoTransformer';

interface PhotoTransformSectionProps {
  originalImageSrc: string;
  activeTransformedSrc: string;
  onSelectVersion: (versionSrc: string, versionName: string) => void;
  onNotification: (title: string, desc?: string) => void;
}

export const PhotoTransformSection: React.FC<PhotoTransformSectionProps> = ({
  originalImageSrc,
  activeTransformedSrc,
  onSelectVersion,
  onNotification,
}) => {
  const [selectedBackdropId, setSelectedBackdropId] =
    useState<PhotoBackdropId>('podium');
  const [adjustments, setAdjustments] = useState<PhotoEditAdjustments>({
    ...DEFAULT_PHOTO_ADJUSTMENTS,
  });
  const [showEditorControls, setShowEditorControls] = useState(false);
  const [versions, setVersions] = useState<TransformedPhotoVersion[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [showOriginalComparison, setShowOriginalComparison] = useState(false);
  const [isUpdatingActive, setIsUpdatingActive] = useState(false);

  // Debounce ref for live slider updates
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initial generation of all versions whenever originalImageSrc changes
  useEffect(() => {
    let isCancelled = false;
    setIsGenerating(true);

    generateAllPhotoVersions(originalImageSrc, adjustments)
      .then((generatedVersions) => {
        if (!isCancelled) {
          setVersions(generatedVersions);
          setIsGenerating(false);

          // By default, set the 1st version (Podium 3D Studio) as active for banners and video
          if (generatedVersions.length > 0 && !activeTransformedSrc) {
            onSelectVersion(
              generatedVersions[0].dataUrl,
              generatedVersions[0].name
            );
          }
        }
      })
      .catch((err) => {
        console.error('Failed to generate initial photo versions:', err);
        if (!isCancelled) setIsGenerating(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [originalImageSrc]);

  // Handle re-rendering when adjustments change
  const handleAdjustmentChange = (
    key: keyof PhotoEditAdjustments,
    value: number | boolean
  ) => {
    const updatedAdjustments = {
      ...adjustments,
      [key]: value,
    };
    setAdjustments(updatedAdjustments);

    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = setTimeout(async () => {
      setIsUpdatingActive(true);
      try {
        const newUrl = await transformProductPhoto(
          originalImageSrc,
          selectedBackdropId,
          updatedAdjustments
        );

        // Update current version in list
        setVersions((prev) =>
          prev.map((v) =>
            v.id === selectedBackdropId ? { ...v, dataUrl: newUrl } : v
          )
        );

        // Update active transformed photo in parent
        onSelectVersion(
          newUrl,
          BACKDROP_CONFIGS[selectedBackdropId]?.name || 'Versi Edit'
        );
      } catch (e) {
        console.error('Error re-rendering adjusted photo:', e);
      } finally {
        setIsUpdatingActive(false);
      }
    }, 120);
  };

  const handleResetAdjustments = async () => {
    setAdjustments({ ...DEFAULT_PHOTO_ADJUSTMENTS });
    setIsUpdatingActive(true);
    try {
      const resetUrl = await transformProductPhoto(
        originalImageSrc,
        selectedBackdropId,
        DEFAULT_PHOTO_ADJUSTMENTS
      );
      setVersions((prev) =>
        prev.map((v) =>
          v.id === selectedBackdropId ? { ...v, dataUrl: resetUrl } : v
        )
      );
      onSelectVersion(
        resetUrl,
        BACKDROP_CONFIGS[selectedBackdropId]?.name || 'Versi Edit'
      );
      onNotification(
        'Pengaturan Direset',
        'Pengaturan pencahayaan dan skala foto kembali ke standar'
      );
    } finally {
      setIsUpdatingActive(false);
    }
  };

  const handleSelectBackdrop = async (id: PhotoBackdropId) => {
    setSelectedBackdropId(id);
    const existing = versions.find((v) => v.id === id);
    if (existing) {
      onSelectVersion(existing.dataUrl, existing.name);
      onNotification(
        `Versi Aktif: ${existing.name}`,
        'Banner dan video otomatis menggunakan foto hasil edit ini'
      );
    } else {
      setIsUpdatingActive(true);
      try {
        const url = await transformProductPhoto(originalImageSrc, id, adjustments);
        onSelectVersion(url, BACKDROP_CONFIGS[id].name);
      } finally {
        setIsUpdatingActive(false);
      }
    }
  };

  const handleDownloadPhoto = (version: TransformedPhotoVersion) => {
    const link = document.createElement('a');
    const ext = version.id === 'clean-cutout' ? 'png' : 'jpg';
    link.download = `shopeeboost_${version.id}_${Date.now()}.${ext}`;
    link.href = version.dataUrl;
    link.click();
    onNotification(
      'Foto Berhasil Diunduh',
      `File foto versi ${version.name} tersimpan dalam kualitas HD 1:1.`
    );
  };

  const currentVersion =
    versions.find((v) => v.id === selectedBackdropId) || versions[0];

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
      {/* Header Studio Edit Foto */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 border-b border-indigo-900/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-400/30">
              <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Studio Edit Foto & Ubah Versi AI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Ubah Versi Foto Produk</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-bold">
                Bukan Sekadar Bingkai
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Foto asli Anda otomatis diubah ke berbagai versi estetika komersial:
              podium 3D modern, meja marmer mewah, meja kayu alami, dan studio
              Shopee Mall dengan pencahayaan dan bayangan realistis.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowEditorControls(!showEditorControls)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                showEditorControls
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10'
              }`}
            >
              <Sliders className="w-4 h-4 text-indigo-300" />
              <span>{showEditorControls ? 'Tutup Pengaturan' : 'Atur Pencahayaan & Posisi'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Active Selected Version Showcase with Large Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Large High-Resolution Display */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col items-center">
            <div className="relative w-full aspect-square max-w-[420px] rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100 group">
              {/* Image Preview */}
              <img
                src={
                  showOriginalComparison
                    ? originalImageSrc
                    : currentVersion?.dataUrl || activeTransformedSrc || originalImageSrc
                }
                alt={currentVersion?.name || 'Foto Produk Diedit'}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-contain transition-transform duration-200 ${
                  isUpdatingActive ? 'opacity-70 scale-[0.99]' : 'opacity-100'
                }`}
              />

              {/* Status Overlay while generating */}
              {(isGenerating || isUpdatingActive) && (
                <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="bg-white/95 text-slate-800 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-bold">
                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <span>Menerapkan sentuhan studio...</span>
                  </div>
                </div>
              )}

              {/* Before/After Tag */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white text-[11px] font-bold shadow-sm">
                  {showOriginalComparison ? 'Foto Asli Mentah' : currentVersion?.name || 'Versi Hasil Edit'}
                </span>
                {!showOriginalComparison && currentVersion?.badge && (
                  <span className="px-2 py-1 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-extrabold shadow-sm">
                    {currentVersion.badge}
                  </span>
                )}
              </div>

              {/* Toggle Compare Before/After Button */}
              <button
                onMouseDown={() => setShowOriginalComparison(true)}
                onMouseUp={() => setShowOriginalComparison(false)}
                onTouchStart={() => setShowOriginalComparison(true)}
                onTouchEnd={() => setShowOriginalComparison(false)}
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-white/90 hover:bg-white text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-md backdrop-blur-sm cursor-pointer transition-all active:scale-95"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tahan untuk Bandingkan Foto Asli</span>
              </button>
            </div>

            {/* Quick Actions for Selected Image */}
            <div className="flex items-center gap-2 w-full max-w-[420px] mt-3">
              <button
                onClick={() => {
                  if (currentVersion) {
                    onSelectVersion(currentVersion.dataUrl, currentVersion.name);
                    onNotification(
                      'Terapkan ke Banner & Video',
                      `Foto versi "${currentVersion.name}" sekarang aktif digunakan di semua banner dan video promosi!`
                    );
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Gunakan untuk Banner & Video</span>
              </button>

              {currentVersion && (
                <button
                  onClick={() => handleDownloadPhoto(currentVersion)}
                  className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition-all cursor-pointer"
                  title="Unduh foto versi ini dalam resolusi HD"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Unduh HD</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Transformed Versions Grid Picker */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Pilih Versi Hasil Edit Produk:</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-500">
                  {versions.length} Versi Tersedia
                </span>
              </div>

              {/* Grid of All Versions */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(BACKDROP_CONFIGS).map(([id, cfg]) => {
                  const versionItem = versions.find((v) => v.id === id);
                  const isSelected = selectedBackdropId === id;

                  return (
                    <div
                      key={id}
                      onClick={() => handleSelectBackdrop(id as PhotoBackdropId)}
                      className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Thumbnail Container */}
                      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-slate-100 mb-2 border border-slate-100">
                        {versionItem ? (
                          <img
                            src={versionItem.dataUrl}
                            alt={cfg.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}

                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-indigo-600 text-white p-1 rounded-full shadow-xs">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      {/* Info & Name */}
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className="text-xs font-bold text-slate-800 truncate">
                            {cfg.name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1 leading-snug">
                          {cfg.category}
                        </p>
                      </div>

                      {/* Active Status Footer */}
                      <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span
                          className={`font-semibold ${
                            isSelected ? 'text-indigo-600' : 'text-slate-400'
                          }`}
                        >
                          {isSelected ? '● Sedang Dipilih' : 'Klik untuk Pilih'}
                        </span>
                        {versionItem && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPhoto(versionItem);
                            }}
                            className="text-slate-400 hover:text-slate-700 p-0.5"
                            title="Unduh foto versi ini"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Note Explaining Integration with Banners & Video */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="leading-snug">
                <strong className="text-slate-800 block text-xs">
                  Otomatis Terhubung ke 3 Banner & Video 10 Detik
                </strong>
                Versi foto yang Anda pilih di atas langsung menggantikan foto di
                seluruh template banner Shopee dan video promosi di bawah!
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Fine-Tuning Adjustment Controls (Accordion / Toggle) */}
        {showEditorControls && (
          <div className="mt-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-800">
                  Pengaturan Detail Versi Foto (Lighting & Posisi)
                </h3>
              </div>
              <button
                onClick={handleResetAdjustments}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Default</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Kecerahan (Brightness) */}
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    Kecerahan
                  </span>
                  <span className="text-indigo-600">
                    {adjustments.brightness > 0 ? `+${adjustments.brightness}` : adjustments.brightness}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-40"
                  max="40"
                  value={adjustments.brightness}
                  onChange={(e) =>
                    handleAdjustmentChange('brightness', parseInt(e.target.value))
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Kontras (Contrast) */}
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Contrast className="w-3.5 h-3.5 text-slate-700" />
                    Kontras
                  </span>
                  <span className="text-indigo-600">
                    {adjustments.contrast > 0 ? `+${adjustments.contrast}` : adjustments.contrast}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={adjustments.contrast}
                  onChange={(e) =>
                    handleAdjustmentChange('contrast', parseInt(e.target.value))
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Saturasi Warna (Vibrance) */}
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-rose-500" />
                    Kejenuhan Warna
                  </span>
                  <span className="text-indigo-600">
                    {adjustments.saturation > 0 ? `+${adjustments.saturation}` : adjustments.saturation}%
                  </span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="40"
                  value={adjustments.saturation}
                  onChange={(e) =>
                    handleAdjustmentChange('saturation', parseInt(e.target.value))
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Zoom & Ukuran Produk */}
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
                    Ukuran (Zoom)
                  </span>
                  <span className="text-indigo-600">
                    {Math.round(adjustments.zoom * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.65"
                  max="1.45"
                  step="0.05"
                  value={adjustments.zoom}
                  onChange={(e) =>
                    handleAdjustmentChange('zoom', parseFloat(e.target.value))
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Geser Posisi Vertikal (Offset Y) */}
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>Posisi Atas / Bawah</span>
                  <span className="text-indigo-600">{adjustments.offsetY}px</span>
                </div>
                <input
                  type="range"
                  min="-120"
                  max="120"
                  step="5"
                  value={adjustments.offsetY}
                  onChange={(e) =>
                    handleAdjustmentChange('offsetY', parseInt(e.target.value))
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Bayangan Lantai Realistis (Shadow Strength) */}
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>Intensitas Bayangan Lantai</span>
                  <span className="text-indigo-600">
                    {Math.round(adjustments.shadowStrength * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={adjustments.shadowStrength}
                  onChange={(e) =>
                    handleAdjustmentChange(
                      'shadowStrength',
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Toggle Auto Cutout (Hapus Latar Belakang) */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span className="flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-indigo-500" />
                    Hapus Latar Otomatis
                  </span>
                  <input
                    type="checkbox"
                    checked={adjustments.autoCutout}
                    onChange={(e) =>
                      handleAdjustmentChange('autoCutout', e.target.checked)
                    }
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Pisahkan produk dari background foto mentah agar menyatu di panggung
                </p>
              </div>

              {/* Balik Horizontal (Flip) */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Balik Arah (Mirror)</span>
                  <input
                    type="checkbox"
                    checked={adjustments.flipHorizontal}
                    onChange={(e) =>
                      handleAdjustmentChange('flipHorizontal', e.target.checked)
                    }
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Hadapkan produk ke arah sebaliknya untuk sudut pandang terbaik
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

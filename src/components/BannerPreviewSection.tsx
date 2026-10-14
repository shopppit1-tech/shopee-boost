import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  Flame,
  Camera,
  Check,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { AnalysisResult, BannerSettings } from '../types';
import {
  loadImage,
  renderPromoBanner,
  renderMinimalistBanner,
  renderLifestyleBanner,
  downloadCanvas,
} from '../utils/bannerGenerator';

interface BannerPreviewSectionProps {
  productImageSrc: string;
  analysisData: AnalysisResult;
  onNotification: (title: string, desc?: string) => void;
  initialStoreName?: string;
  initialPrice?: string;
  initialDiscount?: string;
}

export const BannerPreviewSection: React.FC<BannerPreviewSectionProps> = ({
  productImageSrc,
  analysisData,
  onNotification,
  initialStoreName = 'Toko Shopee Official',
  initialPrice = '',
  initialDiscount = '50%',
}) => {
  const canvasPromoRef = useRef<HTMLCanvasElement>(null);
  const canvasMinimalistRef = useRef<HTMLCanvasElement>(null);
  const canvasLifestyleRef = useRef<HTMLCanvasElement>(null);

  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Banner settings (Tanpa harga)
  const [settings, setSettings] = useState<BannerSettings>({
    storeName: initialStoreName || 'Toko Shopee Official',
    sellerType: 'mall',
    displayPrice: '',
    originalPrice: '',
    discountPercentage: initialDiscount || '50%',
    showCodBadge: true,
    showFreeShippingBadge: true,
    showRatingBadge: true,
    productScale: 1.0,
    productOffsetY: 0,
    promoThemeColor: '#EE4D2D',
    minimalistBgTone: 'warm-cream',
    lifestyleBgTone: 'terracotta',
    photoMode: 'full',
  });

  // Sync settings when initial props change
  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      storeName: initialStoreName || prev.storeName,
    }));
  }, [initialStoreName]);

  // Load image element
  useEffect(() => {
    if (!productImageSrc) return;

    let isMounted = true;
    loadImage(productImageSrc)
      .then((img) => {
        if (isMounted) {
          setLoadedImage(img);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat gambar produk:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [productImageSrc]);

  // Render all 3 canvases safely
  useEffect(() => {
    if (!loadedImage) return;

    const promoCopy = analysisData?.bannerContent?.promo;
    const minimalistCopy = analysisData?.bannerContent?.minimalis || analysisData?.bannerContent?.minimalist;
    const lifestyleCopy = analysisData?.bannerContent?.lifestyle;

    const renderBanners = async () => {
      // 1. Banner Utama Resmi (Tanpa Harga)
      if (canvasPromoRef.current) {
        try {
          await renderPromoBanner(canvasPromoRef.current, loadedImage, promoCopy, settings);
        } catch (err) {
          console.error('Error render banner utama:', err);
        }
      }

      // 2. Edit Tampilan 1 (Studio Enhanced)
      if (canvasMinimalistRef.current) {
        try {
          await renderMinimalistBanner(canvasMinimalistRef.current, loadedImage, minimalistCopy, settings);
        } catch (err) {
          console.error('Error render edit tampilan 1:', err);
        }
      }

      // 3. Edit Tampilan 2 (Real-Pic & Quality Enhanced)
      if (canvasLifestyleRef.current) {
        try {
          await renderLifestyleBanner(canvasLifestyleRef.current, loadedImage, lifestyleCopy, settings);
        } catch (err) {
          console.error('Error render edit tampilan 2:', err);
        }
      }
    };

    renderBanners();
  }, [loadedImage, settings, analysisData]);

  const cleanFilename = (label: string) => {
    const raw = analysisData.productNameDetected || 'Produk_Shopee';
    const safe = raw.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 25);
    return `${safe}_${label}.png`;
  };

  const handleDownloadSingle = (label: string) => {
    let canvas: HTMLCanvasElement | null = null;
    let nameText = '';
    if (label.includes('1_') || label === '1_Banner_Utama') {
      canvas = canvasPromoRef.current;
      nameText = 'Banner Utama (Tanpa Harga)';
    } else if (label.includes('2_') || label.includes('Studio')) {
      canvas = canvasMinimalistRef.current;
      nameText = 'Foto 2 (Versi Studio 3D Podium)';
    } else {
      canvas = canvasLifestyleRef.current;
      nameText = 'Foto 3 (Versi Meja Marmer Mewah)';
    }

    if (!canvas) return;

    downloadCanvas(canvas, cleanFilename(label));
    onNotification(`${nameText} Berhasil Diunduh!`, 'File PNG 1080x1080 resolusi tinggi siap diunggah ke Shopee.');
  };


  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    try {
      if (canvasPromoRef.current) {
        downloadCanvas(canvasPromoRef.current, cleanFilename('1_Banner_Utama'));
      }
      await new Promise((r) => setTimeout(r, 350));

      if (canvasMinimalistRef.current) {
        downloadCanvas(canvasMinimalistRef.current, cleanFilename('2_Edit_Tampilan_Studio'));
      }
      await new Promise((r) => setTimeout(r, 350));

      if (canvasLifestyleRef.current) {
        downloadCanvas(canvasLifestyleRef.current, cleanFilename('3_Edit_Tampilan_RealPic'));
      }

      onNotification('Ketiga Foto & Banner Berhasil Diunduh!', '1 Banner Utama & 2 Foto Tampilan Telah Disimpan.');
    } catch (err) {
      console.error('Error unduh semua foto:', err);
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden space-y-5">
      {/* Header Bersih & Ringkas */}
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <span>3 Hasil Foto Produk Shopee</span>
            <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
              1080x1080 HD Full Foto
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Foto 1 jadi Banner Utama (tanpa harga), Foto 2 & 3 edit percantik tampilan produk
          </p>
        </div>

        {/* Tombol Unduh Semua */}
        <button
          type="button"
          onClick={handleDownloadAll}
          disabled={downloadingAll}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          {downloadingAll ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mengunduh 3 File...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Unduh 3 Foto Sekaligus</span>
            </>
          )}
        </button>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Toggle Pengaturan Sederhana */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <p className="text-xs font-bold text-slate-700">
            Hasil Desain (1 Banner Promosi + 2 Versi Foto Studio Diubah):
          </p>

          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showSettings ? 'Tutup Pengaturan' : 'Atur Zoom & Posisi Foto'}</span>
          </button>
        </div>

        {/* Form Pengaturan Zoom & Posisi Foto */}
        {showSettings && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-1">
                <span>Ukuran / Zoom Foto</span>
                <span className="text-slate-500">{Math.round(settings.productScale * 100)}%</span>
              </label>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.05"
                value={settings.productScale}
                onChange={(e) => setSettings({ ...settings, productScale: parseFloat(e.target.value) })}
                className="w-full accent-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between mb-1">
                <span>Posisi Atas / Bawah Foto</span>
                <span className="text-slate-500">{settings.productOffsetY}px</span>
              </label>
              <input
                type="range"
                min="-150"
                max="150"
                step="5"
                value={settings.productOffsetY}
                onChange={(e) => setSettings({ ...settings, productOffsetY: parseInt(e.target.value, 10) })}
                className="w-full accent-slate-800"
              />
            </div>
          </div>
        )}

        {/* 3 FOTO: 1 BANNER UTAMA (TANPA HARGA), 2 EDIT TAMPILAN PERCANTIK */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. BANNER UTAMA (TANPA HARGA) */}
          <div className="flex flex-col bg-white rounded-xl border-2 border-[#EE4D2D]/30 overflow-hidden shadow-xs">
            <div className="px-3.5 py-2.5 bg-[#EE4D2D] text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-yellow-300" />
                <span className="font-bold text-xs">1. Banner Utama Shopee</span>
              </div>
              <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-medium">
                Tanpa Harga
              </span>
            </div>

            <div className="p-3 flex-1 flex items-center justify-center bg-slate-100">
              <div className="w-full aspect-square max-w-[340px] rounded-lg overflow-hidden bg-slate-200 border border-slate-300">
                <canvas
                  ref={canvasPromoRef}
                  className="w-full h-full object-cover block"
                />
              </div>
            </div>

            <div className="p-3 bg-white border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleDownloadSingle('1_Banner_Utama')}
                className="w-full py-2.5 px-3 rounded-xl bg-[#EE4D2D] hover:bg-[#D0011B] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Banner 1</span>
              </button>
            </div>
          </div>

          {/* 2. VERSI EDIT FOTO: STUDIO 3D PODIUM */}
          <div className="flex flex-col bg-white rounded-xl border border-indigo-200 overflow-hidden shadow-xs">
            <div className="px-3.5 py-2.5 bg-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="font-bold text-xs">2. Versi Studio 3D Podium</span>
              </div>
              <span className="text-[10px] bg-indigo-700/80 px-2 py-0.5 rounded-full text-indigo-100 font-bold">
                Panggung Display
              </span>
            </div>

            <div className="p-3 flex-1 flex items-center justify-center bg-slate-100">
              <div className="w-full aspect-square max-w-[340px] rounded-lg overflow-hidden bg-slate-200 border border-slate-300 shadow-inner">
                <canvas
                  ref={canvasMinimalistRef}
                  className="w-full h-full object-cover block"
                />
              </div>
            </div>

            <div className="p-3 bg-white border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleDownloadSingle('2_Versi_Studio_3D_Podium')}
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Versi Studio 3D</span>
              </button>
            </div>
          </div>

          {/* 3. VERSI EDIT FOTO: MEJA MARMER MEWAH */}
          <div className="flex flex-col bg-white rounded-xl border border-emerald-200 overflow-hidden shadow-xs">
            <div className="px-3.5 py-2.5 bg-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-emerald-300" />
                <span className="font-bold text-xs">3. Versi Meja Marmer Mewah</span>
              </div>
              <span className="text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded-full text-emerald-100 font-bold">
                Lifestyle Estetik
              </span>
            </div>

            <div className="p-3 flex-1 flex items-center justify-center bg-slate-100">
              <div className="w-full aspect-square max-w-[340px] rounded-lg overflow-hidden bg-slate-200 border border-slate-300 shadow-inner">
                <canvas
                  ref={canvasLifestyleRef}
                  className="w-full h-full object-cover block"
                />
              </div>
            </div>

            <div className="p-3 bg-white border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleDownloadSingle('3_Versi_Meja_Marmer_Mewah')}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Versi Meja Marmer</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { SeoResultSection } from './components/SeoResultSection';
import { BannerPreviewSection } from './components/BannerPreviewSection';
import { VideoPromoSection } from './components/VideoPromoSection';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AnalysisResult } from './types';
import { Film, Image as ImageIcon, FileText, Wand2 } from 'lucide-react';
import { PhotoTransformSection } from './components/PhotoTransformSection';
import { apiUrl } from './utils/api';

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // User seller options from upload section (catatan produk)
  const [sellerOptions, setSellerOptions] = useState({
    productHint: '',
  });

  // Active transformed photo version (from studio edit)
  const [activeTransformedPhoto, setActiveTransformedPhoto] = useState<string>('');
  const [activeTransformedName, setActiveTransformedName] = useState<string>('');

  const resultsRef = useRef<HTMLDivElement>(null);
  const photoStudioRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const seoRef = useRef<HTMLDivElement>(null);

  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      dismissToast(id);
    }, 3500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCopyText = (text: string, title: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          addToast('success', `${title} Berhasil Disalin!`, 'Siap ditempel (paste) ke Shopee Seller Centre.');
        })
        .catch(() => {
          fallbackCopy(text, title);
        });
    } else {
      fallbackCopy(text, title);
    }
  };

  const fallbackCopy = (text: string, title: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      addToast('success', `${title} Berhasil Disalin!`, 'Tersimpan di clipboard Anda.');
    } catch {
      addToast('error', 'Gagal menyalin', 'Mohon salin manual.');
    }
  };

  const handleImageSelected = (base64: string, info?: { name: string; size: string }) => {
    setSelectedImage(base64);
    setActiveTransformedPhoto('');
    setActiveTransformedName('');
    if (info) {
      setFileInfo(info);
    }
    addToast('info', 'Foto Berhasil Dioptimasi', 'Ukuran foto siap diproses cepat oleh AI.');
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setActiveTransformedPhoto('');
    setActiveTransformedName('');
    setFileInfo(null);
    setAnalysisResult(null);
  };

  const handleAnalyze = async (options: {
    productHint: string;
  }) => {
    if (!selectedImage) return;

    setSellerOptions(options);
    setIsLoading(true);
    setLoadingStep('1/3 AI membaca detail & catatan produk...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 14000); // 14s fail-safe timeout

    const timer1 = setTimeout(() => {
      setLoadingStep('2/3 Merumuskan Judul SEO & Deskripsi Shopee...');
    }, 1000);

    const timer2 = setTimeout(() => {
      setLoadingStep('3/3 Menyiapkan 3 Banner Iklan & Video Promosi 10 Detik...');
    }, 2200);

    try {
      const response = await fetch(apiUrl('/api/analyze-product'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: 'image/jpeg',
          productHint: options.productHint,
        }),
      });

      clearTimeout(timeoutId);
      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!response.ok) {
        throw new Error('Gagal menghubungi server untuk analisis foto.');
      }

      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setAnalysisResult(resJson.data);
        addToast(
          'success',
          'Analisis Selesai! Banner & Video Siap!',
          '3 Banner iklan, Video Promosi 10 Detik, dan Judul SEO siap digunakan.'
        );

        // Smooth scroll to results
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      } else {
        throw new Error(resJson.error || 'Gagal memproses foto.');
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      clearTimeout(timer1);
      clearTimeout(timer2);

      console.error('Analyze error:', err);
      if (err.name === 'AbortError') {
        addToast('error', 'Koneksi Lambat', 'Waktu proses habis. Coba ulangi kembali.');
      } else {
        addToast('error', 'Terjadi Kendala', err.message || 'Silakan coba lagi beberapa saat.');
      }
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-slate-800 flex flex-col font-sans selection:bg-orange-200 selection:text-orange-950">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* STEP 1: Upload Section */}
        <UploadSection
          selectedImage={selectedImage}
          onImageSelected={handleImageSelected}
          onClearImage={handleClearImage}
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          loadingStep={loadingStep}
          onError={(msg) => addToast('error', 'Peringatan', msg)}
        />

        {/* Results Container */}
        {analysisResult && selectedImage && (
          <div ref={resultsRef} className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-300">
            
            {/* Quick Navigation Jump Bar */}
            <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-2 sticky top-16 z-30 backdrop-blur-md bg-white/95">
              <span className="text-xs font-bold text-slate-500 pl-2 hidden sm:inline">
                Hasil Lengkap:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => photoStudioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-extrabold text-xs transition-colors cursor-pointer border border-indigo-200"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Ubah Versi Foto (Studio)</span>
                </button>

                <button
                  type="button"
                  onClick={() => videoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-extrabold text-xs transition-colors cursor-pointer border border-red-200"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Video Promosi 10s</span>
                </button>

                <button
                  type="button"
                  onClick={() => bannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-orange-800 hover:bg-orange-100 font-bold text-xs transition-colors cursor-pointer border border-orange-200"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>3 Banner Iklan</span>
                </button>

                <button
                  type="button"
                  onClick={() => seoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition-colors cursor-pointer border border-slate-200"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>SEO & Deskripsi</span>
                </button>
              </div>
            </div>

            {/* HASIL 1: STUDIO UBAH VERSI FOTO (BUKAN SEKADAR BINGKAI) */}
            <div ref={photoStudioRef} className="scroll-mt-24">
              <PhotoTransformSection
                originalImageSrc={selectedImage}
                activeTransformedSrc={activeTransformedPhoto || selectedImage}
                onSelectVersion={(versionSrc, versionName) => {
                  setActiveTransformedPhoto(versionSrc);
                  setActiveTransformedName(versionName);
                }}
                onNotification={(title, desc) => addToast('success', title, desc)}
              />
            </div>

            {/* HASIL 2: VIDEO PROMOSI 10 DETIK (SHOPEE VIDEO & TIKTOK SHOP) */}
            <div ref={videoRef} className="scroll-mt-24">
              <VideoPromoSection
                productImageSrc={activeTransformedPhoto || selectedImage}
                analysisData={analysisResult}
                onNotification={(title, desc) => addToast('success', title, desc)}
              />
            </div>

            {/* HASIL 3: 3 BANNER IKLAN SEKALIGUS (MENGGUNAKAN VERSI FOTO TERPILIH) */}
            <div ref={bannerRef} className="scroll-mt-24">
              <BannerPreviewSection
                productImageSrc={activeTransformedPhoto || selectedImage}
                analysisData={analysisResult}
                onNotification={(title, desc) => addToast('success', title, desc)}
              />
            </div>


            {/* HASIL 3: JUDUL SEO, DESKRIPSI & KATA KUNCI */}
            <div ref={seoRef} className="scroll-mt-24">
              <SeoResultSection
                data={analysisResult}
                onCopyText={handleCopyText}
              />
            </div>
          </div>
        )}

      </main>

      {/* Footer Ringkas */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-600">
          Shopee Boost © 2026 • AI Foto & SEO Shopee (Siap Kamera HP & Galeri)
        </p>
      </footer>

      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

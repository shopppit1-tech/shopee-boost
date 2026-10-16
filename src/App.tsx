import React, { useRef, useState } from 'react';
import { ArrowRight, BarChart3, Camera, ChevronRight, FileText, Film, Image as ImageIcon, Search, Sparkles, UserRound, Video, Wand2 } from 'lucide-react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { SeoResultSection } from './components/SeoResultSection';
import { BannerPreviewSection } from './components/BannerPreviewSection';
import { VideoPromoSection } from './components/VideoPromoSection';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AnalysisResult } from './types';
import { PhotoTransformSection } from './components/PhotoTransformSection';
import { apiUrl } from './utils/api';

const featureCards = [
  { title: 'Studio Foto', description: 'Foto produk lebih profesional', icon: Camera, color: 'bg-[#ffe8e8] text-[#e95353]', target: 'studio' },
  { title: 'Banner Shopee', description: 'Buat banner iklan siap pakai', icon: ImageIcon, color: 'bg-[#fff0e5] text-[#ef6a28]', target: 'banner' },
  { title: 'SEO Produk', description: 'Judul dan deskripsi lebih menjual', icon: Search, color: 'bg-[#eee8ff] text-[#7551ce]', target: 'seo' },
  { title: 'Video Promo', description: 'Video pendek untuk tingkatkan klik', icon: Video, color: 'bg-[#e4f7ed] text-[#28a368]', target: 'video' },
];

export default function App() {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 11 ? 'Selamat pagi' : currentHour < 15 ? 'Selamat siang' : currentHour < 18 ? 'Selamat sore' : 'Selamat malam';
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeTransformedPhoto, setActiveTransformedPhoto] = useState('');
  const workspaceRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const photoStudioRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const seoRef = useRef<HTMLDivElement>(null);

  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== id)), 3500);
  };
  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const handleCopyText = (text: string, title: string) => navigator.clipboard?.writeText(text).then(() => addToast('success', `${title} Berhasil Disalin!`, 'Siap ditempel ke Shopee Seller Centre.'));
  const handleImageSelected = (base64: string) => { setSelectedImage(base64); setActiveTransformedPhoto(''); addToast('info', 'Foto Berhasil Dioptimasi', 'Siap diproses oleh AI.'); };
  const handleClearImage = () => { setSelectedImage(null); setAnalysisResult(null); setActiveTransformedPhoto(''); };

  const handleAnalyze = async (options: { productHint: string }) => {
    if (!selectedImage) return;
    setIsLoading(true); setLoadingStep('1/3 AI membaca detail produk...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 14000);
    const timer1 = setTimeout(() => setLoadingStep('2/3 Merumuskan judul SEO & deskripsi...'), 1000);
    const timer2 = setTimeout(() => setLoadingStep('3/3 Menyiapkan banner & video promo...'), 2200);
    try {
      const response = await fetch(apiUrl('/api/analyze-product'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ imageBase64: selectedImage, mimeType: 'image/jpeg', productHint: options.productHint }) });
      if (!response.ok) throw new Error('Gagal menghubungi server untuk analisis foto.');
      const result = await response.json();
      if (!result.success || !result.data) throw new Error(result.error || 'Gagal memproses foto.');
      setAnalysisResult(result.data); addToast('success', 'Analisis Selesai!', 'Banner, video promo, dan SEO siap digunakan.');
      setTimeout(() => scrollTo(resultsRef), 150);
    } catch (error: any) {
      addToast('error', error.name === 'AbortError' ? 'Koneksi Lambat' : 'Terjadi Kendala', error.name === 'AbortError' ? 'Coba ulangi kembali.' : error.message);
    } finally { clearTimeout(timeoutId); clearTimeout(timer1); clearTimeout(timer2); setIsLoading(false); setLoadingStep(''); }
  };

  return (
    <div className="min-h-screen bg-[#f8eee6] text-[#101c3c]">
      <div className="app-shell mx-auto min-h-screen max-w-[520px] bg-[#fffaf5] shadow-[0_0_80px_rgba(96,57,33,.10)]">
        <Header />
        <main className="px-5 pb-28 sm:px-7">
          <section className="animate-rise pt-6">
            <h1 className="font-display text-[34px] font-bold leading-[1.08] tracking-[-0.065em] text-[#101c3c]">{greeting}, Seller!</h1>
            <p className="mt-2 text-[17px] font-medium text-[#62697c]">Optimalkan toko dengan AI</p>
          </section>

          <section ref={workspaceRef} className="mt-6 scroll-mt-5 overflow-hidden rounded-[24px] border border-[#f0e5dc] bg-white shadow-[0_10px_28px_rgba(71,46,32,.07)]">
            <div className="relative min-h-[260px] overflow-hidden bg-gradient-to-br from-[#fffdfa] via-[#fdf6ed] to-[#f7e4d6] p-6">
              <div className="relative z-10 max-w-[58%]">
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#fff0eb] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[.13em] text-[#ee4d2d]"><Sparkles className="h-3 w-3" /> AI siap</div>
                <h2 className="font-display text-[26px] font-bold leading-[1.08] tracking-[-0.06em] text-[#101c3c]">Foto produk,<br />jadi materi jualan</h2>
                <p className="mt-3 text-[12px] font-medium leading-5 text-[#687083]">Satu foto untuk banner, SEO, dan video</p>
                <button type="button" onClick={() => scrollTo(workspaceRef)} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#ee4d2d] px-5 py-3 text-[13px] font-extrabold text-white shadow-[0_9px_18px_rgba(238,77,45,.24)] transition hover:bg-[#d9371b] active:scale-95">Mulai sekarang <ArrowRight className="h-4 w-4" /></button>
              </div>
              <div aria-hidden="true" className="absolute -bottom-4 -right-5 flex h-[225px] w-[220px] items-center justify-center rounded-tl-[90px] bg-gradient-to-br from-[#f5ddc7] to-[#e8c1a4]">
                <div className="relative flex h-28 w-28 rotate-[-8deg] items-center justify-center rounded-[28px] border border-white/80 bg-white/75 shadow-xl backdrop-blur-sm">
                  <ImageIcon className="h-14 w-14 text-[#ee4d2d]" />
                  <span className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#ee4d2d] text-white shadow"><Sparkles className="h-4 w-4" /></span>
                </div>
              </div>
            </div>
            <div className="border-t border-[#f1e8e1] px-5 py-4"><p className="mb-3 text-[11px] font-bold text-[#7e7a82]">Unggah foto Anda untuk mulai membuat materi</p><UploadSection selectedImage={selectedImage} onImageSelected={handleImageSelected} onClearImage={handleClearImage} onAnalyze={handleAnalyze} isLoading={isLoading} loadingStep={loadingStep} onError={(message) => addToast('error', 'Peringatan', message)} /></div>
          </section>

          <section className="mt-5 grid grid-cols-2 gap-3">
            {featureCards.map((card) => <button key={card.title} type="button" onClick={() => scrollTo(workspaceRef)} className="group rounded-[20px] border border-[#f0e7df] bg-white p-4 text-left shadow-[0_7px_20px_rgba(71,46,32,.04)] transition hover:-translate-y-0.5 hover:shadow-md"><span className={`flex h-12 w-12 items-center justify-center rounded-full ${card.color}`}><card.icon className="h-6 w-6" /></span><span className="mt-4 block text-[15px] font-extrabold text-[#101c3c]">{card.title}</span><span className="mt-1 block min-h-8 text-[10px] font-semibold leading-4 text-[#85818a]">{card.description}</span><span className="mt-3 flex items-center justify-end text-[#101c3c]"><ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></button>)}
          </section>

          <section className="mt-5 flex items-center justify-between overflow-hidden rounded-[22px] bg-gradient-to-r from-[#ff9f72] to-[#ffd27b] px-5 py-5"><div><h2 className="font-display text-[21px] font-bold tracking-[-0.05em] text-[#101c3c]">Toko siap berkembang</h2><p className="mt-1 text-[11px] font-semibold text-[#685a59]">Semua alat kreatifmu dalam satu tempat</p></div><div className="flex items-end gap-1 pr-1"><span className="h-5 w-3 rounded-t bg-[#ed6d3e]" /><span className="h-9 w-3 rounded-t bg-[#ed6d3e]" /><span className="h-14 w-3 rounded-t bg-[#ed6d3e]" /><Sparkles className="mb-10 ml-1 h-5 w-5 text-white" /></div></section>

          {analysisResult && selectedImage && <div ref={resultsRef} className="mt-8 space-y-8 scroll-mt-5"><div className="flex flex-wrap gap-2 rounded-2xl border border-[#f0e7df] bg-white p-3"><button type="button" onClick={() => scrollTo(photoStudioRef)} className="rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700"><Wand2 className="mr-1 inline h-3.5 w-3.5" />Studio</button><button type="button" onClick={() => scrollTo(bannerRef)} className="rounded-xl bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-800"><ImageIcon className="mr-1 inline h-3.5 w-3.5" />Banner</button><button type="button" onClick={() => scrollTo(videoRef)} className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700"><Film className="mr-1 inline h-3.5 w-3.5" />Video</button><button type="button" onClick={() => scrollTo(seoRef)} className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700"><FileText className="mr-1 inline h-3.5 w-3.5" />SEO</button></div><div ref={photoStudioRef}><PhotoTransformSection originalImageSrc={selectedImage} activeTransformedSrc={activeTransformedPhoto || selectedImage} onSelectVersion={(src) => setActiveTransformedPhoto(src)} onNotification={(title, desc) => addToast('success', title, desc)} /></div><div ref={videoRef}><VideoPromoSection productImageSrc={activeTransformedPhoto || selectedImage} analysisData={analysisResult} onNotification={(title, desc) => addToast('success', title, desc)} /></div><div ref={bannerRef}><BannerPreviewSection productImageSrc={activeTransformedPhoto || selectedImage} analysisData={analysisResult} onNotification={(title, desc) => addToast('success', title, desc)} /></div><div ref={seoRef}><SeoResultSection data={analysisResult} onCopyText={handleCopyText} /></div></div>}
          <footer className="mt-12 border-t border-[#eee5de] px-2 pb-5 pt-5 text-center text-[10px] font-medium leading-5 text-[#8b8790]"><p>© 2026 Shopee Boost. Hak cipta dilindungi.</p><p>Dibuat untuk membantu seller berkembang dengan AI.</p><a href="https://shopppit1-tech.github.io/privacy-policy.html" target="_blank" rel="noreferrer" className="font-bold text-[#d95737] underline underline-offset-2">Kebijakan Privasi</a></footer>
        </main>
        <nav className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-[520px] -translate-x-1/2 items-center justify-around border-t border-[#eee5de] bg-white/95 px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl"><button type="button" onClick={() => scrollTo(workspaceRef)} className="flex flex-col items-center gap-1 text-[#ee4d2d]"><span className="flex h-6 items-center"><span className="text-[22px]">⌂</span></span><span className="text-[10px] font-extrabold">Beranda</span><span className="h-1 w-8 rounded-full bg-[#ee4d2d]" /></button><button type="button" onClick={() => scrollTo(workspaceRef)} className="flex flex-col items-center gap-1 text-[#697080]"><ImageIcon className="h-5 w-5" /><span className="text-[10px] font-bold">Studio</span></button><button type="button" onClick={() => analysisResult ? scrollTo(resultsRef) : scrollTo(workspaceRef)} className="flex flex-col items-center gap-1 text-[#697080]"><BarChart3 className="h-5 w-5" /><span className="text-[10px] font-bold">Hasil</span></button><button type="button" onClick={() => addToast('info', 'Profil Seller', 'Profil akan tersedia pada pembaruan berikutnya.')} className="flex flex-col items-center gap-1 text-[#697080]"><UserRound className="h-5 w-5" /><span className="text-[10px] font-bold">Profil</span></button></nav>
      </div>
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((toast) => toast.id !== id))} />
    </div>
  );
}

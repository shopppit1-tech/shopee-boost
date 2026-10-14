import React, { useRef, useState } from 'react';
import {
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  Clock3,
  FileText,
  Film,
  Image as ImageIcon,
  LayoutGrid,
  Megaphone,
  PackageCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
  Zap,
} from 'lucide-react';
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { SeoResultSection } from './components/SeoResultSection';
import { BannerPreviewSection } from './components/BannerPreviewSection';
import { VideoPromoSection } from './components/VideoPromoSection';
import { ToastContainer, ToastMessage } from './components/Toast';
import { AnalysisResult } from './types';
import { PhotoTransformSection } from './components/PhotoTransformSection';
import { apiUrl } from './utils/api';

const quickActions = [
  { label: 'Studio Foto', description: 'Buat visual siap jual', icon: Wand2, tone: 'orange' },
  { label: 'Banner Shopee', description: '3 konsep iklan sekaligus', icon: Megaphone, tone: 'blue' },
  { label: 'SEO Produk', description: 'Judul & deskripsi lebih tajam', icon: Target, tone: 'purple' },
  { label: 'Video Promo', description: 'Video pendek 10 detik', icon: Film, tone: 'green' },
];

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [sellerOptions, setSellerOptions] = useState({ productHint: '' });
  const [activeTransformedPhoto, setActiveTransformedPhoto] = useState('');
  const [activeTransformedName, setActiveTransformedName] = useState('');

  const workspaceRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const photoStudioRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const seoRef = useRef<HTMLDivElement>(null);

  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => dismissToast(id), 3500);
  };

  const dismissToast = (id: string) => setToasts((prev) => prev.filter((toast) => toast.id !== id));

  const scrollToWorkspace = () => workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleCopyText = (text: string, title: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).then(
        () => addToast('success', `${title} Berhasil Disalin!`, 'Siap ditempel ke Shopee Seller Centre.'),
        () => fallbackCopy(text, title),
      );
    } else fallbackCopy(text, title);
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
    if (info) setFileInfo(info);
    addToast('info', 'Foto Berhasil Dioptimasi', 'Ukuran foto siap diproses cepat oleh AI.');
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setActiveTransformedPhoto('');
    setActiveTransformedName('');
    setFileInfo(null);
    setAnalysisResult(null);
  };

  const handleAnalyze = async (options: { productHint: string }) => {
    if (!selectedImage) return;
    setSellerOptions(options);
    setIsLoading(true);
    setLoadingStep('1/3 AI membaca detail & catatan produk...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 14000);
    const timer1 = setTimeout(() => setLoadingStep('2/3 Merumuskan Judul SEO & Deskripsi Shopee...'), 1000);
    const timer2 = setTimeout(() => setLoadingStep('3/3 Menyiapkan 3 Banner Iklan & Video Promosi 10 Detik...'), 2200);

    try {
      const response = await fetch(apiUrl('/api/analyze-product'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ imageBase64: selectedImage, mimeType: 'image/jpeg', productHint: options.productHint }),
      });
      clearTimeout(timeoutId);
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (!response.ok) throw new Error('Gagal menghubungi server untuk analisis foto.');
      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        setAnalysisResult(resJson.data);
        addToast('success', 'Analisis Selesai! Banner & Video Siap!', '3 Banner iklan, Video Promosi 10 Detik, dan Judul SEO siap digunakan.');
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
      } else throw new Error(resJson.error || 'Gagal memproses foto.');
    } catch (err: any) {
      clearTimeout(timeoutId);
      clearTimeout(timer1);
      clearTimeout(timer2);
      console.error('Analyze error:', err);
      addToast('error', err.name === 'AbortError' ? 'Koneksi Lambat' : 'Terjadi Kendala', err.name === 'AbortError' ? 'Waktu proses habis. Coba ulangi kembali.' : err.message || 'Silakan coba lagi beberapa saat.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="min-h-screen bg-[#fffaf5] text-[#101c3c] selection:bg-orange-200 selection:text-orange-950">
      <Header />
      <main className="dashboard-noise mx-auto w-full max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <section className="animate-rise relative overflow-hidden rounded-[30px] bg-[#101c3c] px-5 py-7 text-white shadow-[0_24px_70px_rgba(16,28,60,0.16)] sm:px-8 sm:py-9 lg:px-11 lg:py-10">
          <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#ee4d2d]/30 blur-3xl" />
          <div className="absolute bottom-[-90px] right-[28%] h-48 w-48 rounded-full bg-[#f6c971]/20 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_310px]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#ffd8c8]">
                <Sparkles className="h-3.5 w-3.5 text-[#ff9a75]" /> Pusat kendali toko
              </div>
              <h1 className="max-w-2xl font-display text-3xl font-bold leading-[1.06] tracking-[-0.06em] sm:text-5xl">
                Selamat pagi, <span className="text-[#ff9a75]">Seller!</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[#c4cbe0] sm:text-base">Ubah satu foto produk menjadi aset jualan yang siap menarik klik, meningkatkan kepercayaan, dan mempercepat toko Anda tumbuh.</p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button type="button" onClick={scrollToWorkspace} className="group inline-flex items-center gap-2 rounded-full bg-[#ee4d2d] px-5 py-3 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(238,77,45,0.28)] transition hover:-translate-y-0.5 hover:bg-[#f46343] active:scale-95">
                  <Zap className="h-4 w-4 fill-current" /> Mulai optimalkan toko <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#aeb8d1]"><Clock3 className="h-4 w-4" /> Hasil pertama dalam hitungan detik</span>
              </div>
            </div>
            <div className="relative rounded-[24px] border border-white/10 bg-white/[0.08] p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs font-bold text-[#c4cbe0]"><span>Momentum toko</span><TrendingUp className="h-4 w-4 text-[#7ee0aa]" /></div>
              <div className="mt-5 flex items-end justify-between"><span className="font-display text-5xl font-bold tracking-[-0.07em]">+28<span className="text-2xl text-[#ff9a75]">%</span></span><span className="rounded-full bg-[#7ee0aa]/15 px-2.5 py-1 text-[10px] font-extrabold text-[#8ef0b9]">siap naik</span></div>
              <div className="mt-5 flex h-12 items-end gap-1.5">{[28, 34, 30, 45, 41, 57, 68, 82, 92].map((height, index) => <span key={index} className="flex-1 rounded-t-md bg-gradient-to-t from-[#ee4d2d] to-[#ffb18f] opacity-90" style={{ height: `${height}%` }} />)}</div>
              <p className="mt-3 text-[10px] font-semibold text-[#9da8c2]">Potensi performa dari konten yang lebih konsisten</p>
            </div>
          </div>
        </section>

        <section className="animate-rise-delay mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[{ label: 'Aset siap pakai', value: '12', note: 'minggu ini', icon: PackageCheck, color: 'text-[#ee4d2d]', bg: 'bg-[#fff0eb]' }, { label: 'Konten dibuat', value: '38', note: '+12% dari lalu', icon: LayoutGrid, color: 'text-[#5b6fe8]', bg: 'bg-[#eef0ff]' }, { label: 'Waktu dihemat', value: '4,5j', note: 'per minggu', icon: Clock3, color: 'text-[#b27900]', bg: 'bg-[#fff7dc]' }, { label: 'Skor kesiapan', value: '92', note: 'sangat baik', icon: BarChart3, color: 'text-[#188458]', bg: 'bg-[#eaf9f0]' }].map((stat) => (
            <div key={stat.label} className="rounded-[20px] border border-[#eee6de] bg-white/85 p-4 shadow-[0_8px_24px_rgba(16,28,60,0.04)] sm:p-5">
              <div className="flex items-center justify-between"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}><stat.icon className="h-4 w-4" /></span><span className="text-[10px] font-bold text-[#a4a0a0]">{stat.note}</span></div>
              <div className="mt-4 font-display text-2xl font-bold tracking-[-0.06em] text-[#101c3c] sm:text-3xl">{stat.value}</div>
              <div className="mt-1 text-[11px] font-bold text-[#777682]">{stat.label}</div>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#ee4d2d]">Akselerator toko</p><h2 className="mt-1 font-display text-2xl font-bold tracking-[-0.05em] text-[#101c3c]">Mulai dari mana hari ini?</h2></div><span className="hidden text-xs font-semibold text-[#98949a] sm:block">Pilih satu, kami bantu selesaikan</span></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const tone = action.tone === 'orange' ? 'bg-[#fff0eb] text-[#ee4d2d]' : action.tone === 'blue' ? 'bg-[#eef3ff] text-[#5875e8]' : action.tone === 'purple' ? 'bg-[#f3efff] text-[#8868d9]' : 'bg-[#eaf9f0] text-[#20a66b]';
              return <button key={action.label} type="button" onClick={scrollToWorkspace} className="group flex items-center gap-4 rounded-[22px] border border-[#eee6de] bg-white p-4 text-left shadow-[0_8px_24px_rgba(16,28,60,0.035)] transition hover:-translate-y-0.5 hover:border-[#ee4d2d]/30 hover:shadow-[0_14px_32px_rgba(16,28,60,0.08)]"><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tone}`}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-[#101c3c]">{action.label}</span><span className="mt-1 block truncate text-[11px] font-semibold text-[#8c8992]">{action.description}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-[#bdb7b2] transition group-hover:translate-x-1 group-hover:text-[#ee4d2d]" /></button>;
            })}
          </div>
        </section>

        <section ref={workspaceRef} className="mt-10 scroll-mt-24">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#ee4d2d]">Workspace utama</p><h2 className="mt-1 font-display text-2xl font-bold tracking-[-0.05em] text-[#101c3c]">Satu foto. Tiga aset jualan.</h2></div><div className="flex items-center gap-2 text-[11px] font-bold text-[#7b7880]"><span className="h-2 w-2 rounded-full bg-[#27b477]" /> AI siap membaca produk Anda</div></div>
          <UploadSection selectedImage={selectedImage} onImageSelected={handleImageSelected} onClearImage={handleClearImage} onAnalyze={handleAnalyze} isLoading={isLoading} loadingStep={loadingStep} onError={(msg) => addToast('error', 'Peringatan', msg)} />
        </section>

        {analysisResult && selectedImage && (
          <div ref={resultsRef} className="mt-10 space-y-8 scroll-mt-24 animate-in fade-in slide-in-from-bottom-6 duration-300">
            <div className="flex flex-wrap items-center gap-2 rounded-[20px] border border-[#eee6de] bg-white p-3 shadow-sm"><span className="mr-1 hidden pl-2 text-xs font-extrabold text-[#7b7880] sm:inline">Hasil lengkap:</span><button type="button" onClick={() => photoStudioRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-extrabold text-indigo-700"><Wand2 className="h-3.5 w-3.5" /> Studio Foto</button><button type="button" onClick={() => videoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-extrabold text-red-700"><Film className="h-3.5 w-3.5" /> Video Promo</button><button type="button" onClick={() => bannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-800"><ImageIcon className="h-3.5 w-3.5" /> Banner Iklan</button><button type="button" onClick={() => seoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700"><FileText className="h-3.5 w-3.5" /> SEO Produk</button></div>
            <div ref={photoStudioRef} className="scroll-mt-24"><PhotoTransformSection originalImageSrc={selectedImage} activeTransformedSrc={activeTransformedPhoto || selectedImage} onSelectVersion={(versionSrc, versionName) => { setActiveTransformedPhoto(versionSrc); setActiveTransformedName(versionName); }} onNotification={(title, desc) => addToast('success', title, desc)} /></div>
            <div ref={videoRef} className="scroll-mt-24"><VideoPromoSection productImageSrc={activeTransformedPhoto || selectedImage} analysisData={analysisResult} onNotification={(title, desc) => addToast('success', title, desc)} /></div>
            <div ref={bannerRef} className="scroll-mt-24"><BannerPreviewSection productImageSrc={activeTransformedPhoto || selectedImage} analysisData={analysisResult} onNotification={(title, desc) => addToast('success', title, desc)} /></div>
            <div ref={seoRef} className="scroll-mt-24"><SeoResultSection data={analysisResult} onCopyText={handleCopyText} /></div>
          </div>
        )}
      </main>
      <footer className="border-t border-[#e9e3dc] bg-white py-5 text-center text-[11px] font-semibold text-[#8b8790]">Shopee Boost © 2026 • AI Foto & SEO Shopee untuk seller yang ingin tumbuh lebih cepat</footer>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

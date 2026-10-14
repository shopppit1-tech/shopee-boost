import React, { useState } from 'react';
import { Download, Smartphone, Check, X, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? `${window.location.origin}${import.meta.env.BASE_URL}` : '';

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-slate-800 space-y-4">
        {/* Header with real icon */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}pwa-192x192.png`}
              alt="Shopee Boost Icon"
              className="w-12 h-12 rounded-2xl shadow-md border border-orange-200 object-cover"
            />
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                <span>Shopee Boost</span>
                <span className="text-[10px] bg-orange-100 text-[#EE4D2D] font-bold px-2 py-0.5 rounded-full">
                  PWA
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Aplikasi ringan & cepat langsung di layar HP Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Link Box */}
        <div className="p-3.5 bg-orange-50/80 border border-orange-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-orange-950">
            <span>Link Aplikasi:</span>
            <button
              onClick={handleCopy}
              className="text-[#EE4D2D] hover:text-[#D0011B] flex items-center gap-1 font-bold cursor-pointer transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Salin Link</span>
                </>
              )}
            </button>
          </div>
          <div className="p-2.5 bg-white rounded-xl border border-orange-200 text-[11px] font-mono text-slate-700 break-all select-all shadow-2xs">
            {appUrl}
          </div>
          <p className="text-[11px] leading-relaxed text-orange-900">
            Kirimkan link ini ke WhatsApp HP Anda, lalu buka dengan browser Google Chrome untuk memasang aplikasi dengan ikon resminya.
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-3">
          <p className="font-bold text-slate-800">Petunjuk Pemasangan di HP:</p>
          
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-[#EE4D2D] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-xs">
              1
            </span>
            <div className="text-slate-600 leading-snug">
              <strong className="text-slate-800">Di HP Android (Google Chrome):</strong>
              <ul className="mt-1 list-disc list-inside space-y-1 text-[11px]">
                <li>Buka link langsung di aplikasi <strong>Google Chrome</strong> (bukan dari browser dalam WhatsApp).</li>
                <li>Ketuk menu <strong>titik 3</strong> di pojok kanan atas Chrome &rarr; pilih <strong>&ldquo;Instal Aplikasi&rdquo;</strong> (atau <em>Tambahkan ke Layar Utama</em>).</li>
                <li>Tunggu 5-10 detik: Android akan membuat aplikasi resmi dengan ikon ShopeeBoost di layar utama HP Anda.</li>
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-xs">
              2
            </span>
            <div className="text-slate-600 leading-snug">
              <strong className="text-slate-800">Jika Muncul Tulisan &ldquo;Tidak Dapat Menginstal&rdquo; di Chrome:</strong>
              <p className="mt-0.5 text-[11px] text-slate-600">
                Itu terjadi jika link dibuka di tab incognito atau Chrome sedang menahan proses WebAPK. Cukup <strong>Refresh (Muat Ulang)</strong> halaman di Chrome biasa, atau pilih <strong>&ldquo;Tambahkan ke Layar Utama&rdquo;</strong> &mdash; aplikasi akan langsung terpasang dan berfungsi penuh!
              </p>
            </div>
          </div>
        </div>

        <div className="pt-1">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already installed and opened as standalone APK
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
        <Check className="w-3.5 h-3.5" />
        <span>Terpasang (Aplikasi Aktif)</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#EE4D2D] to-[#D0011B] text-white hover:opacity-95 active:scale-95 text-xs font-bold shadow-xs transition-all cursor-pointer"
        title="Instal aplikasi di HP / Desktop"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Pasang Aplikasi (PWA / APK)</span>
      </button>

      <PWAInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
};

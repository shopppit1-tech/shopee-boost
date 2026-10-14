import React from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

export const Header: React.FC = () => {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 h-14">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Kembali ke halaman sebelumnya"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Kembali</span>
          </button>

          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EE4D2D] text-white shadow-xs">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="whitespace-nowrap text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                Shopee <span className="text-[#EE4D2D]">Boost</span>
              </span>
              <span className="hidden truncate text-[11px] font-medium text-slate-500 lg:inline">
                Foto Produk & SEO Shopee AI
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

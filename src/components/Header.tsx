import React from 'react';
import { Bell, ChevronDown, Sparkles, ShoppingBag } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e9e3dc] bg-[#fffaf5]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#ee4d2d] text-white shadow-[0_8px_20px_rgba(238,77,45,0.24)]">
            <ShoppingBag className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap font-display text-[18px] font-bold tracking-[-0.04em] text-[#101c3c] sm:text-xl">
                Shopee <span className="text-[#ee4d2d]">Boost</span>
              </span>
              <span className="hidden rounded-full bg-[#e8f7ef] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#188458] sm:inline-flex">
                AI Seller OS
              </span>
            </div>
            <p className="hidden text-[10px] font-semibold text-[#8b8790] sm:block">Pusat kendali pertumbuhan toko Anda</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-[#dcefe3] bg-[#f0fbf4] px-3 py-2 text-[11px] font-bold text-[#188458] md:flex">
            <span className="h-2 w-2 rounded-full bg-[#27b477] shadow-[0_0_0_4px_rgba(39,180,119,0.12)]" />
            Mesin AI siap
          </div>
          <button type="button" aria-label="Notifikasi" className="relative rounded-full border border-[#e9e3dc] bg-white p-2.5 text-[#5f6575] transition hover:border-[#ee4d2d]/40 hover:text-[#ee4d2d]">
            <Bell className="h-4 w-4" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#ee4d2d]" />
          </button>
          <button type="button" className="flex items-center gap-2 rounded-full border border-[#e9e3dc] bg-white py-1.5 pl-1.5 pr-2.5 text-left transition hover:border-[#ee4d2d]/40">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#101c3c] text-xs font-extrabold text-white">S</span>
            <span className="hidden text-xs font-bold text-[#101c3c] sm:block">Seller</span>
            <ChevronDown className="hidden h-3.5 w-3.5 text-[#8b8790] sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
};

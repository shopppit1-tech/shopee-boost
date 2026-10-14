import React from 'react';
import { Bell, ShoppingBag } from 'lucide-react';

export const Header: React.FC = () => (
  <header className="bg-[#fffaf5] px-5 pb-2 pt-5 sm:px-7">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#ee4d2d] text-white shadow-[0_8px_18px_rgba(238,77,45,.22)]">
          <ShoppingBag className="h-6 w-6" strokeWidth={2.2} />
        </div>
        <div>
          <div className="font-display text-[22px] font-bold leading-none tracking-[-0.06em] text-[#101c3c]">Shopee <span className="text-[#ee4d2d]">Boost</span></div>
          <div className="mt-1 text-[10px] font-bold text-[#8f8c91]">AI Seller Studio</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label="Notifikasi" className="relative rounded-full p-2 text-[#697080] transition hover:bg-white hover:text-[#ee4d2d]"><Bell className="h-5 w-5" /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#ee4d2d]" /></button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ead9ce] text-sm font-extrabold text-[#101c3c] shadow-sm">S</div>
      </div>
    </div>
  </header>
);

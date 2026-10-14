import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const Header: React.FC = () => (
  <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-14">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EE4D2D] flex items-center justify-center text-white shadow-xs">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              Shopee <span className="text-[#EE4D2D]">Boost</span>
            </span>
            <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
              Foto Produk & SEO Shopee AI
            </span>
          </div>
        </div>
        <PWAInstallButton />
      </div>
    </div>
  </header>
);

import React, { useState } from 'react';
import {
  Copy,
  Check,
  Search,
  FileText,
  Sparkles,
} from 'lucide-react';
import { AnalysisResult } from '../types';

interface SeoResultSectionProps {
  data: AnalysisResult;
  onCopyText: (text: string, title: string) => void;
}

/**
 * Strict filter to strip all emojis, icons, and decorative symbols.
 * Preserves clean letters, numbers, punctuation, and standard '-' for bullet lists.
 */
function cleanNoIcons(text: string): string {
  if (!text) return '';
  return text
    // Strip standard and extended unicode emojis
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{1FA00}-\u{1FAFF}\u{200D}\u{FE0F}\u{20E3}\u{E0020}-\u{E007F}]/gu, '')
    // Strip decorative symbols & pictograms
    .replace(/[🔥✨⚡★☆✓✔✅☑📦🎁⚠️🛍️✦🏷️💯🎯👑🛒🎉💎🚨💬📌🏆📍🔖❤️👍]/gu, '')
    // Clean up multiple spaces per line
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .trim();
}

export const SeoResultSection: React.FC<SeoResultSectionProps> = ({ data, onCopyText }) => {
  const [activeTitleTab, setActiveTitleTab] = useState<'recommended' | 'promo' | 'descriptive'>('recommended');
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedKeywords, setCopiedKeywords] = useState(false);

  // Clean strings without any icons
  const cleanDesc = cleanNoIcons(data.description);
  const rawTitle = data.seoTitles[activeTitleTab] || data.seoTitles.recommended;
  const currentTitle = cleanNoIcons(rawTitle);
  const titleCharCount = currentTitle.length;

  const handleCopyTitle = () => {
    onCopyText(currentTitle, 'Judul SEO Shopee');
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  const handleCopyDesc = () => {
    onCopyText(cleanDesc, 'Deskripsi Shopee');
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 2000);
  };

  const handleCopyAllKeywords = () => {
    const text = data.keywords.join(', ');
    onCopyText(text, 'Semua Kata Kunci Shopee');
    setCopiedKeywords(true);
    setTimeout(() => setCopiedKeywords(false), 2000);
  };

  const handleCopySingleKeyword = (kw: string) => {
    onCopyText(kw, `Kata Kunci "${kw}"`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden space-y-5">
      {/* Header Bersih */}
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900">
            Hasil Optimasi SEO Shopee
          </h2>
          <p className="text-xs text-slate-500">
            Kategori: <span className="font-semibold text-slate-700">{data.category}</span>
          </p>
        </div>

        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
          Siap Copy-Paste ke Shopee
        </span>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* 1. JUDUL SEO SHOPEE */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-slate-600" />
              <span>Judul SEO Produk Shopee</span>
            </h3>

            {/* Character Length Badge */}
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                titleCharCount <= 100
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {titleCharCount} / 100 Karakter
            </span>
          </div>

          {/* Title Variations Tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-2">
            <button
              type="button"
              onClick={() => setActiveTitleTab('recommended')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTitleTab === 'recommended'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Rekomendasi Utama
            </button>
            <button
              type="button"
              onClick={() => setActiveTitleTab('promo')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTitleTab === 'promo'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Gaya Promo & Diskon
            </button>
            <button
              type="button"
              onClick={() => setActiveTitleTab('descriptive')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTitleTab === 'descriptive'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              Gaya Spesifikasi Bahan
            </button>
          </div>

          {/* Title Box & Copy Button */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed pr-2">
              {currentTitle}
            </p>

            <button
              type="button"
              onClick={handleCopyTitle}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                copiedTitle
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#EE4D2D] hover:bg-[#D81A07] active:scale-95 text-white'
              }`}
            >
              {copiedTitle ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Judul Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Judul</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2. KATA KUNCI SHOPEE */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-slate-600" />
                <span>Kata Kunci Pencarian Shopee (Keywords)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Klik kata kunci untuk menyalin satuan atau klik tombol untuk salin semua
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyAllKeywords}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                copiedKeywords
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}
            >
              {copiedKeywords ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Kata Kunci Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Salin Semua Kata Kunci</span>
                </>
              )}
            </button>
          </div>

          {/* Keyword chips */}
          <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            {data.keywords.map((kw, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleCopySingleKeyword(kw)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-slate-400 text-xs font-medium text-slate-700 transition-all cursor-pointer"
                title="Klik untuk salin"
              >
                <span>{kw}</span>
                <Copy className="w-2.5 h-2.5 text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        {/* 3. DESKRIPSI PRODUK (TANPA ICON / EMOJI) */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>Deskripsi Produk Shopee Lengkap (Tanpa Icon)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Format teks bersih tanpa icon/emoji, siap copy-paste ke deskripsi Shopee
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyDesc}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                copiedDesc
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#EE4D2D] hover:bg-[#D81A07] active:scale-95 text-white'
              }`}
            >
              {copiedDesc ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Deskripsi Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Deskripsi Lengkap</span>
                </>
              )}
            </button>
          </div>

          {/* Description Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-72 overflow-y-auto">
            <pre className="text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
              {cleanDesc}
            </pre>
          </div>
        </div>

        {/* 4. INFO HARGA PASARAN & KEUNGGULAN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs font-bold text-slate-700">
              Estimasi Harga Pasaran Shopee
            </p>
            <p className="text-base font-extrabold text-slate-900 mt-0.5">
              {data.priceEstimate.formatted || 'Rp 75.000 - Rp 189.000'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-xs font-bold text-slate-700">
              Poin Keunggulan Utama (Selling Points)
            </p>
            <ul className="text-xs text-slate-700 mt-1 space-y-0.5 font-medium">
              {data.uspList.slice(0, 3).map((usp, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="text-slate-400">•</span> {cleanNoIcons(usp)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

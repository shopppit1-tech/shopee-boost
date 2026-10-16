import React, { useEffect, useMemo, useState } from 'react';
import { Check, Download, Image as ImageIcon, LoaderCircle, RefreshCw, Sparkles } from 'lucide-react';
import { apiUrl } from '../utils/api';

type PhotoVariant = {
  id: string;
  name: string;
  dataUrl: string;
};

interface PhotoTransformSectionProps {
  originalImageSrc: string;
  activeTransformedSrc: string;
  onSelectVersion: (versionSrc: string, versionName: string) => void;
  onNotification: (title: string, desc?: string) => void;
}

export const PhotoTransformSection: React.FC<PhotoTransformSectionProps> = ({
  originalImageSrc,
  activeTransformedSrc,
  onSelectVersion,
  onNotification,
}) => {
  const [variants, setVariants] = useState<PhotoVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isShowingOriginal, setIsShowingOriginal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    setVariants([]);
    setSelectedVariantId(null);
    setErrorMessage('');
    setWarningMessage('');
    setIsShowingOriginal(false);
  }, [originalImageSrc]);

  const selectedVariant = useMemo(
    () => variants.find((variant) => variant.id === selectedVariantId) || null,
    [variants, selectedVariantId]
  );

  const previewSrc = isShowingOriginal
    ? originalImageSrc
    : selectedVariant?.dataUrl || activeTransformedSrc || originalImageSrc;

  const generateVariants = async () => {
    if (isGenerating) return;

    setIsGenerating(true);
    setErrorMessage('');
    setWarningMessage('');
    setVariants([]);
    setSelectedVariantId(null);
    onSelectVersion(originalImageSrc, 'Foto asli');

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 180_000);

    try {
      const response = await fetch(apiUrl('/api/generate-photo-variants'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64: originalImageSrc,
          mimeType: originalImageSrc.match(/^data:(image\/[a-z0-9.+-]+);base64,/i)?.[1] || 'image/jpeg',
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'API belum berhasil mengedit foto. Coba lagi sebentar.');
      }

      let resultPayload = payload;
      if (payload.status === 'processing' && typeof payload.taskId === 'string') {
        const taskId = payload.taskId;
        const pollDeadline = Date.now() + 165_000;
        while (Date.now() < pollDeadline) {
          await new Promise<void>((resolve) => window.setTimeout(resolve, 5_000));
          const pollResponse = await fetch(apiUrl(`/api/generate-photo-variants/${encodeURIComponent(taskId)}`), {
            method: 'GET',
            signal: controller.signal,
          });
          const pollPayload = await pollResponse.json().catch(() => null);
          if (!pollResponse.ok || !pollPayload?.success) {
            throw new Error(pollPayload?.error || 'Tidak dapat mengambil hasil foto dari Manus.');
          }
          if (pollPayload.status === 'failed') {
            throw new Error(pollPayload.error || 'Manus belum berhasil membuat foto. Coba lagi.');
          }
          if (pollPayload.status === 'completed') {
            resultPayload = pollPayload;
            break;
          }
        }
        if (resultPayload.status !== 'completed') {
          throw new Error('Manus masih memproses foto. Coba lagi sebentar; prosesnya mungkin masih berjalan.');
        }
      }

      const generatedVariants = Array.isArray(resultPayload.variants)
        ? resultPayload.variants.filter(
            (variant: unknown): variant is PhotoVariant =>
              Boolean(
                variant &&
                typeof variant === 'object' &&
                typeof (variant as PhotoVariant).id === 'string' &&
                typeof (variant as PhotoVariant).name === 'string' &&
                typeof (variant as PhotoVariant).dataUrl === 'string'
              )
          )
        : [];

      if (generatedVariants.length === 0) {
        throw new Error('API tidak mengembalikan hasil foto. Silakan coba lagi.');
      }

      setVariants(generatedVariants);
      setSelectedVariantId(generatedVariants[0].id);
      onSelectVersion(generatedVariants[0].dataUrl, generatedVariants[0].name);

      if (generatedVariants.length < 3) {
        setWarningMessage(resultPayload.warning || `Baru ${generatedVariants.length} dari 3 varian berhasil dibuat. Anda bisa mencoba lagi untuk membuat ulang ketiganya.`);
      } else {
        onNotification('3 Varian Foto AI Siap', 'Pilih hasil yang paling cocok. Foto AI ini juga akan dipakai pada banner dan video.');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Terjadi kendala saat mengedit foto.';
      setErrorMessage(
        message === 'The operation was aborted.'
          ? 'Proses edit foto terlalu lama. Coba lagi saat koneksi lebih stabil.'
          : message
      );
    } finally {
      window.clearTimeout(timeout);
      setIsGenerating(false);
    }
  };

  const selectVariant = (variant: PhotoVariant) => {
    setSelectedVariantId(variant.id);
    setIsShowingOriginal(false);
    onSelectVersion(variant.dataUrl, variant.name);
  };

  const downloadVariant = (variant: PhotoVariant) => {
    const link = document.createElement('a');
    const extension = variant.dataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
    link.download = `shopeeboost_ai_${variant.id}_${Date.now()}.${extension}`;
    link.href = variant.dataUrl;
    link.click();
  };

  const showOriginal = () => setIsShowingOriginal(true);
  const showEdited = () => setIsShowingOriginal(false);

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
      <div className="border-b border-indigo-900/40 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-300/25 bg-indigo-400/15 px-3 py-1 text-xs font-semibold text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Manus AI Edit Foto Produk</span>
            </div>
            <h2 className="text-xl font-black tracking-tight sm:text-2xl">Buat 3 Versi Baru Foto Iklan</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-300 sm:text-sm">
              Manus membuat tiga pemotretan produk baru dengan sudut, komposisi, dan konteks berbeda—bukan sekadar ganti latar. Produk tetap dikenali, tanpa bingkai atau tulisan tempelan.
            </p>
          </div>
          <button
            type="button"
            onClick={generateVariants}
            disabled={isGenerating}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#EE4D2D] px-4 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#D9381D] disabled:cursor-wait disabled:opacity-70"
          >
            {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : variants.length ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            <span>{isGenerating ? 'Manus sedang membuat…' : variants.length ? 'Buat Ulang 3 Varian' : 'Buat 3 Varian AI'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
          <div className="flex flex-col items-center lg:col-span-5">
            <div className="group relative aspect-square w-full max-w-[420px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-md">
              <img
                src={previewSrc}
                alt={isShowingOriginal ? 'Foto produk asli' : selectedVariant?.name || 'Pratinjau foto produk'}
                className="h-full w-full object-contain"
              />
              {(isGenerating || !variants.length) && (
                <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-slate-950/75 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
                  {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                  <span>{isGenerating ? 'Manus sedang membuat tiga konsep foto iklan baru dari foto asli…' : 'Foto asli — tekan “Buat 3 Varian AI” untuk mulai mengedit'}</span>
                </div>
              )}
              {variants.length > 0 && (
                <>
                  <span className="absolute left-3 top-3 rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                    {isShowingOriginal ? 'Foto Asli' : selectedVariant?.name || 'Hasil AI'}
                  </span>
                  <button
                    type="button"
                    onMouseDown={showOriginal}
                    onMouseUp={showEdited}
                    onMouseLeave={showEdited}
                    onTouchStart={showOriginal}
                    onTouchEnd={showEdited}
                    onBlur={showEdited}
                    className="absolute bottom-3 right-3 rounded-xl bg-white/95 px-3 py-2 text-xs font-bold text-slate-800 shadow-md backdrop-blur-sm"
                  >
                    Tahan untuk lihat foto asli
                  </button>
                </>
              )}
            </div>
            {selectedVariant && (
              <button
                type="button"
                onClick={() => downloadVariant(selectedVariant)}
                className="mt-3 inline-flex w-full max-w-[420px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                <Download className="h-4 w-4" />
                Unduh {selectedVariant.name}
              </button>
            )}
          </div>

          <div className="lg:col-span-7">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Tiga hasil edit AI
              </h3>
              <span className="text-[11px] font-semibold text-slate-500">{variants.length}/3 siap</span>
            </div>

            {variants.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {variants.map((variant, index) => {
                  const isSelected = selectedVariantId === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => selectVariant(variant)}
                      aria-pressed={isSelected}
                      className={`group relative overflow-hidden rounded-xl border-2 text-left transition ${isSelected ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/10' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                    >
                      <div className="relative aspect-square overflow-hidden bg-slate-100">
                        <img src={variant.dataUrl} alt={variant.name} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]" />
                        {isSelected && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow"><Check className="h-4 w-4" /></span>}
                      </div>
                      <div className="p-2.5">
                        <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-indigo-700">Konsep {index + 1}</span>
                        <span className="block text-xs font-bold leading-snug text-slate-800">{variant.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold text-slate-700">Belum ada hasil edit AI</p>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                  Tekan tombol di atas. Gemini akan membuat tiga foto iklan berbeda dari produk yang Anda unggah.
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3.5 py-3 text-xs leading-relaxed text-indigo-900">
                <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                <span>Proses ini memakai API gambar AI dan dapat memerlukan waktu. Hasil akan muncul setelah API menyelesaikan tiga konsep edit.</span>
              </div>
            )}
            {warningMessage && <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-900">{warningMessage}</p>}
            {errorMessage && <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs leading-relaxed text-rose-800">{errorMessage}</p>}

            {variants.length > 0 && (
              <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs leading-relaxed text-emerald-950">
                Pilih salah satu hasil untuk dipakai otomatis pada banner dan video. Setiap varian adalah foto hasil edit AI, bukan produk yang ditempel di atas bingkai.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

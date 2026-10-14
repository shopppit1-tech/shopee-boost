import React, { useRef, useState } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  RefreshCw,
  X,
  FileImage,
} from 'lucide-react';
import { SAMPLE_PRODUCTS } from '../data/samples';
import { SampleProduct } from '../types';

import { compressImageFile } from '../utils/imageCompressor';

interface UploadSectionProps {
  onImageSelected: (base64: string, fileInfo?: { name: string; size: string }) => void;
  onAnalyze: (options: {
    productHint: string;
  }) => void;
  selectedImage: string | null;
  onClearImage: () => void;
  isLoading: boolean;
  loadingStep: string;
  onError?: (msg: string) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({
  onImageSelected,
  onAnalyze,
  selectedImage,
  onClearImage,
  isLoading,
  loadingStep,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  // Form options: Sisakan hanya catatan produk
  const [productHint, setProductHint] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError?.('Mohon unggah file foto produk (.jpg, .png, .webp).');
      return;
    }

    try {
      setIsCompressing(true);
      // Fast client-side image compression down to max 1200px
      // Reduces 10MB camera photo to ~150KB in milliseconds for instant upload & AI processing
      const compressed = await compressImageFile(file, 1200, 0.82);
      onImageSelected(compressed.base64, {
        name: file.name,
        size: `${compressed.compressedSize} (dioptimasi dari ${compressed.originalSize})`,
      });
    } catch (err: any) {
      console.warn('Compress fallback to direct reader:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const sizeKB = (file.size / 1024).toFixed(0) + ' KB';
        onImageSelected(base64, { name: file.name, size: sizeKB });
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSampleClick = (sample: SampleProduct) => {
    fetch(sample.image)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          onImageSelected(reader.result as string, {
            name: `${sample.name}.jpg`,
            size: 'Sample',
          });
          setProductHint(sample.hint);
        };
        reader.readAsDataURL(blob);
      })
      .catch((err) => {
        console.error('Failed to load sample image:', err);
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) {
      onError?.('Silakan pilih atau ambil foto produk terlebih dahulu.');
      return;
    }
    onAnalyze({
      productHint,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Header Sederhana */}
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span>Upload Foto Produk</span>
          <span className="text-xs font-normal text-slate-500">• Kamera HP & Galeri</span>
        </h2>
        <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
          Langkah 1
        </span>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Upload Box atau Preview */}
        {!selectedImage ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
              isDragging
                ? 'border-[#EE4D2D] bg-orange-50/50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/40'
            }`}
          >
            {/* Native file inputs */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  Ambil Foto Produk dari HP atau Pilih File
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Format JPG, PNG, atau WEBP langsung dari memori perangkat
                </p>
              </div>

              {/* Action Buttons: Kamera HP & Galeri */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#EE4D2D] hover:bg-[#D81A07] active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ambil dari Kamera HP</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-xs border border-slate-300 shadow-xs transition-all cursor-pointer"
                >
                  <FileImage className="w-4 h-4 text-slate-500" />
                  <span>Pilih dari Galeri / File</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Preview Foto Terpilih Sederhana */
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-36 h-36 rounded-xl overflow-hidden bg-white shadow-xs border border-slate-200 shrink-0">
                <img
                  src={selectedImage}
                  alt="Foto Produk"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 w-full space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                    ✓ Foto Siap Diproses
                  </span>
                  <button
                    type="button"
                    onClick={onClearImage}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Ganti Foto
                  </button>
                </div>

                <p className="text-xs text-slate-600">
                  Foto ini akan dijadikan tampilan penuh (FULL) pada 3 banner iklan dan dibaca AI untuk menyusun Judul SEO, Deskripsi lengkap, serta Kata Kunci Shopee.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sisakan Catatan Produk Aja (Nama Toko & Harga Dihilangkan) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
            <span>Catatan Produk (Opsional)</span>
            <span className="text-[11px] font-normal text-slate-500">Membantu AI mengenali varian / bahan spesifik</span>
          </label>
          <input
            type="text"
            value={productHint}
            onChange={(e) => setProductHint(e.target.value)}
            placeholder="Contoh: Bahan rajut elastis, sol karet empuk, varian hitam & putih ukuran 39-44"
            className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:border-[#EE4D2D] focus:ring-2 focus:ring-[#EE4D2D]/15 transition-all"
          />
        </div>

        {/* 1-Click Coba Contoh Foto */}
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <p className="text-xs font-semibold text-slate-500">
            Atau coba cepat dengan contoh produk:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {SAMPLE_PRODUCTS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSampleClick(sample)}
                className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all text-left cursor-pointer"
              >
                <img
                  src={sample.image}
                  alt={sample.name}
                  className="w-8 h-8 rounded-lg object-cover bg-white shrink-0"
                />
                <span className="text-[11px] font-semibold text-slate-700 truncate">
                  {sample.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tombol Proses Utama Sederhana */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedImage || isLoading || isCompressing}
            className={`w-full py-3.5 px-6 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
              !selectedImage || isCompressing
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : isLoading
                ? 'bg-slate-700 text-white cursor-wait'
                : 'bg-[#EE4D2D] hover:bg-[#D81A07] active:scale-99 text-white'
            }`}
          >
            {isCompressing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                <span>Mengoptimalkan Ukuran Foto...</span>
              </>
            ) : isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{loadingStep || 'AI Sedang Membaca Foto & Membuat Video + Banner...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Proses: Ubah Versi Foto, Buat Banner & Video 10 Detik</span>
              </>

            )}
          </button>
        </div>
      </div>
    </div>
  );
};

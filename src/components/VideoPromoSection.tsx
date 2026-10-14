import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Film,
  Sparkles,
  Smartphone,
  Square,
  Copy,
  Check,
  Zap,
  Sliders,
  ChevronDown,
  ChevronUp,
  Mic,
  Loader2,
  Radio,
  FileAudio,
} from 'lucide-react';
import { AnalysisResult } from '../types';
import {
  drawVideoFrame,
  recordPromoVideo,
  VideoRenderConfig,
} from '../utils/videoRenderer';
import { promoAudio } from '../utils/audioSynth';
import { loadImage } from '../utils/bannerGenerator';
import { apiUrl } from '../utils/api';

interface VideoPromoSectionProps {
  productImageSrc: string;
  analysisData: AnalysisResult;
  onNotification: (title: string, desc?: string) => void;
  initialStoreName?: string;
  initialDiscount?: string;
}

export const VideoPromoSection: React.FC<VideoPromoSectionProps> = ({
  productImageSrc,
  analysisData,
  onNotification,
  initialStoreName = 'Toko Shopee Official',
  initialDiscount = '50%',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);

  // Video Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // 0.0 to 10.0
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1'>('9:16');
  const [theme, setTheme] = useState<'shopee' | 'tiktok' | 'luxury'>('shopee');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [copiedVoiceover, setCopiedVoiceover] = useState(false);
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  // AI Voice Narration State
  const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Puck' | 'Aoede' | 'Fenrir'>('Kore');
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);
  const [narrationAudioUrl, setNarrationAudioUrl] = useState<string | null>(null);
  const [narrationAudioBlob, setNarrationAudioBlob] = useState<Blob | null>(null);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [isDownloadingAudio, setIsDownloadingAudio] = useState(false);

  // Editable Video Copy
  const fallbackHook = analysisData.videoPromo?.hook || '⚡ FLASH SALE HARI INI DISKON 50%!';
  const fallbackFeatures = analysisData.videoPromo?.features || [
    '100% Produk Original Berkualitas',
    'Material Paling Awet & Nyaman Digunakan',
    'Bisa Bayar Di Tempat (COD) Seluruh Indonesia',
  ];
  const fallbackCta = analysisData.videoPromo?.callToAction || 'CHECKOUT SEKARANG DI SHOPEE SEBELUM HABIS!';

  const [hookText, setHookText] = useState(fallbackHook);
  const [features, setFeatures] = useState<string[]>(fallbackFeatures);
  const [ctaText, setCtaText] = useState(fallbackCta);
  const [discountText, setDiscountText] = useState(initialDiscount ? `DISKON ${initialDiscount.replace(/[^0-9%]/g, '')}` : 'DISKON 50%');

  // Sync state whenever new analysisData arrives (e.g. user selects sample or analyzes new photo)
  useEffect(() => {
    if (analysisData?.videoPromo) {
      if (analysisData.videoPromo.hook) {
        setHookText(analysisData.videoPromo.hook);
      }
      if (analysisData.videoPromo.features && analysisData.videoPromo.features.length > 0) {
        setFeatures(analysisData.videoPromo.features);
      }
      if (analysisData.videoPromo.callToAction) {
        setCtaText(analysisData.videoPromo.callToAction);
      }
    }
    // Reset any previously generated audio so it matches the new product
    setNarrationAudioBlob(null);
    setNarrationAudioUrl(null);
  }, [analysisData]);

  // Load product image for canvas
  useEffect(() => {
    if (!productImageSrc) return;
    let active = true;
    loadImage(productImageSrc)
      .then((img) => {
        if (active) setLoadedImage(img);
      })
      .catch((err) => console.error('Gagal memuat gambar produk untuk video:', err));

    return () => {
      active = false;
    };
  }, [productImageSrc]);

  // Current video render config
  const getConfig = useCallback((): VideoRenderConfig => {
    return {
      aspectRatio,
      theme,
      productName: analysisData.productNameDetected,
      storeName: '100% Produk Original',
      hookText,
      features,
      ctaText,
      badgeText: 'FLASH SALE',
      discountText,
      showCodBadge: true,
      showFreeShippingBadge: true,
    };
  }, [aspectRatio, theme, analysisData.productNameDetected, hookText, features, ctaText, discountText]);

  // Render current frame to canvas
  const renderCurrentTime = useCallback(
    (timeSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = aspectRatio === '9:16' ? 540 : 720;
      const height = aspectRatio === '9:16' ? 960 : 720;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      drawVideoFrame(ctx, width, height, loadedImage, timeSec, getConfig());
    },
    [aspectRatio, loadedImage, getConfig]
  );

  // Redraw whenever props or current time changes
  useEffect(() => {
    renderCurrentTime(currentTime);
  }, [currentTime, renderCurrentTime]);

  // Combined script for AI voice narration - tailored specifically to the product
  const getFullNarrationText = useCallback(() => {
    const productName = analysisData.productNameDetected || 'produk ini';
    const hook = analysisData.videoPromo?.voiceoverScript?.hookText || hookText || `Stop scroll! Khusus hari ini ada promo spesial untuk ${productName}!`;
    const defaultFeat = features && features.length > 0
      ? features.join('. ') + '!'
      : 'Kualitas 100% original, material pilihan terbaik, dan bergaransi resmi!';
    const feat = analysisData.videoPromo?.voiceoverScript?.featureText || defaultFeat;
    const cta = analysisData.videoPromo?.voiceoverScript?.ctaText || ctaText || 'Bisa COD dan gratis ongkir se-Indonesia. Yuk klik keranjang Shopee sekarang sebelum kehabisan!';
    return `${hook} ${feat} ${cta}`;
  }, [analysisData, hookText, features, ctaText]);

  // Generate Natural AI Voice using Gemini 3.8 Flash Lite TTS API
  const handleGenerateVoiceNarration = async (
    customVoice?: 'Kore' | 'Puck' | 'Aoede' | 'Fenrir',
    autoPlay: boolean = true
  ): Promise<Blob | null> => {
    const voiceToUse = customVoice || selectedVoice;
    setIsGeneratingTts(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s max

    try {
      const textToSpeak = getFullNarrationText();
      const response = await fetch(apiUrl('/api/generate-narration'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          text: textToSpeak,
          voiceName: voiceToUse,
          stylePrompt: 'Enthusiastic, energetic and clear Indonesian host for Shopee & TikTok live sales promotion',
        }),
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      if (!response.ok || !data.success || !data.audioBase64) {
        throw new Error(data.error || 'Gagal menghasilkan suara narasi AI');
      }

      // Convert Base64 WAV to Blob & URL
      const byteCharacters = atob(data.audioBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.mimeType || 'audio/wav' });
      const url = URL.createObjectURL(blob);

      setNarrationAudioBlob(blob);
      setNarrationAudioUrl(url);

      onNotification(
        'Suara AI Natural Siap!',
        `Narasi bahasa Indonesia (${voiceToUse === 'Kore' ? 'Wanita Energik' : voiceToUse === 'Aoede' ? 'Wanita Ramah' : voiceToUse === 'Puck' ? 'Pria Energik' : 'Pria Mantap'}) digabung langsung ke video Shopee.`
      );

      // Automatically play preview if autoPlay requested
      if (autoPlay) {
        setCurrentTime(0);
        setIsPlaying(true);
        if (!isAudioMuted && isTtsEnabled) {
          promoAudio.playNarration(url, 0);
        }
      }

      return blob;
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn('Voice generation note:', err);
      // Don't disturb user if auto-generation had a hiccup; video background synth music still works flawlessly
      return null;
    } finally {
      setIsGeneratingTts(false);
    }
  };

  // Automatically generate AI voice narration on mount so it's ready without any extra steps
  const hasAutoGeneratedVoiceRef = useRef(false);
  useEffect(() => {
    if (!hasAutoGeneratedVoiceRef.current && !narrationAudioBlob) {
      hasAutoGeneratedVoiceRef.current = true;
      handleGenerateVoiceNarration('Kore', false);
    }
  }, []);


  // Synchronize audio playback with video play/pause
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTimestampRef.current = null;
      promoAudio.stopAll();
      return;
    }

    // Audio handling: BGM and Voice Narration
    if (!isAudioMuted) {
      promoAudio.startBgm();
      if (narrationAudioUrl && isTtsEnabled) {
        promoAudio.playNarration(narrationAudioUrl, currentTime);
      }
    } else {
      promoAudio.stopAll();
    }

    const step = (now: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = now;
      }

      const delta = (now - lastTimestampRef.current) / 1000;
      lastTimestampRef.current = now;

      setCurrentTime((prev) => {
        const next = prev + delta;
        if (next >= 10.0) {
          // Loop video automatically or stop
          setIsPlaying(false);
          promoAudio.stopAll();
          return 10.0;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(step);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      promoAudio.stopAll();
    };
  }, [isPlaying, isAudioMuted, narrationAudioUrl, isTtsEnabled]);

  // Handlers
  const togglePlay = () => {
    if (currentTime >= 10.0) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setCurrentTime(0);
    setIsPlaying(true);
    if (!isAudioMuted) {
      promoAudio.startBgm();
      if (narrationAudioUrl && isTtsEnabled) {
        promoAudio.playNarration(narrationAudioUrl, 0);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    renderCurrentTime(val);
    promoAudio.seekNarration(val);
  };

  const toggleAudio = () => {
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    if (isPlaying) {
      if (nextMuted) {
        promoAudio.stopAll();
      } else {
        promoAudio.startBgm();
        if (narrationAudioUrl && isTtsEnabled) {
          promoAudio.playNarration(narrationAudioUrl, currentTime);
        }
      }
    }
  };

  // Video Export / Recording - embeds AI voice narration and upbeat BGM directly into the video
  const handleDownloadVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsPlaying(false);
      promoAudio.stopAll();
      setIsRecording(true);
      setRecordProgress(0);

      // Auto-ensure AI voice narration is generated and ready
      let audioBlobToUse = narrationAudioBlob;
      if (!audioBlobToUse) {
        onNotification(
          'Menyiapkan Suara Narasi AI Natural...',
          'Membuat suara narasi AI Bahasa Indonesia sebelum menggabungkan video.'
        );
        audioBlobToUse = await handleGenerateVoiceNarration(selectedVoice, false);
      }

      onNotification(
        'Merekam Video 10 Detik Lengkap Suara...',
        'Sedang menggabungkan video animasi HD, narasi suara AI, dan musik latar. Siap diupload langsung ke Shopee!'
      );

      const blob = await recordPromoVideo(
        canvas,
        loadedImage,
        getConfig(),
        (progress) => {
          setRecordProgress(progress);
        },
        {
          narrationBlob: audioBlobToUse,
          includeBgm: !isAudioMuted,
        }
      );

      // Determine proper file extension (.mp4 or .webm)
      const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
      const cleanProductName = (analysisData.productNameDetected || 'produk')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 20);
      const filename = `video-shopee-${cleanProductName}-${aspectRatio === '9:16' ? 'story-9x16' : 'feed-1x1'}-dengan-suara.${ext}`;

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onNotification(
        'Video Berhasil Diunduh (Lengkap Suara)!',
        'Video sudah memiliki suara narasi AI & musik. Langsung upload ke Shopee Video / TikTok tanpa perlu diedit lagi!'
      );
    } catch (err: any) {
      console.error('Record error:', err);
      onNotification('Gagal merekam video', err.message || 'Silakan coba lagi');
    } finally {
      setIsRecording(false);
      setRecordProgress(0);
      renderCurrentTime(currentTime);
    }
  };


  // Download AI Narration Audio (WAV) directly
  const handleDownloadAudioOnly = () => {
    if (!narrationAudioBlob) return;
    try {
      setIsDownloadingAudio(true);
      const url = URL.createObjectURL(narrationAudioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suara-narasi-ai-shopee-${selectedVoice.toLowerCase()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onNotification(
        'Audio Narasi AI Berhasil Diunduh!',
        'Format WAV studio berkualitas tinggi, dapat dipakai langsung di CapCut, Shopee Video, atau TikTok.'
      );
    } catch (e: any) {
      onNotification('Gagal mengunduh audio', e.message);
    } finally {
      setIsDownloadingAudio(false);
    }
  };

  // Voiceover Copy Handler - strictly tailored to active product
  const activeHook = analysisData.videoPromo?.voiceoverScript?.hookText || hookText || `Stop scroll! Khusus hari ini ada promo spesial untuk ${analysisData.productNameDetected}!`;
  const defaultFeatureScript = features && features.length > 0
    ? features.join('. ') + '!'
    : 'Kualitas 100% original, material pilihan terbaik, dan bergaransi resmi.';
  const activeFeature = analysisData.videoPromo?.voiceoverScript?.featureText || defaultFeatureScript;
  const activeCta = analysisData.videoPromo?.voiceoverScript?.ctaText || ctaText || 'Bisa COD dan gratis ongkir XTRA se-Indonesia! Buruan klik keranjang Shopee sekarang sebelum stok habis!';

  const voiceoverText = `[0-3 DETIK - HOOK]\n${activeHook}\n\n[3-7 DETIK - FITUR & KEUNGGULAN]\n${activeFeature}\n\n[7-10 DETIK - CALL TO ACTION]\n${activeCta}`;

  const handleCopyVoiceover = () => {
    navigator.clipboard.writeText(voiceoverText);
    setCopiedVoiceover(true);
    onNotification(
      'Naskah Voiceover Tersalin!',
      'Naskah video 10 detik siap dibaca saat live streaming atau rekaman konten.'
    );
    setTimeout(() => setCopiedVoiceover(false), 2500);
  };

  // Current Scene Title based on timeline
  const getCurrentSceneLabel = () => {
    if (currentTime < 3.0) return 'Detik 0-3: Hook Flash Sale & Penarik Perhatian';
    if (currentTime < 7.0) return 'Detik 3-7: Keunggulan Produk & Garansi';
    return 'Detik 7-10: Call to Action & Checkout Shopee';
  };

  return (
    <div id="video-promosi-section" className="bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-7 shadow-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-[#EE4D2D] font-extrabold text-[11px] mb-2 uppercase tracking-wider">
            <Film className="w-3.5 h-3.5" />
            <span>Fitur Baru: Video Promosi 10 Detik</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Video Iklan Shopee & TikTok</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
              10s Auto-Selling
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Format video animasi 10 detik dirancang khusus algoritma Shopee Video, TikTok Shop, & Instagram Reels.
            Lengkap dengan <strong>narasi suara AI Bahasa Indonesia natural</strong> dan musik latar otomatis.
          </p>
        </div>

        {/* Aspect Ratio Switcher */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setAspectRatio('9:16')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              aspectRatio === '9:16'
                ? 'bg-[#EE4D2D] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>9:16 Story/Reels</span>
          </button>

          <button
            type="button"
            onClick={() => setAspectRatio('1:1')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              aspectRatio === '1:1'
                ? 'bg-[#EE4D2D] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>1:1 Feed</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Player on left, Customizer & AI Voice on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Canvas Player */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl p-3 sm:p-4 shadow-xl border border-slate-800">
            {/* Top Indicator bar */}
            <div className="flex items-center justify-between text-slate-300 text-[11px] mb-2 px-1">
              <span className="font-semibold truncate max-w-[220px]">
                {getCurrentSceneLabel()}
              </span>
              <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-orange-400 font-bold">
                {currentTime.toFixed(1)}s / 10.0s
              </span>
            </div>

            {/* Canvas Box */}
            <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-inner aspect-[9/16] max-h-[520px] w-full">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain cursor-pointer"
                onClick={togglePlay}
              />

              {/* Play Overlay if paused */}
              {!isPlaying && !isRecording && (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/60 hover:bg-[#EE4D2D]/90 text-white flex items-center justify-center backdrop-blur-xs transition-transform transform hover:scale-110 active:scale-95 cursor-pointer shadow-lg z-10"
                  aria-label="Putar Video"
                >
                  <Play className="w-8 h-8 fill-white ml-1" />
                </button>
              )}

              {/* Recording Overlay */}
              {isRecording && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-4 z-20">
                  <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="font-bold text-sm">Sedang Merender Video...</p>
                  <p className="text-xs text-orange-300 mt-1 font-mono">{recordProgress}% Selesai</p>
                  <div className="w-48 bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className="bg-[#EE4D2D] h-full transition-all duration-100"
                      style={{ width: `${recordProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Scrubber */}
            <div className="mt-3 space-y-1 px-1">
              <input
                type="range"
                min="0"
                max="10"
                step="0.05"
                value={currentTime}
                onChange={handleSeek}
                className="w-full accent-[#EE4D2D] cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />

              {/* Scene markers */}
              <div className="flex justify-between text-[10px] text-slate-400 font-mono px-0.5">
                <span className={currentTime < 3 ? 'text-orange-400 font-bold' : ''}>0s: Hook</span>
                <span className={currentTime >= 3 && currentTime < 7 ? 'text-blue-400 font-bold' : ''}>3s: Fitur</span>
                <span className={currentTime >= 7 ? 'text-red-400 font-bold' : ''}>7s: CTA</span>
                <span>10s</span>
              </div>
            </div>

            {/* Control Bar */}
            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title={isPlaying ? 'Jeda' : 'Putar'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                </button>

                <button
                  type="button"
                  onClick={handleRestart}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Ulangi dari Awal"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer ${
                    !isAudioMuted
                      ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                      : 'bg-white/10 text-slate-400 hover:bg-white/20'
                  }`}
                  title={isAudioMuted ? 'Nyalakan Audio' : 'Matikan Audio'}
                >
                  {!isAudioMuted ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] font-bold">Audio On</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[11px]">Bisu</span>
                    </>
                  )}
                </button>
              </div>

              {/* Download Video Button */}
              <button
                type="button"
                onClick={handleDownloadVideo}
                disabled={isRecording}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#EE4D2D] to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isRecording ? `Merekam (${recordProgress}%)...` : 'Unduh Video (10s)'}</span>
              </button>
            </div>
          </div>

          {/* Quick Direct Download Shopee Banner - No edit required */}
          <div className="w-full max-w-md mt-4 bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-extrabold text-xs sm:text-sm text-emerald-950">
                    Video Siap Langsung Upload ke Shopee
                  </h4>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                    Suara AI + Musik
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-snug mt-1">
                  <strong>Simpel & praktis:</strong> Video 10 detik ini sudah otomatis digabung dengan narasi suara AI Bahasa Indonesia & musik latar. Tidak perlu edit lagi di CapCut atau aplikasi lain — langsung unduh dan pasang di Shopee Video!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadVideo}
              disabled={isRecording}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#EE4D2D] via-orange-600 to-red-600 hover:from-[#d43f20] hover:to-red-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 disabled:opacity-50"
            >
              {isRecording ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sedang Merender Video + Suara ({recordProgress}%)...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh Video Langsung Ada Suara (Siap Upload Shopee)</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-[11px] text-emerald-900 pt-0.5 px-1 font-medium border-t border-emerald-200/80">
              <span className="flex items-center gap-1">
                🎙️ Suara AI: <strong>{selectedVoice === 'Kore' ? 'Kore (Wanita Energik)' : selectedVoice === 'Aoede' ? 'Aoede (Wanita Ramah)' : selectedVoice === 'Puck' ? 'Puck (Pria Energik)' : 'Fenrir (Pria Mantap)'}</strong>
              </span>
              <span className="flex items-center gap-1">
                🎵 Musik: <strong>{isAudioMuted ? 'Mute' : 'Upbeat Aktif'}</strong>
              </span>
            </div>
          </div>
        </div>


        {/* Right Column: AI Voice Narration, Theme, and Customizer */}
        <div className="lg:col-span-5 space-y-4">

          {/* AI VOICE NARRATION BOX (Pilihan Suara AI Natural) */}
          <div className="bg-gradient-to-br from-white via-orange-50/40 to-amber-50/50 p-4 sm:p-5 rounded-2xl border-2 border-orange-300 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-orange-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#EE4D2D] to-amber-500 flex items-center justify-center text-white shadow-xs">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                    <span>Narasi Suara AI Natural</span>
                    <span className="text-[10px] bg-red-500 text-white font-bold px-1.5 py-0.2 rounded-full uppercase tracking-wider animate-pulse">
                      Gemini TTS
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bicara bahasa Indonesia logat sales e-commerce jernih & meyakinkan
                  </p>
                </div>
              </div>

              {narrationAudioUrl && (
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Siap Putar
                  </span>
                </div>
              )}
            </div>

            {/* Voice Persona Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <span>Pilih Karakter Pengisi Suara (Voice):</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVoice('Kore')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedVoice === 'Kore'
                      ? 'border-[#EE4D2D] bg-orange-100/70 text-slate-900 font-black ring-2 ring-orange-300 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-[#EE4D2D]">👩 Kore</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-200 text-orange-950 font-bold">Populer</span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">Wanita Energik & Ceria (Host Live)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedVoice('Aoede')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedVoice === 'Aoede'
                      ? 'border-pink-500 bg-pink-50 text-slate-900 font-black ring-2 ring-pink-300 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-pink-600">👩 Aoede</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-pink-100 text-pink-800 font-bold">Lembut</span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">Wanita Ramah & Hangat (Storytelling)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedVoice('Puck')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedVoice === 'Puck'
                      ? 'border-blue-500 bg-blue-50 text-slate-900 font-black ring-2 ring-blue-300 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-blue-600">👨 Puck</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">Hype</span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">Pria Muda Cepat & Bersemangat</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedVoice('Fenrir')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedVoice === 'Fenrir'
                      ? 'border-indigo-500 bg-indigo-50 text-slate-900 font-black ring-2 ring-indigo-300 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-indigo-600">👨 Fenrir</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">Resmi</span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">Pria Dewasa Mantap & Berwibawa</div>
                </button>
              </div>
            </div>

            {/* Action Buttons: Generate Voice & Download Audio */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleGenerateVoiceNarration()}
                disabled={isGeneratingTts}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#EE4D2D] hover:bg-[#d43f20] text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
              >
                {isGeneratingTts ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI Sedang Mengisi Suara...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>{narrationAudioUrl ? 'Perbarui Suara Narasi AI' : 'Buat Suara Narasi AI Natural'}</span>
                  </>
                )}
              </button>

              {narrationAudioBlob && (
                <button
                  type="button"
                  onClick={handleDownloadAudioOnly}
                  disabled={isDownloadingAudio}
                  className="py-2.5 px-3 rounded-xl bg-white border border-orange-300 hover:bg-orange-50 text-[#EE4D2D] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  title="Unduh file suara WAV untuk dipakai di CapCut atau Shopee"
                >
                  <FileAudio className="w-4 h-4" />
                  <span>Unduh Audio (WAV)</span>
                </button>
              )}
            </div>

            {/* Voice toggle */}
            {narrationAudioUrl && (
              <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-orange-200 text-xs">
                <span className="text-slate-700 font-semibold flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-[#EE4D2D]" />
                  <span>Sinkronisasi suara narasi saat video diputar:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                    isTtsEnabled
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isTtsEnabled ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#EE4D2D]" />
              <span>Gaya Tampilan Video:</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTheme('shopee')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  theme === 'shopee'
                    ? 'border-[#EE4D2D] bg-orange-50/80 text-orange-950 font-extrabold ring-2 ring-orange-200'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="text-xs">🛍️ Shopee</div>
                <div className="text-[10px] text-slate-500 font-normal">Flash Sale</div>
              </button>

              <button
                type="button"
                onClick={() => setTheme('tiktok')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  theme === 'tiktok'
                    ? 'border-cyan-500 bg-slate-900 text-cyan-400 font-extrabold ring-2 ring-cyan-200'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="text-xs">📱 TikTok</div>
                <div className="text-[10px] text-slate-500 font-normal">Viral Neon</div>
              </button>

              <button
                type="button"
                onClick={() => setTheme('luxury')}
                className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                  theme === 'luxury'
                    ? 'border-amber-600 bg-stone-900 text-amber-400 font-extrabold ring-2 ring-amber-200'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className="text-xs">✨ Luxury</div>
                <div className="text-[10px] text-slate-500 font-normal">Elegan Eksklusif</div>
              </button>
            </div>
          </div>

          {/* 10-Second Voiceover Script (Naskah Bacaan) */}
          <div className="bg-white p-4 rounded-2xl border border-orange-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#EE4D2D]" />
                <h3 className="font-extrabold text-xs text-slate-900">
                  Naskah Voiceover 10 Detik
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCopyVoiceover}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-100 hover:bg-orange-200 text-[#EE4D2D] font-bold text-xs transition-colors cursor-pointer"
              >
                {copiedVoiceover ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Salin Naskah</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              Naskah ini dibaca otomatis oleh suara AI atau dapat Anda baca sendiri saat live di Shopee/TikTok:
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-2 font-sans">
              <div>
                <span className="font-bold text-[#EE4D2D] text-[10px] uppercase block">
                  0-3s (Hook Pembuka):
                </span>
                <p className="text-slate-800 leading-relaxed italic">
                  &ldquo;{activeHook}&rdquo;
                </p>
              </div>

              <div>
                <span className="font-bold text-blue-600 text-[10px] uppercase block">
                  3-7s (Fitur & Keunggulan Sesuai Produk):
                </span>
                <p className="text-slate-800 leading-relaxed italic">
                  &ldquo;{activeFeature}&rdquo;
                </p>
              </div>

              <div>
                <span className="font-bold text-red-600 text-[10px] uppercase block">
                  7-10s (Ajakan Checkout Shopee):
                </span>
                <p className="text-slate-800 leading-relaxed italic">
                  &ldquo;{activeCta}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Accordion: Edit Video Text */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowEditor(!showEditor)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-800">
                  Kustomisasi Teks & Skenario Video
                </span>
              </div>
              {showEditor ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showEditor && (
              <div className="p-4 pt-1 border-t border-slate-100 space-y-3 animate-in fade-in">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Teks Hook Detik 0-3 (Penarik Perhatian):
                  </label>
                  <input
                    type="text"
                    value={hookText}
                    onChange={(e) => setHookText(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#EE4D2D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    3 Poin Keunggulan Detik 3-7:
                  </label>
                  <div className="space-y-1.5">
                    {features.map((feat, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={feat}
                        onChange={(e) => {
                          const updated = [...features];
                          updated[idx] = e.target.value;
                          setFeatures(updated);
                        }}
                        placeholder={`Fitur ${idx + 1}`}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#EE4D2D]"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Teks Call to Action Detik 7-10:
                  </label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#EE4D2D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Badge Diskon:
                  </label>
                  <input
                    type="text"
                    value={discountText}
                    onChange={(e) => setDiscountText(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#EE4D2D]"
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

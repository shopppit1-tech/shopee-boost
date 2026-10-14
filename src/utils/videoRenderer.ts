// Canvas-based 10-second Promo Video Rendering Engine
// Supports 9:16 (Shopee Video / TikTok / Reels) and 1:1 (Feed)

export interface VideoRenderConfig {
  aspectRatio: '9:16' | '1:1';
  theme: 'shopee' | 'tiktok' | 'luxury';
  productName: string;
  storeName: string;
  hookText: string;
  features: string[];
  ctaText: string;
  badgeText: string;
  discountText: string;
  showCodBadge: boolean;
  showFreeShippingBadge: boolean;
}

export function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  image: HTMLImageElement | null,
  timeSec: number, // 0.0 to 10.0
  config: VideoRenderConfig
) {
  // Clamp time
  const t = Math.max(0, Math.min(10, timeSec));
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Determine current scene phase
  // Phase 1: 0.0 - 3.0 (Hook)
  // Phase 2: 3.0 - 7.0 (Features)
  // Phase 3: 7.0 - 10.0 (CTA)
  const isPhase1 = t < 3.0;
  const isPhase2 = t >= 3.0 && t < 7.0;
  const isPhase3 = t >= 7.0;

  // 1. Draw Background based on Theme
  if (config.theme === 'shopee') {
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#EE4D2D');
    grad.addColorStop(0.35, '#FF7A59');
    grad.addColorStop(0.7, '#F6F7F9');
    grad.addColorStop(1, '#FFFFFF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Dynamic background diagonal stripes
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 24;
    const offset = (t * 40) % 60;
    for (let x = -height; x < width + height; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x + offset, 0);
      ctx.lineTo(x + offset + height * 0.5, height);
      ctx.stroke();
    }
    ctx.restore();
  } else if (config.theme === 'tiktok') {
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#09090b');
    grad.addColorStop(0.4, '#18181b');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Neon atmospheric glow
    const pulse = Math.sin(t * 3) * 0.15 + 0.35;
    const glow1 = ctx.createRadialGradient(width * 0.2, height * 0.2, 20, width * 0.2, height * 0.2, width * 0.6);
    glow1.addColorStop(0, `rgba(236, 72, 153, ${pulse})`);
    glow1.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, width, height);

    const glow2 = ctx.createRadialGradient(width * 0.8, height * 0.7, 20, width * 0.8, height * 0.7, width * 0.6);
    glow2.addColorStop(0, `rgba(6, 182, 212, ${pulse * 0.8})`);
    glow2.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Luxury Minimalist
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#1c1917');
    grad.addColorStop(0.5, '#292524');
    grad.addColorStop(1, '#0c0a09');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Subtle gold border
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, width - 32, height - 32);
  }

  // 2. Draw Top Store Bar & Progress Indicator
  const headerY = config.aspectRatio === '9:16' ? 44 : 28;
  ctx.save();
  // Product quality pill (Tanpa nama toko)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  roundRect(ctx, 24, headerY, 210, 36, 18);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('★ 100% PRODUK ORIGINAL', 36, headerY + 23);

  // Shopee Video / TikTok live badge
  const liveBadgeX = width - 120;
  ctx.fillStyle = '#EF4444';
  roundRect(ctx, liveBadgeX, headerY, 96, 36, 18);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔴 PROMO 10s', liveBadgeX + 48, headerY + 23);
  ctx.textAlign = 'left';
  ctx.restore();

  // 3. Central Product Stage & Motion
  const isVertical = config.aspectRatio === '9:16';
  const stageCenterX = width / 2;
  const stageCenterY = isVertical ? height * 0.44 : height * 0.48;
  const stageSize = isVertical ? width * 0.78 : width * 0.65;

  // Dynamic Camera Zoom & Breathing
  let scale = 1.0;
  let offsetY = 0;
  if (isPhase1) {
    // Dramatic zoom in from 0.85 to 1.05
    const progress = t / 3.0;
    scale = 0.88 + progress * 0.17;
  } else if (isPhase2) {
    // Gentle breathing floating
    const phase2Time = t - 3.0;
    scale = 1.03 + Math.sin(phase2Time * 2.5) * 0.03;
    offsetY = Math.sin(phase2Time * 2) * 8;
  } else {
    // Phase 3 urgency pulse
    const phase3Time = t - 7.0;
    scale = 1.02 + Math.abs(Math.sin(phase3Time * 4)) * 0.04;
  }

  // Product Stage Shadow & Background Card
  ctx.save();
  ctx.translate(stageCenterX, stageCenterY + offsetY);
  ctx.scale(scale, scale);

  // Soft shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 15;

  // Background card for product
  ctx.fillStyle = config.theme === 'tiktok' ? '#1e293b' : '#FFFFFF';
  roundRect(ctx, -stageSize / 2, -stageSize / 2, stageSize, stageSize, 28);
  ctx.fill();

  ctx.shadowColor = 'transparent';

  // Draw product photo inside card
  if (image && image.complete && image.naturalWidth > 0) {
    ctx.save();
    roundRect(ctx, -stageSize / 2 + 8, -stageSize / 2 + 8, stageSize - 16, stageSize - 16, 22);
    ctx.clip();

    // Cover fit
    const imgRatio = image.naturalWidth / image.naturalHeight;
    const cardRatio = 1.0;
    let dw = stageSize - 16;
    let dh = stageSize - 16;
    let dx = -stageSize / 2 + 8;
    let dy = -stageSize / 2 + 8;

    if (imgRatio > cardRatio) {
      dw = dh * imgRatio;
      dx = -dw / 2;
    } else {
      dh = dw / imgRatio;
      dy = -dh / 2;
    }

    ctx.drawImage(image, dx, dy, dw, dh);
    ctx.restore();
  } else {
    // Fallback if image not ready
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Foto Produk Shopee', 0, 0);
    ctx.textAlign = 'left';
  }

  // Corner Discount Badge
  if (config.discountText) {
    const badgeX = stageSize / 2 - 85;
    const badgeY = -stageSize / 2 + 15;
    ctx.fillStyle = '#EF4444';
    roundRect(ctx, badgeX, badgeY, 75, 34, 10);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(config.discountText, badgeX + 37, badgeY + 22);
    ctx.textAlign = 'left';
  }

  ctx.restore();

  // 4. Phase-Specific Overlays (Hook / Features / CTA)
  if (isPhase1) {
    // ====== PHASE 1 (0s - 3s): HOOK ======
    const hookY = isVertical ? headerY + 65 : 75;
    const pulse = 1 + Math.sin(t * 8) * 0.04;

    ctx.save();
    ctx.translate(width / 2, hookY + 30);
    ctx.scale(pulse, pulse);

    // Glowing Hook Badge
    ctx.fillStyle = '#FBBF24';
    ctx.shadowColor = 'rgba(251, 191, 36, 0.7)';
    ctx.shadowBlur = 20;
    roundRect(ctx, -width * 0.44, -26, width * 0.88, 52, 26);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#78350F';
    ctx.font = '900 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(config.hookText || '⚡ FLASH SALE HARI INI!', 0, 6);
    ctx.restore();

    // Hook Subtext banner below product
    const subY = isVertical ? height * 0.76 : height * 0.82;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    roundRect(ctx, 24, subY, width - 48, 64, 18);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Promo Terbatas Shopee Live & Video!', width / 2, subY + 28);
    ctx.fillStyle = '#FDE047';
    ctx.font = '800 13px sans-serif';
    ctx.fillText('★ Garansi 100% Original & Real Picture', width / 2, subY + 50);
    ctx.restore();
  } else if (isPhase2) {
    // ====== PHASE 2 (3s - 7s): FEATURES ======
    const topBadgeY = isVertical ? headerY + 60 : 70;
    ctx.save();
    ctx.fillStyle = config.theme === 'tiktok' ? '#06b6d4' : '#EE4D2D';
    roundRect(ctx, 24, topBadgeY, width - 48, 44, 14);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KEUNGGULAN PRODUK:', width / 2, topBadgeY + 28);
    ctx.restore();

    // Animated Feature Cards sliding in from bottom
    const featuresStartY = isVertical ? height * 0.72 : height * 0.76;
    const cardHeight = isVertical ? 38 : 34;
    const gap = 8;

    const featureList = config.features && config.features.length > 0
      ? config.features
      : ['100% Bahan Berkualitas & Awet', 'Jahitan Presisi & QC Ketat', 'Bisa Bayar Di Tempat (COD)'];

    featureList.slice(0, 3).forEach((feat, index) => {
      // Stagger card entry: index 0 at 3.0s, index 1 at 4.0s, index 2 at 5.0s
      const cardEntryTime = 3.0 + index * 0.8;
      const cardProgress = Math.max(0, Math.min(1, (t - cardEntryTime) / 0.4));
      const cardY = featuresStartY + index * (cardHeight + gap);

      if (cardProgress > 0) {
        ctx.save();
        const slideOffset = (1 - cardProgress) * 40;
        ctx.globalAlpha = cardProgress;
        ctx.translate(slideOffset, 0);

        // Card background
        ctx.fillStyle = config.theme === 'tiktok' ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 10;
        roundRect(ctx, 24, cardY, width - 48, cardHeight, 10);
        ctx.fill();

        // Check icon
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(46, cardY + cardHeight / 2, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓', 46, cardY + cardHeight / 2 + 4);

        // Feature text
        ctx.fillStyle = config.theme === 'tiktok' ? '#F8FAFC' : '#1E293B';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(feat, 66, cardY + cardHeight / 2 + 4);
        ctx.restore();
      }
    });
  } else {
    // ====== PHASE 3 (7s - 10s): CALL TO ACTION ======
    const urgencyY = isVertical ? headerY + 60 : 70;
    ctx.save();
    // Urgency banner
    ctx.fillStyle = '#DC2626';
    roundRect(ctx, 24, urgencyY, width - 48, 44, 14);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ SISA WAKTU PROMO: HARI INI SAJA!', width / 2, urgencyY + 28);
    ctx.restore();

    // Big Bouncing Call To Action Button
    const ctaY = isVertical ? height * 0.74 : height * 0.78;
    const bounce = 1 + Math.abs(Math.sin((t - 7) * 6)) * 0.05;

    ctx.save();
    ctx.translate(width / 2, ctaY + 36);
    ctx.scale(bounce, bounce);

    // Glow
    ctx.shadowColor = '#EE4D2D';
    ctx.shadowBlur = 24;

    // CTA Button
    const btnGrad = ctx.createLinearGradient(0, -32, 0, 32);
    btnGrad.addColorStop(0, '#EE4D2D');
    btnGrad.addColorStop(1, '#B91C1C');
    ctx.fillStyle = btnGrad;
    roundRect(ctx, -width * 0.44, -32, width * 0.88, 64, 20);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(config.ctaText || '🛒 CHECKOUT DI SHOPEE SEKARANG!', 0, 6);
    ctx.restore();

    // Gratis Ongkir + COD sub-badge
    const badgesY = isVertical ? height * 0.88 : height * 0.90;
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    roundRect(ctx, 36, badgesY, width - 72, 34, 17);
    ctx.fill();

    ctx.fillStyle = '#FDE047';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚚 GRATIS ONGKIR XTRA • 📦 BISA COD SELURUH INDONESIA', width / 2, badgesY + 22);
    ctx.restore();
  }

  // 5. Bottom Timeline Bar (0 to 10 seconds)
  const barY = height - 10;
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(0, barY, width, 10);

  // Filled progress
  const progressPercent = t / 10.0;
  ctx.fillStyle = '#EE4D2D';
  ctx.fillRect(0, barY, width * progressPercent, 10);

  // Marker notches at 3s and 7s
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(width * 0.3, barY, 2, 10);
  ctx.fillRect(width * 0.7, barY, 2, 10);
  ctx.restore();

  ctx.restore();
}

// Utility to draw smooth rounded rectangles on canvas
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export interface VideoRecordAudioOptions {
  narrationBlob?: Blob | null;
  includeBgm?: boolean;
}

// Client-side recorder using Canvas captureStream, Web Audio API & MediaRecorder
// Directly merges AI voice narration and upbeat background music into the output video
export async function recordPromoVideo(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | null,
  config: VideoRenderConfig,
  onProgress?: (progress: number) => void,
  audioOptions?: VideoRecordAudioOptions
): Promise<Blob> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context tidak tersedia');

  // Initialize Web Audio API to mix narration and upbeat BGM
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  let audioCtx: AudioContext | null = null;
  let audioDestination: MediaStreamAudioDestinationNode | null = null;

  try {
    audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    audioDestination = audioCtx.createMediaStreamDestination();
  } catch (err) {
    console.warn('AudioContext initialization for video recording failed:', err);
  }

  // If audio is available, schedule narration and background music
  if (audioCtx && audioDestination) {
    const startTime = audioCtx.currentTime;

    // 1. Decode & play AI Voice Narration if provided
    if (audioOptions?.narrationBlob) {
      try {
        const arrayBuffer = await audioOptions.narrationBlob.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;

        const voiceGain = audioCtx.createGain();
        voiceGain.gain.setValueAtTime(1.1, startTime);

        source.connect(voiceGain);
        voiceGain.connect(audioDestination);
        source.start(startTime);
      } catch (voiceErr) {
        console.warn('Failed to decode narration blob for video export:', voiceErr);
      }
    }

    // 2. Synthesize upbeat background groove (125 BPM) for 10 seconds if enabled
    if (audioOptions?.includeBgm !== false) {
      const stepDuration = 0.125;
      const totalSteps = Math.ceil(10.2 / stepDuration);
      const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 880.0, 1046.5];
      const hasNarration = Boolean(audioOptions?.narrationBlob);

      for (let step = 0; step < totalSteps; step++) {
        const t = startTime + step * stepDuration;
        const beat = step % 16;

        // Kick drum on beat 0, 4, 8, 12
        if (beat % 4 === 0) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.frequency.setValueAtTime(140, t);
          osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
          gain.gain.setValueAtTime(hasNarration ? 0.22 : 0.38, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
          osc.connect(gain);
          gain.connect(audioDestination);
          osc.start(t);
          osc.stop(t + 0.14);
        }

        // Crisp hi-hat on even beats
        if (beat % 2 === 0) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(6000, t);
          osc.frequency.exponentialRampToValueAtTime(1000, t + 0.04);
          gain.gain.setValueAtTime(hasNarration ? 0.05 : 0.11, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
          osc.connect(gain);
          gain.connect(audioDestination);
          osc.start(t);
          osc.stop(t + 0.04);
        }

        // Cheerful melody note on odd beats
        if (beat % 2 === 1) {
          const note = melody[Math.floor(step / 2) % melody.length];
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(note, t);
          gain.gain.setValueAtTime(hasNarration ? 0.06 : 0.14, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          osc.connect(gain);
          gain.connect(audioDestination);
          osc.start(t);
          osc.stop(t + 0.12);
        }
      }
    }
  }

  // Combine video tracks and audio tracks into a single stream
  const canvasStream = canvas.captureStream(30);
  const combinedTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

  if (audioDestination) {
    const audioTracks = audioDestination.stream.getAudioTracks();
    if (audioTracks.length > 0) {
      combinedTracks.push(audioTracks[0]);
    }
  }

  const recordStream = new MediaStream(combinedTracks);

  // Check supported MIME types with audio support
  const candidateMimes = [
    'video/mp4;codecs=avc1,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  let chosenMime = '';
  for (const mime of candidateMimes) {
    if (MediaRecorder.isTypeSupported(mime)) {
      chosenMime = mime;
      break;
    }
  }

  const recorder = new MediaRecorder(recordStream, chosenMime ? { mimeType: chosenMime } : undefined);
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      // Clean up audio context
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
      const blob = new Blob(chunks, { type: recorder.mimeType || chosenMime || 'video/webm' });
      resolve(blob);
    };

    recorder.onerror = (err) => {
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
      reject(err);
    };

    recorder.start(100);

    const totalFrames = 300; // 30 fps * 10 seconds
    let currentFrame = 0;
    const intervalMs = 1000 / 30;

    const timer = setInterval(() => {
      currentFrame++;
      const timeSec = (currentFrame / totalFrames) * 10.0;
      drawVideoFrame(ctx, canvas.width, canvas.height, image, timeSec, config);

      if (onProgress) {
        onProgress(Math.min(100, Math.round((currentFrame / totalFrames) * 100)));
      }

      if (currentFrame >= totalFrames) {
        clearInterval(timer);
        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop();
          }
        }, 200);
      }
    }, intervalMs);
  });
}


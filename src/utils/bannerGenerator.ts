import { BannerContentMap, BannerSettings } from '../types';
import studioPodiumImg from '../assets/images/studio_podium_stage_1791842300943.jpg';
import marbleTableImg from '../assets/images/marble_table_surface_1791842302583.jpg';
import oakWoodImg from '../assets/images/oak_wood_table_1791842302519.jpg';
import { extractProductCutout } from './photoTransformer';
import { canvasToBlob, downloadBlob } from './download';

export type BannerStyleType = 'promo' | 'minimalis' | 'lifestyle';


/**
 * Loads an image from a Data URL (base64) or regular URL safely.
 * Avoids setting crossOrigin on data: URLs to prevent tainted canvas issues.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('URL gambar kosong'));
      return;
    }

    const img = new Image();
    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback try without crossOrigin if failed
      if (img.crossOrigin) {
        const retry = new Image();
        retry.onload = () => resolve(retry);
        retry.onerror = (e) => reject(e);
        retry.src = src;
      } else {
        reject(new Error('Gagal memuat elemen gambar'));
      }
    };
    img.src = src;
  });
}

/**
 * Helper to safely draw rounded rectangles in all browser engines.
 */
export function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  fill?: string | CanvasGradient,
  stroke?: string,
  strokeWidth: number = 1
) {
  ctx.save();
  ctx.beginPath();
  const r = Math.min(radius, w / 2, h / 2);
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

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draws the product image filling the full canvas (Edge to Edge)
 * Ensures 100% full coverage without white borders.
 */
export function drawProductImageFull(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  scale: number = 1.0,
  offsetY: number = 0
) {
  const imgW = img.naturalWidth || img.width || 800;
  const imgH = img.naturalHeight || img.height || 800;

  // Base background fill behind photo in case of transparency
  ctx.fillStyle = '#18181B';
  ctx.fillRect(0, 0, w, h);

  // Compute cover scale so entire canvas is filled
  const imgAspect = imgW / imgH;
  const canvasAspect = w / h;

  let renderW: number;
  let renderH: number;

  if (imgAspect > canvasAspect) {
    // Image is wider
    renderH = h * scale;
    renderW = renderH * imgAspect;
  } else {
    // Image is taller or square
    renderW = w * scale;
    renderH = renderW / imgAspect;
  }

  const posX = (w - renderW) / 2;
  const posY = (h - renderH) / 2 + offsetY;

  ctx.drawImage(img, posX, posY, renderW, renderH);
}

/**
 * Normalizes feature pills safely into a clean string array.
 */
function getFeaturePills(raw: unknown, defaultFallback: string[]): string[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((s) => s.length > 0);
  }
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return defaultFallback;
}

const DEFAULT_SETTINGS: BannerSettings = {
  storeName: 'Official Store',
  sellerType: 'mall',
  displayPrice: '',
  originalPrice: '',
  discountPercentage: '50%',
  showCodBadge: true,
  showFreeShippingBadge: true,
  showRatingBadge: true,
  productScale: 1.0,
  productOffsetY: 0,
  promoThemeColor: '#EE4D2D',
  minimalistBgTone: 'warm-cream',
  lifestyleBgTone: 'terracotta',
  photoMode: 'full',
};

/**
 * 1. BANNER UTAMA RESMI SHOPEE (Clean High-Impact Banner TANPA HARGA)
 * Fokus pada: Branding Toko, Keunggulan Produk, Badge Garansi Resmi & Bebas Ongkir.
 */
export async function renderPromoBanner(
  canvas: HTMLCanvasElement,
  productImg: HTMLImageElement,
  bannerCopy?: BannerContentMap['promo'],
  settings?: Partial<BannerSettings>
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const cfg: BannerSettings = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  const pills = getFeaturePills(bannerCopy?.featurePills, ['100% Original', 'Bisa COD', 'Garansi Resmi']);
  const headline = bannerCopy?.headline || 'PRODUK UNGGULAN PILIHAN';
  const callToAction = bannerCopy?.callToAction || 'BELI SEKARANG';

  const W = 1080;
  const H = 1080;
  canvas.width = W;
  canvas.height = H;

  // 1. Gambar foto produk FULL mengisi seluruh layar banner
  drawProductImageFull(ctx, productImg, W, H, cfg.productScale || 1.0, cfg.productOffsetY || 0);

  // 2. Gradient Vignette Overlay Atas & Bawah agar teks terbaca jelas
  ctx.save();
  const topGrad = ctx.createLinearGradient(0, 0, 0, 240);
  topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
  topGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.35)');
  topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, W, 240);

  const botGrad = ctx.createLinearGradient(0, H - 320, 0, H);
  botGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  botGrad.addColorStop(0.35, 'rgba(0, 0, 0, 0.45)');
  botGrad.addColorStop(1, 'rgba(0, 0, 0, 0.88)');
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, H - 320, W, 320);
  ctx.restore();

  // 3. Header Bar Atas: Jaminan Produk Original (Tanpa Nama Toko & Tanpa Harga)
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  // Red Badge Jaminan Resmi
  drawRoundedRect(ctx, 40, 40, 260, 48, 12, '#D0011B');
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★ PRODUK ORIGINAL', 170, 64);
  ctx.restore();

  // 4. Badge Garansi 100% Original di Kanan Atas
  ctx.save();
  ctx.translate(W - 120, 110);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  ctx.arc(0, 0, 68, 0, Math.PI * 2);
  ctx.fillStyle = '#EE4D2D';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#FFE814';
  ctx.stroke();

  ctx.fillStyle = '#FFE814';
  ctx.font = '800 16px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('JAMINAN', 0, -22);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('100%', 0, 4);

  ctx.fillStyle = '#FFE814';
  ctx.font = '800 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ORIGINAL', 0, 28);
  ctx.restore();

  // 5. Feature Pills di Kiri
  let pillY = 115;
  pills.slice(0, 3).forEach((pill) => {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    drawRoundedRect(ctx, 40, pillY, 270, 46, 12, 'rgba(255, 255, 255, 0.95)', '#FFD83B', 2);
    ctx.fillStyle = '#D0011B';
    ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓ ' + pill, 55, pillY + 23);
    ctx.restore();
    pillY += 56;
  });

  // 6. Badges Gratis Ongkir & COD
  if (cfg.showFreeShippingBadge) {
    ctx.save();
    drawRoundedRect(ctx, 40, 800, 220, 44, 12, '#00A389');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 17px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GRATIS ONGKIR XTRA', 150, 822);
    ctx.restore();
  }

  if (cfg.showCodBadge) {
    ctx.save();
    drawRoundedRect(ctx, 275, 800, 180, 44, 12, '#F6A700');
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 17px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BISA COD (BAYAR)', 365, 822);
    ctx.restore();
  }

  // 7. Bottom Showcase Card (TANPA HARGA - Sesuai Permintaan)
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 8;
  drawRoundedRect(ctx, 30, 860, W - 60, 180, 24, '#FFFFFF');

  // Title on Left
  ctx.fillStyle = '#1E293B';
  ctx.font = '900 34px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const headlineDisplay = headline.length > 28 ? headline.substring(0, 26) + '...' : headline;
  ctx.fillText(headlineDisplay, 65, 925);

  ctx.fillStyle = '#059669';
  ctx.font = '700 20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('✓ Kualitas Terjamin • Siap Kirim Hari Ini', 65, 965);

  // Big Shopee Red CTA Button on Right
  const ctaGrad = ctx.createLinearGradient(W - 400, 885, W - 55, 1015);
  ctaGrad.addColorStop(0, '#EE4D2D');
  ctaGrad.addColorStop(1, '#C21B00');
  drawRoundedRect(ctx, W - 400, 890, 345, 120, 22, ctaGrad);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 32px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(callToAction, W - 228, 935);

  ctx.fillStyle = '#FFE814';
  ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('KLIK & CHECKOUT ➔', W - 228, 975);
  ctx.restore();
}

/**
 * 2. EDIT TAMPILAN FOTO 1: VERSI STUDIO 3D PODIUM
 * Mengubah foto produk asli ke panggung display silinder 3D modern dengan bayangan lantai realistis
 * (BUKAN SEKADAR BINGKAI).
 */
export async function renderMinimalistBanner(
  canvas: HTMLCanvasElement,
  productImg: HTMLImageElement,
  bannerCopy?: BannerContentMap['minimalis'] | BannerContentMap['minimalist'],
  settings?: Partial<BannerSettings>
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const cfg: BannerSettings = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  const W = 1080;
  const H = 1080;
  canvas.width = W;
  canvas.height = H;

  // 1. Gambar Background Studio Podium 3D
  try {
    const bgImg = await loadImage(studioPodiumImg);
    ctx.drawImage(bgImg, 0, 0, W, H);
  } catch {
    // Soft studio gradient fallback
    const grad = ctx.createRadialGradient(W / 2, H * 0.4, 50, W / 2, H / 2, H * 0.75);
    grad.addColorStop(0, '#FAF5FF');
    grad.addColorStop(0.5, '#F3E8FF');
    grad.addColorStop(1, '#E9D5FF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // 2. Isolate / Cutout product
  const cutoutCanvas = extractProductCutout(productImg, 26);

  // 3. Scale and position product onto podium surface
  const pScale = (cfg.productScale || 1.0) * 0.85;
  const pw = productImg.naturalWidth || productImg.width || W;
  const ph = productImg.naturalHeight || productImg.height || H;
  const aspect = pw / ph;

  let dw = W * 0.72 * pScale;
  let dh = dw / aspect;
  if (aspect < 1) {
    dh = W * 0.72 * pScale;
    dw = dh * aspect;
  }

  const cx = W / 2;
  const cy = H / 2 - 80 + (cfg.productOffsetY || 0);

  // Realistic contact shadow on podium top
  const shadowY = cy + dh / 2 - 10;
  ctx.save();
  ctx.translate(cx, shadowY);
  ctx.scale(1, 0.22);
  const shGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, dw * 0.45);
  shGrad.addColorStop(0, 'rgba(15, 23, 42, 0.75)');
  shGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.35)');
  shGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx.fillStyle = shGrad;
  ctx.beginPath();
  ctx.arc(0, 0, dw * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Draw product
  ctx.drawImage(cutoutCanvas, cx - dw / 2, cy - dh / 2, dw, dh);

  // Soft high-end commercial badge
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  drawRoundedRect(ctx, 45, 45, 270, 44, 12, 'rgba(15, 23, 42, 0.85)');
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 16px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★ VERSI STUDIO PODIUM 3D', 180, 67);
  ctx.restore();
}

/**
 * 3. EDIT TAMPILAN FOTO 2: VERSI MEJA MARMER MEWAH (LIFESTYLE)
 * Mengubah foto produk asli ke atas meja marmer Carrara elegan dengan pencahayaan hangat alami
 * (BUKAN SEKADAR BINGKAI).
 */
export async function renderLifestyleBanner(
  canvas: HTMLCanvasElement,
  productImg: HTMLImageElement,
  bannerCopy?: BannerContentMap['lifestyle'],
  settings?: Partial<BannerSettings>
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const cfg: BannerSettings = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  const W = 1080;
  const H = 1080;
  canvas.width = W;
  canvas.height = H;

  // 1. Gambar Background Meja Marmer Mewah
  try {
    const bgImg = await loadImage(marbleTableImg);
    ctx.drawImage(bgImg, 0, 0, W, H);
  } catch {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.65, '#F1F5F9');
    grad.addColorStop(1, '#E2E8F0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // 2. Isolate / Cutout product
  const cutoutCanvas = extractProductCutout(productImg, 26);

  // 3. Scale and position product onto marble countertop
  const pScale = (cfg.productScale || 1.0) * 0.9;
  const pw = productImg.naturalWidth || productImg.width || W;
  const ph = productImg.naturalHeight || productImg.height || H;
  const aspect = pw / ph;

  let dw = W * 0.72 * pScale;
  let dh = dw / aspect;
  if (aspect < 1) {
    dh = W * 0.72 * pScale;
    dw = dh * aspect;
  }

  const cx = W / 2;
  const cy = H / 2 + 40 + (cfg.productOffsetY || 0);

  // Realistic contact shadow on marble countertop
  const shadowY = cy + dh / 2 - 8;
  ctx.save();
  ctx.translate(cx, shadowY);
  ctx.scale(1, 0.24);
  const shGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, dw * 0.5);
  shGrad.addColorStop(0, 'rgba(30, 41, 59, 0.7)');
  shGrad.addColorStop(0.6, 'rgba(30, 41, 59, 0.25)');
  shGrad.addColorStop(1, 'rgba(30, 41, 59, 0)');
  ctx.fillStyle = shGrad;
  ctx.beginPath();
  ctx.arc(0, 0, dw * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Draw product
  ctx.drawImage(cutoutCanvas, cx - dw / 2, cy - dh / 2, dw, dh);

  // Top badge
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  drawRoundedRect(ctx, 45, 45, 275, 44, 12, 'rgba(15, 23, 42, 0.85)');
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 16px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★ VERSI MEJA MARMER MEWAH', 182, 67);
  ctx.restore();
}


/**
 * Downloads a canvas element as a PNG image file
 */
export async function downloadCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  const blob = await canvasToBlob(canvas);
  downloadBlob(blob, filename);
}

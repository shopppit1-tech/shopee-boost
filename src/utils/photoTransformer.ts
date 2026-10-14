import { PhotoBackdropId, PhotoEditAdjustments, TransformedPhotoVersion } from '../types';
import studioPodiumImg from '../assets/images/studio_podium_stage_1791842300943.jpg';
import marbleTableImg from '../assets/images/marble_table_surface_1791842302583.jpg';
import oakWoodImg from '../assets/images/oak_wood_table_1791842302519.jpg';
import luxuryDarkImg from '../assets/images/luxury_dark_stage_1791842303167.jpg';

export const BACKDROP_CONFIGS: Record<
  PhotoBackdropId,
  {
    name: string;
    category: string;
    description: string;
    badge: string;
    imgSrc?: string;
    defaultOffsetY: number;
    defaultZoom: number;
    shadowLevel: number;
  }
> = {
  podium: {
    name: 'Podium 3D Studio',
    category: 'Commercial Showcase',
    description: 'Panggung display silinder modern dengan pencahayaan studio pastel lembut',
    badge: '★ Paling Laris',
    imgSrc: studioPodiumImg,
    defaultOffsetY: -80,
    defaultZoom: 0.85,
    shadowLevel: 0.75,
  },
  marble: {
    name: 'Meja Marmer Mewah',
    category: 'Luxury Lifestyle',
    description: 'Permukaan marmer putih Carrara elegan dengan pantulan sinar matahari alami',
    badge: '★ Premium Aesthetic',
    imgSrc: marbleTableImg,
    defaultOffsetY: 40,
    defaultZoom: 0.9,
    shadowLevel: 0.7,
  },
  wood: {
    name: 'Meja Kayu Skandinavia',
    category: 'Warm Lifestyle',
    description: 'Permukaan kayu oak alami bernuansa hangat dengan suasana kafe estetik',
    badge: '★ Cozy & Natural',
    imgSrc: oakWoodImg,
    defaultOffsetY: 50,
    defaultZoom: 0.9,
    shadowLevel: 0.65,
  },
  'studio-white': {
    name: 'Studio Putih Bersih',
    category: 'Official Mall Studio',
    description: 'Latar studio putih bersih profesional dengan gradasi radial dan bayangan lembut',
    badge: '★ Standar Shopee Mall',
    defaultOffsetY: 0,
    defaultZoom: 0.95,
    shadowLevel: 0.6,
  },
  'luxury-dark': {
    name: 'Obsidian & Gold Luxury',
    category: 'Exclusive Dark',
    description: 'Podium hitam obsidian matte dengan aksen rim gold dramatis dan mewah',
    badge: '★ Edisi Eksklusif',
    imgSrc: luxuryDarkImg,
    defaultOffsetY: -70,
    defaultZoom: 0.82,
    shadowLevel: 0.85,
  },
  'clean-cutout': {
    name: 'Potong Latar (Cutout PNG)',
    category: 'Transparan / Isolasi',
    description: 'Produk diisolasi rapi tanpa latar belakang, siap ditempel di mana pun',
    badge: '★ PNG Transparan',
    defaultOffsetY: 0,
    defaultZoom: 1.0,
    shadowLevel: 0,
  },
};

export const DEFAULT_PHOTO_ADJUSTMENTS: PhotoEditAdjustments = {
  brightness: 0,
  contrast: 6,
  saturation: 12,
  clarity: 15,
  zoom: 1.0,
  offsetY: 0,
  offsetX: 0,
  flipHorizontal: false,
  shadowStrength: 0.7,
  autoCutout: true,
  cutoutThreshold: 26,
};

// Image caching map to prevent redundant network fetches
const imageCache = new Map<string, HTMLImageElement>();

export function loadImg(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    const cached = imageCache.get(src)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Creates an intelligent foreground cutout of the product
 * Removes plain/monochrome backgrounds (white, light grey, studio backdrop)
 * using edge-aware color distance and smooth alpha feathering.
 */
export function extractProductCutout(
  sourceImg: HTMLImageElement,
  threshold: number = 26
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const w = sourceImg.naturalWidth || sourceImg.width || 800;
  const h = sourceImg.naturalHeight || sourceImg.height || 800;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.drawImage(sourceImg, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Sample corner pixels to estimate background color
  const samplePoints = [
    [4, 4],
    [w - 5, 4],
    [4, h - 5],
    [w - 5, h - 5],
    [Math.floor(w / 2), 4],
    [4, Math.floor(h / 2)],
    [w - 5, Math.floor(h / 2)],
  ];

  let totalR = 0,
    totalG = 0,
    totalB = 0,
    validSamples = 0;

  for (const [sx, sy] of samplePoints) {
    const idx = (sy * w + sx) * 4;
    // Check if not already transparent
    if (data[idx + 3] > 50) {
      totalR += data[idx];
      totalG += data[idx + 1];
      totalB += data[idx + 2];
      validSamples++;
    }
  }

  if (validSamples === 0) {
    // Already fully transparent
    return canvas;
  }

  const bgR = totalR / validSamples;
  const bgG = totalG / validSamples;
  const bgB = totalB / validSamples;

  const centerX = w / 2;
  const centerY = h / 2;
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

  // Soft feathering range
  const featherRange = 16;
  const tMin = threshold;
  const tMax = threshold + featherRange;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const alpha = data[idx + 3];
      if (alpha === 0) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Euclidean color distance in RGB space
      const dr = r - bgR;
      const dg = g - bgG;
      const db = b - bgB;
      const colorDist = Math.sqrt(dr * dr + dg * dg + db * db);

      // Distance from center (favor preserving central product details)
      const dx = x - centerX;
      const dy = y - centerY;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);
      const centerFactor = Math.min(1.0, distFromCenter / (maxRadius * 0.7));

      // Effective threshold relaxes slightly near the center
      const effectiveTMin = tMin * (0.65 + centerFactor * 0.35);
      const effectiveTMax = tMax * (0.65 + centerFactor * 0.35);

      if (colorDist <= effectiveTMin) {
        // Pure background match
        data[idx + 3] = 0;
      } else if (colorDist < effectiveTMax) {
        // Smooth alpha edge transition
        const factor = (colorDist - effectiveTMin) / (effectiveTMax - effectiveTMin);
        data[idx + 3] = Math.min(alpha, Math.round(alpha * factor));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Draws a realistic contact and directional floor shadow beneath the product
 */
function drawRealisticContactShadow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  groundY: number,
  shadowWidth: number,
  shadowHeight: number,
  strength: number,
  tint: string = 'rgba(15, 23, 42, '
) {
  if (strength <= 0) return;

  ctx.save();

  // 1. Core tight contact shadow (dark, thin line right where product touches surface)
  ctx.save();
  ctx.translate(cx, groundY);
  ctx.scale(1, shadowHeight / shadowWidth);
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, shadowWidth * 0.45);
  coreGrad.addColorStop(0, `${tint}${Math.min(0.85, strength * 0.85)})`);
  coreGrad.addColorStop(0.5, `${tint}${strength * 0.5})`);
  coreGrad.addColorStop(1, `${tint}0)`);
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, shadowWidth * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Diffuse ambient floor shadow (wider, softer, slightly offset down)
  ctx.save();
  ctx.translate(cx, groundY + shadowHeight * 0.3);
  ctx.scale(1, (shadowHeight * 1.6) / (shadowWidth * 1.2));
  const diffuseGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, shadowWidth * 0.65);
  diffuseGrad.addColorStop(0, `${tint}${strength * 0.45})`);
  diffuseGrad.addColorStop(0.6, `${tint}${strength * 0.18})`);
  diffuseGrad.addColorStop(1, `${tint}0)`);
  ctx.fillStyle = diffuseGrad;
  ctx.beginPath();
  ctx.arc(0, 0, shadowWidth * 0.65, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * Transforms and renders a product onto a specific backdrop
 * Produces crisp 1080x1080 e-commerce square output
 */
export async function transformProductPhoto(
  productImgSrc: string,
  backdropId: PhotoBackdropId,
  userAdjustments?: Partial<PhotoEditAdjustments>
): Promise<string> {
  const adjustments: PhotoEditAdjustments = {
    ...DEFAULT_PHOTO_ADJUSTMENTS,
    ...userAdjustments,
  };

  const backdropConfig = BACKDROP_CONFIGS[backdropId];
  const targetSize = 1080;

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Load product image
  const productImg = await loadImg(productImgSrc);

  // 1. Draw Backdrop
  if (backdropId === 'clean-cutout') {
    // Pure transparent canvas
    ctx.clearRect(0, 0, targetSize, targetSize);
  } else if (backdropConfig.imgSrc) {
    // Photorealistic generated backdrop image
    try {
      const bgImg = await loadImg(backdropConfig.imgSrc);
      ctx.drawImage(bgImg, 0, 0, targetSize, targetSize);
    } catch {
      // Fallback studio gradient if backdrop image fails
      drawStudioGradientFallback(ctx, targetSize, backdropId);
    }
  } else if (backdropId === 'studio-white') {
    // High-key pristine 3D studio
    drawStudioWhiteBackdrop(ctx, targetSize);
  } else {
    drawStudioGradientFallback(ctx, targetSize, backdropId);
  }

  // 2. Prepare Product Image Source (Cutout vs Original)
  let renderSource: CanvasImageSource = productImg;
  if (adjustments.autoCutout) {
    renderSource = extractProductCutout(productImg, adjustments.cutoutThreshold);
  }

  // 3. Calculate Product Placement & Dimensions
  const baseScale = backdropConfig.defaultZoom * adjustments.zoom;
  const pWidth = (productImg.naturalWidth || productImg.width || targetSize);
  const pHeight = (productImg.naturalHeight || productImg.height || targetSize);
  const aspect = pWidth / pHeight;

  let drawW: number;
  let drawH: number;

  if (aspect >= 1) {
    drawW = targetSize * 0.72 * baseScale;
    drawH = drawW / aspect;
  } else {
    drawH = targetSize * 0.72 * baseScale;
    drawW = drawH * aspect;
  }

  const posX = targetSize / 2 + adjustments.offsetX;
  const posY = targetSize / 2 + backdropConfig.defaultOffsetY + adjustments.offsetY;

  // Ground level for contact shadow calculation
  const groundY = posY + drawH / 2 - 8;
  const shadowW = drawW * 0.85;
  const shadowH = drawH * 0.18;

  // 4. Draw Realistic Contact Shadow (if not transparent cutout)
  if (backdropId !== 'clean-cutout') {
    const shadowColor =
      backdropId === 'luxury-dark'
        ? 'rgba(0, 0, 0, '
        : backdropId === 'wood'
        ? 'rgba(40, 24, 12, '
        : 'rgba(20, 28, 45, ';

    drawRealisticContactShadow(
      ctx,
      posX,
      groundY,
      shadowW,
      shadowH,
      adjustments.shadowStrength * backdropConfig.shadowLevel,
      shadowColor
    );
  }

  // 5. Draw Product with Image Filters & Transforms
  ctx.save();
  ctx.translate(posX, posY);

  if (adjustments.flipHorizontal) {
    ctx.scale(-1, 1);
  }

  // Color & Lighting filters
  const b = 100 + adjustments.brightness;
  const c = 100 + adjustments.contrast;
  const s = 100 + adjustments.saturation;
  ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;

  ctx.drawImage(renderSource, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();

  // Export as high-quality Data URL
  const mimeType = backdropId === 'clean-cutout' ? 'image/png' : 'image/jpeg';
  return canvas.toDataURL(mimeType, 0.94);
}

/**
 * Draws high-key 3D white studio backdrop
 */
function drawStudioWhiteBackdrop(ctx: CanvasRenderingContext2D, size: number) {
  // Background gradient: soft bright studio light radiating from top-center
  const bgGrad = ctx.createRadialGradient(
    size / 2,
    size * 0.35,
    size * 0.1,
    size / 2,
    size / 2,
    size * 0.8
  );
  bgGrad.addColorStop(0, '#FFFFFF');
  bgGrad.addColorStop(0.55, '#F8FAFC');
  bgGrad.addColorStop(1, '#EEF2F6');

  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, size, size);

  // Subtle floor horizon vignette at bottom 35%
  const floorGrad = ctx.createLinearGradient(0, size * 0.65, 0, size);
  floorGrad.addColorStop(0, 'rgba(226, 232, 240, 0)');
  floorGrad.addColorStop(1, 'rgba(203, 213, 225, 0.35)');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, size * 0.65, size, size * 0.35);
}

/**
 * Fallback gradient renderer
 */
function drawStudioGradientFallback(
  ctx: CanvasRenderingContext2D,
  size: number,
  backdropId: PhotoBackdropId
) {
  const grad = ctx.createRadialGradient(
    size / 2,
    size * 0.4,
    50,
    size / 2,
    size / 2,
    size * 0.75
  );

  if (backdropId === 'luxury-dark') {
    grad.addColorStop(0, '#2A2E39');
    grad.addColorStop(0.6, '#14171F');
    grad.addColorStop(1, '#0B0D12');
  } else if (backdropId === 'wood') {
    grad.addColorStop(0, '#FDFBF7');
    grad.addColorStop(0.65, '#F5EDE2');
    grad.addColorStop(1, '#E6D7C3');
  } else if (backdropId === 'marble') {
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.65, '#F1F5F9');
    grad.addColorStop(1, '#E2E8F0');
  } else {
    // podium pastel
    grad.addColorStop(0, '#FAF5FF');
    grad.addColorStop(0.5, '#F3E8FF');
    grad.addColorStop(1, '#E9D5FF');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
}

/**
 * Generates all 6 transformed photo versions in batch
 */
export async function generateAllPhotoVersions(
  productImgSrc: string,
  userAdjustments?: Partial<PhotoEditAdjustments>
): Promise<TransformedPhotoVersion[]> {
  const backdropKeys: PhotoBackdropId[] = [
    'podium',
    'marble',
    'wood',
    'studio-white',
    'luxury-dark',
    'clean-cutout',
  ];

  const results: TransformedPhotoVersion[] = [];

  for (const id of backdropKeys) {
    try {
      const cfg = BACKDROP_CONFIGS[id];
      const dataUrl = await transformProductPhoto(productImgSrc, id, userAdjustments);
      results.push({
        id,
        name: cfg.name,
        category: cfg.category,
        description: cfg.description,
        badge: cfg.badge,
        dataUrl,
      });
    } catch (err) {
      console.warn(`Failed to generate version for ${id}:`, err);
    }
  }

  return results;
}

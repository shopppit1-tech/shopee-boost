export interface SeoTitles {
  recommended: string;
  promo: string;
  descriptive: string;
}

export interface BannerCopy {
  headline: string;
  badge: string;
  subBadge: string;
  featurePills: string[];
  callToAction: string;
}

export interface BannerContentMap {
  promo?: BannerCopy;
  minimalis?: BannerCopy;
  minimalist?: BannerCopy;
  lifestyle?: BannerCopy;
}

export interface VideoPromoData {
  hook: string;
  features: string[];
  callToAction: string;
  badge?: string;
  voiceoverScript: {
    hookText: string;
    featureText: string;
    ctaText: string;
  };
  aiNarrationAudioBase64?: string;
  voiceName?: string;
}

export interface AnalysisResult {
  productNameDetected: string;
  category: string;
  seoTitles: SeoTitles;
  description: string;
  keywords: string[];
  hashtags: string[];
  priceEstimate: {
    min: number;
    max: number;
    formatted: string;
  };
  uspList: string[];
  bannerContent: BannerContentMap;
  videoPromo?: VideoPromoData;
}

export interface BannerSettings {
  storeName: string;
  sellerType: 'mall' | 'star_plus' | 'star' | 'official';
  displayPrice: string;
  originalPrice: string;
  discountPercentage: string;
  showCodBadge: boolean;
  showFreeShippingBadge: boolean;
  showRatingBadge: boolean;
  productScale: number;
  productOffsetY: number;
  promoThemeColor: string; // default shopee orange #ee4d2d
  minimalistBgTone: 'warm-cream' | 'cool-grey' | 'soft-taupe';
  lifestyleBgTone: 'sage' | 'terracotta' | 'ocean';
  photoMode?: 'full' | 'contain';
}

export interface SampleProduct {
  id: string;
  name: string;
  category: string;
  hint: string;
  image: string;
  price: string;
  discount: string;
}

export type PhotoBackdropId =
  | 'podium'
  | 'marble'
  | 'wood'
  | 'studio-white'
  | 'luxury-dark'
  | 'clean-cutout';

export interface PhotoEditAdjustments {
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
  saturation: number; // -50 to 50
  clarity: number; // 0 to 50
  zoom: number; // 0.6 to 1.8
  offsetY: number; // -150 to 150
  offsetX: number; // -150 to 150
  flipHorizontal: boolean;
  shadowStrength: number; // 0 to 1
  autoCutout: boolean;
  cutoutThreshold: number; // 5 to 60
}

export interface TransformedPhotoVersion {
  id: PhotoBackdropId;
  name: string;
  category: string;
  description: string;
  badge: string;
  dataUrl: string;
}


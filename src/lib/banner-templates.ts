export interface BannerItem {
  id: string;
  title: string;
  subtitle?: string | null;
  badgeText?: string | null;
  badgeSecondary?: string | null;
  imageUrl?: string | null;
  ctaText?: string | null;
  ctaLink?: string | null;
  bgGradient?: string | null;
  textColor?: string | null;
  order: number;
  isActive: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface BannerTemplate {
  id: string;
  name: string;
  description: string;
  tag: string;
  badgeText: string;
  badgeSecondary: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  bgGradient: string;
  previewColor: string;
}

export const BANNER_TEMPLATES: BannerTemplate[] = [
  {
    id: "coral-sunset",
    name: "Signature Coral (Bento Default)",
    description: "Vibrant coral aesthetic matching your store's modern bento design.",
    tag: "Most Popular",
    badgeText: "✨ Featured Collection 2026",
    badgeSecondary: "Cash on Delivery Available",
    title: "Curated Essentials & Gifts",
    subtitle: "Quality Products Delivered to Your Doorstep. Zero advance payment required.",
    ctaText: "Shop Catalog",
    ctaLink: "#catalog",
    bgGradient: "from-[#FF6448] via-[#FF755B] to-[#FF8A73]",
    previewColor: "#FF6448",
  },
  {
    id: "midnight-luxury",
    name: "Midnight Obsidian (Luxury Craft)",
    description: "Sleek dark obsidian with gold & amber accents for premium collections.",
    tag: "VIP Luxury",
    badgeText: "⭐ VIP Premium Collection",
    badgeSecondary: "100% Genuine Craftsmanship",
    title: "Exclusive Craftsmanship",
    subtitle: "Minimalist accessories & leather goods built with timeless full-grain elegance.",
    ctaText: "Explore Luxury",
    ctaLink: "#catalog",
    bgGradient: "from-[#141619] via-[#1F2329] to-[#2B3038]",
    previewColor: "#141619",
  },
  {
    id: "flash-clearance",
    name: "Flash Clearance (Mega Sale)",
    description: "High-urgency fiery crimson gradient designed to drive maximum sales.",
    tag: "High Conversion",
    badgeText: "🔥 Limited Time Flash Deal",
    badgeSecondary: "Up to 40% OFF This Week",
    title: "Biggest Seasonal Clearance",
    subtitle: "Massive limited-time price drops across trending accessories and everyday essentials.",
    ctaText: "Grab Deal Now",
    ctaLink: "#catalog",
    bgGradient: "from-[#DC2626] via-[#EA580C] to-[#F59E0B]",
    previewColor: "#EA580C",
  },
  {
    id: "wireless-tech",
    name: "Next-Gen Wireless (Modern Tech)",
    description: "Futuristic deep indigo and electric cyan gradient for gadgets & electronics.",
    tag: "Gadgets & Audio",
    badgeText: "⚡ Future Tech 2026",
    badgeSecondary: "Official Replacement Warranty",
    title: "Next-Gen Wireless Sound",
    subtitle: "Active noise-cancelling earbuds, smart workstation gear, and productivity powerhouses.",
    ctaText: "Discover Tech",
    ctaLink: "#catalog",
    bgGradient: "from-[#3730A3] via-[#4F46E5] to-[#6366F1]",
    previewColor: "#4F46E5",
  },
  {
    id: "eco-mint",
    name: "Eco Mint (Natural Living)",
    description: "Fresh forest emerald & soothing mint for lifestyle, wellness, and organic items.",
    tag: "Eco & Wellness",
    badgeText: "🌿 Organic & Sustainable",
    badgeSecondary: "Eco-Friendly Safe Packaging",
    title: "Pure Everyday Living",
    subtitle: "Calming organic aromatherapy candles, artisan ceramics, and natural home living.",
    ctaText: "Shop Wellness",
    ctaLink: "#catalog",
    bgGradient: "from-[#047857] via-[#059669] to-[#10B981]",
    previewColor: "#059669",
  },
  {
    id: "royal-festive",
    name: "Royal Festive (Special Occasion)",
    description: "Regal violet & magenta gradient for festivals, Eid, Puja, and celebratory gifts.",
    tag: "Festive Season",
    badgeText: "🎁 Special Edition Gift Packs",
    badgeSecondary: "Complimentary Gift Wrapping",
    title: "Thoughtful Gifts Made Easy",
    subtitle: "Surprise your loved ones with hand-curated premium gift sets delivered nationwide.",
    ctaText: "Send a Gift",
    ctaLink: "#catalog",
    bgGradient: "from-[#581C87] via-[#7C3AED] to-[#9333EA]",
    previewColor: "#7C3AED",
  },
];

export const GRADIENT_PRESETS = [
  { label: "Coral Sunset", value: "from-[#FF6448] via-[#FF755B] to-[#FF8A73]", preview: "#FF6448" },
  { label: "Midnight Obsidian", value: "from-[#141619] via-[#1F2329] to-[#2B3038]", preview: "#1F2329" },
  { label: "Flame Orange", value: "from-[#DC2626] via-[#EA580C] to-[#F59E0B]", preview: "#EA580C" },
  { label: "Electric Indigo", value: "from-[#3730A3] via-[#4F46E5] to-[#6366F1]", preview: "#4F46E5" },
  { label: "Emerald Teal", value: "from-[#047857] via-[#059669] to-[#10B981]", preview: "#059669" },
  { label: "Royal Purple", value: "from-[#581C87] via-[#7C3AED] to-[#9333EA]", preview: "#7C3AED" },
  { label: "Ocean Blue", value: "from-[#0284C7] via-[#0369A1] to-[#075985]", preview: "#0284C7" },
  { label: "Rose Gold", value: "from-[#BE185D] via-[#DB2777] to-[#F43F5E]", preview: "#DB2777" },
];

export function getFallbackBannerFromSettings(settings?: {
  heroTitle?: string;
  storeName?: string;
  heroTagline?: string;
  tagline?: string;
  heroBadgeText?: string;
  heroBadgeSecondary?: string;
  heroCtaText?: string;
}): BannerItem {
  return {
    id: "fallback-default",
    title:
      settings?.heroTitle && settings.heroTitle !== "Aura Mart"
        ? settings.heroTitle
        : settings?.storeName || "Featured Collection",
    subtitle:
      settings?.heroTagline ||
      settings?.tagline ||
      "Quality Products Delivered to Your Doorstep. Zero advance payment required.",
    badgeText: settings?.heroBadgeText || "Featured Collection 2026",
    badgeSecondary: settings?.heroBadgeSecondary || "Cash on Delivery Available",
    imageUrl: "",
    ctaText: settings?.heroCtaText || "Shop Catalog",
    ctaLink: "#catalog",
    bgGradient: "from-[#FF6448] via-[#FF755B] to-[#FF8A73]",
    textColor: "#FFFFFF",
    order: 0,
    isActive: true,
  };
}

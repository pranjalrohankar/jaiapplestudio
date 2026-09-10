import fallbackData from "../../data/banners.json";

export type OfferBanner = {
  id: string;
  isActive: boolean;
  title?: string;
  badge?: string;
  subtitle?: string;
  priceTag?: string;
  image: string;
  link?: string;
  ctaText?: string;
  layout?: "full" | "half";
};

export type BannersData = {
  announcement: string;
  isAnnouncementActive: boolean;
  banners: OfferBanner[];
};

export const defaultOfferBanners: OfferBanner[] = (fallbackData.banners as OfferBanner[]) || [
  {
    id: "mega-festive-cashback",
    isActive: true,
    title: "Mega Cashback & Exchange Festival",
    badge: "LIMITED PERIOD OFFER",
    subtitle: "Get up to ₹10,000 Extra Exchange Bonus + ₹5,000 Instant Bank Cashback on all iPhone & Mac models.",
    priceTag: "Zero Down Payment No-Cost EMI Available",
    image: "/images/iphone-18-hero-banner.jpg",
    link: "/iphone",
    ctaText: "Claim Offer Now",
    layout: "full",
  },
  {
    id: "student-teacher-special",
    isActive: true,
    title: "Apple Student & Teacher Advantage",
    badge: "EDUCATION SAVINGS",
    subtitle: "Save up to 6% on MacBook & iPad with free AirPods setup and priority AppleCare enrollment.",
    priceTag: "Instant ID Verification",
    image: "https://www.apple.com/v/macbook-air/s/images/overview/design/design-top__dnjh93e0ycmq_large.jpg",
    link: "/mac",
    ctaText: "Explore Student Deals",
    layout: "half",
  },
  {
    id: "watch-audio-bundle",
    isActive: true,
    title: "Apple Watch & AirPods Combo Deal",
    badge: "COMBO SAVINGS",
    subtitle: "Flat ₹3,000 combo discount when you purchase any Apple Watch with AirPods Pro.",
    priceTag: "Valid across all stores",
    image: "https://www.apple.com/v/apple-watch-ultra-2/e/images/overview/hero/hero_watch__bftq4prm5vzm_large.jpg",
    link: "/watch",
    ctaText: "Shop Combos",
    layout: "half",
  },
];

export const defaultBannersData: BannersData = {
  announcement:
    fallbackData.announcement ||
    "🚀 Latest Offers: Instant ₹5,000 Bank Cashback on all iPhones + No-Cost EMI available! Call +91 88886 83101",
  isAnnouncementActive: fallbackData.isAnnouncementActive ?? true,
  banners: defaultOfferBanners,
};

export type BannerConfig = {
  id?: string;
  isActive: boolean;
  badge: string;
  title: string;
  tagline?: string;
  description?: string;
  announcement?: string;
  image: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  theme?: "dark-aurora" | "midnight-neon" | "cosmic-titanium" | "minimal-silver";
};

export const defaultBanner: BannerConfig = {
  isActive: true,
  badge: "LATEST LAUNCH",
  title: "iPhone 18 Pro",
  tagline: "The Next Era of Apple Intelligence",
  description: "Experience revolutionary performance with A20 Pro chip.",
  announcement: defaultBannersData.announcement,
  image: "/images/iphone-18-hero-banner.jpg",
  ctaText: "Pre-Order Now",
  ctaLink: "/product/iphone-18-pro",
  secondaryCtaText: "Explore All iPhones",
  secondaryCtaLink: "/iphone",
  theme: "dark-aurora",
};

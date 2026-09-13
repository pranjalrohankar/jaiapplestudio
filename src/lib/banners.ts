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

export const defaultOfferBanners: OfferBanner[] = (fallbackData.banners as OfferBanner[]) || [];

export const defaultBannersData: BannersData = {
  announcement: fallbackData.announcement || "",
  isAnnouncementActive: fallbackData.isAnnouncementActive ?? false,
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

import fallbackBannerData from "../../data/banners.json";

export type BannerConfig = {
  id?: string;
  isActive: boolean;
  badge: string;
  title: string;
  tagline: string;
  description: string;
  announcement?: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  theme: "dark-aurora" | "midnight-neon" | "cosmic-titanium" | "minimal-silver";
};

export const defaultBanner: BannerConfig = (fallbackBannerData as { banner: BannerConfig }).banner;

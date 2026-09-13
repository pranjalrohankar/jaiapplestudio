import fallbackData from "../../data/slider.json";

export type SliderSlide = {
  id: string;
  isActive: boolean;
  type?: "banner" | "showcase";
  imageFit?: "cover" | "contain";
  badge?: string;
  title?: string;
  subtitle?: string;
  price?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryText?: string;
  secondaryLink?: string;
  image: string;
  bgGradient?: string;
  accentColor?: string;
};

export type SliderData = {
  slides: SliderSlide[];
};

export const defaultSliderSlides: SliderSlide[] = (fallbackData.slides as SliderSlide[]) || [];

export const defaultSliderData: SliderData = {
  slides: defaultSliderSlides,
};

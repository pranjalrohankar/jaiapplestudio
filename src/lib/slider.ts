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

export const defaultSliderSlides: SliderSlide[] = (fallbackData.slides as SliderSlide[]) || [
  {
    id: "iphone-18-pro",
    isActive: true,
    badge: "NEW LAUNCH • PRE-BOOKINGS OPEN",
    title: "iPhone 18 Pro",
    subtitle: "Built for Apple Intelligence. Titanium powerhouse.",
    price: "Pre-orders live with zero advance fee",
    ctaText: "Pre-Order Now",
    ctaLink: "/product/iphone-18-pro",
    secondaryText: "Explore Lineup",
    secondaryLink: "/iphone",
    image: "/images/iphone-18-hero-banner.jpg",
    bgGradient: "from-[#08090d] via-[#10121a] to-[#040507]",
    accentColor: "#0071e3",
  },
  {
    id: "iphone-17-pro",
    isActive: true,
    badge: "MEGA CASHBACK OFFER",
    title: "iPhone 17 Pro",
    subtitle: "A19 Pro chip. 48MP fusion camera system in Cosmic Orange & Titanium.",
    price: "Starting from ₹1,26,900 (Price after cashback ₹1,22,900)",
    ctaText: "Buy Now",
    ctaLink: "/product/iphone-17-pro",
    secondaryText: "View Offers",
    secondaryLink: "/iphone",
    image: "https://www.apple.com/in/iphone/home/images/overview/select/iphone_17pro__t1j902iw6kya_large.jpg",
    bgGradient: "from-[#0f1118] via-[#1b1e2b] to-[#0a0b10]",
    accentColor: "#f59e0b",
  },
  {
    id: "macbook-air-m3",
    isActive: true,
    badge: "STUDENT & PRO OFFER",
    title: "MacBook Air & Pro",
    subtitle: "Supercharged by M3 & M4 chips. Up to 22 hours battery life.",
    price: "Starting from ₹99,900 + Up to 6% Student Discount",
    ctaText: "Shop Mac",
    ctaLink: "/mac",
    secondaryText: "Student Offers",
    secondaryLink: "/contact",
    image: "https://www.apple.com/v/macbook-air/s/images/overview/design/design-top__dnjh93e0ycmq_large.jpg",
    bgGradient: "from-[#0a0f1d] via-[#111c36] to-[#050811]",
    accentColor: "#38bdf8",
  },
  {
    id: "apple-watch-ultra",
    isActive: true,
    badge: "ULTIMATE ADVENTURE",
    title: "Apple Watch Ultra 3",
    subtitle: "Rugged titanium case. Precision dual-frequency GPS. Up to 72h battery.",
    price: "Starting from ₹89,900 · Special Cashback Offers",
    ctaText: "Shop Watch",
    ctaLink: "/watch",
    secondaryText: "Compare Models",
    secondaryLink: "/watch",
    image: "https://www.apple.com/v/apple-watch-ultra-2/e/images/overview/hero/hero_watch__bftq4prm5vzm_large.jpg",
    bgGradient: "from-[#111215] via-[#1c1d22] to-[#08090a]",
    accentColor: "#f97316",
  },
  {
    id: "airpods-pro-max",
    isActive: true,
    badge: "IMMERSIVE AUDIO",
    title: "AirPods Pro & Max",
    subtitle: "Active Noise Cancellation up to 2x more effective. Personalized Spatial Audio.",
    price: "Starting from ₹12,900 with No-Cost EMI",
    ctaText: "Shop Audio",
    ctaLink: "/airpods",
    secondaryText: "All Accessories",
    secondaryLink: "/accessories",
    image: "https://www.apple.com/v/airpods-max/f/images/overview/hero__gnfk5g59t0qe_large.png",
    bgGradient: "from-[#0c0d12] via-[#161822] to-[#08090c]",
    accentColor: "#a855f7",
  },
];

export const defaultSliderData: SliderData = {
  slides: defaultSliderSlides,
};

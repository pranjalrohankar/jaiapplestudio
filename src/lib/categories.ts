import fallbackData from "../../data/categories.json";

export type CategoryTile = {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  image: string;
  imageFit?: "contain" | "cover";
  link?: string;
  isActive: boolean;
};

export type CategoriesData = {
  categories: CategoryTile[];
};

export const defaultCategoryTiles: CategoryTile[] = (fallbackData.categories as CategoryTile[]) || [
  {
    id: "iphone",
    name: "iPhone",
    slug: "iphone",
    subtitle: "Explore all models",
    image: "https://www.apple.com/v/iphone/home/cd/images/overview/select/iphone_16pro__base6w621vyu_large.png",
    imageFit: "contain",
    isActive: true,
  },
  {
    id: "mac",
    name: "MacBook & Mac",
    slug: "mac",
    subtitle: "Air, Pro & Studio",
    image: "https://www.apple.com/v/macbook-air/s/images/overview/design/design-top__dnjh93e0ycmq_large.jpg",
    imageFit: "contain",
    isActive: true,
  },
  {
    id: "ipad",
    name: "iPad",
    slug: "ipad",
    subtitle: "Pro, Air & mini",
    image: "https://www.apple.com/v/ipad-air/t/images/overview/closer-look/all-colors/slide_1B__d47g5w8dviye_large.jpg",
    imageFit: "contain",
    isActive: true,
  },
  {
    id: "watch",
    name: "Apple Watch",
    slug: "watch",
    subtitle: "Series 11, Ultra & SE",
    image: "https://www.apple.com/v/apple-watch-series-10/a/images/overview/case-bands/finish_aluminum_jet_black__clm5hsq5z9au_large.png",
    imageFit: "contain",
    isActive: true,
  },
  {
    id: "airpods",
    name: "Audio & AirPods",
    slug: "airpods",
    subtitle: "AirPods 4 & Max",
    image: "https://www.apple.com/v/airpods-4/b/images/overview/hero/hero_anc__c923f7d1p16q_large.png",
    imageFit: "contain",
    isActive: true,
  },
  {
    id: "accessories",
    name: "Accessories",
    slug: "accessories",
    subtitle: "Cases, MagSafe & Power",
    image: "https://inventstore.in/wp-content/uploads/2026/06/Case-Cover.png",
    imageFit: "contain",
    isActive: true,
  },
];

export const defaultCategoriesData: CategoriesData = {
  categories: defaultCategoryTiles,
};

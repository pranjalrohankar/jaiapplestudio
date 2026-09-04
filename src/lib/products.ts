/**
 * PRODUCT CATALOG — full Apple catalog with placeholder INR prices.
 * Update prices/colors/descriptions here; the site renders automatically.
 *
 * NOTE: prices marked with "-- EDIT --" are placeholders. The client
 * should supply current street prices.
 */

export type Category = {
  slug: string;
  name: string;
  blurb: string;
  tint: string;
};

export type Color = {
  name: string;
  hex: string;
};

export type VariantInfo = {
  variants: string[];
  prices?: Record<string, string>;
};

export type Product = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  price: string;
  oldPrice?: string;
  badge?: string;
  colors: Color[];
  image?: string;
  highlights: string[];
};

import db from "../../data/products.json";

export const categories: Category[] = db.categories;

export const products: Product[] = db.products;

export const categoryBySlug = (slug: string): Category | undefined =>
  categories.find((c) => c.slug === slug);

export const productsByCategory = (slug: string): Product[] =>
  products.filter((p) => p.category === slug);

export const productBySlug = (slug: string): Product | undefined =>
  products.find((p) => p.slug === slug);

export const featured = productsByCategory("iphone").slice(0, 5);

export const iphoneHeroImage =
  "https://www.apple.com/in/iphone/home/images/overview/select/iphone_17pro__t1j902iw6kya_large.jpg";

/**
 * Storage/colour-variant options per product, used by the Add-to-Cart
 * selector and shown in the WhatsApp order message as the "Storage" column.
 * Products without an entry fall back to a single "Standard" option.
 * -- EDIT -- prices here are placeholders.
 */
const VARIANT_MAP: Record<string, VariantInfo> = {
  "iphone-18-pro": { variants: ["256GB", "512GB", "1TB", "2TB"], prices: { "256GB": "Coming Soon", "512GB": "Coming Soon", "1TB": "Coming Soon", "2TB": "Coming Soon" } },
  "iphone-18": { variants: ["128GB", "256GB", "512GB"], prices: { "128GB": "Coming Soon", "256GB": "Coming Soon", "512GB": "Coming Soon" } },
  "iphone-17-pro": { variants: ["256GB", "512GB", "1TB"], prices: { "256GB": "₹1,44,900", "512GB": "₹1,69,900", "1TB": "₹1,99,900" } },
  "iphone-17-air": { variants: ["256GB", "512GB"], prices: { "256GB": "₹1,29,900", "512GB": "₹1,49,900" } },
  "iphone-17": { variants: ["128GB", "256GB", "512GB"], prices: { "128GB": "₹79,900", "256GB": "₹89,900", "512GB": "₹1,09,900" } },
  "iphone-17e": { variants: ["128GB", "256GB", "512GB"], prices: { "128GB": "₹55,900", "256GB": "₹64,900", "512GB": "₹79,900" } },
  "iphone-16": { variants: ["128GB", "256GB", "512GB"], prices: { "128GB": "₹69,900", "256GB": "₹79,900", "512GB": "₹99,900" } },
  "iphone-15": { variants: ["128GB", "256GB"], prices: { "128GB": "₹59,900", "256GB": "₹69,900" } },
  "iphone-14": { variants: ["128GB", "256GB"], prices: { "128GB": "₹49,900", "256GB": "₹59,900" } },
  "macbook-air-13": { variants: ["256GB", "512GB", "1TB"], prices: { "256GB": "₹99,900", "512GB": "₹1,14,900", "1TB": "₹1,29,900" } },
  "macbook-air-15": { variants: ["256GB", "512GB"], prices: { "256GB": "₹1,14,900", "512GB": "₹1,29,900" } },
  "macbook-pro-14": { variants: ["512GB", "1TB", "2TB"], prices: { "512GB": "₹1,69,900", "1TB": "₹1,99,900", "2TB": "₹2,49,900" } },
  "macbook-pro-16": { variants: ["1TB", "2TB", "4TB"], prices: { "1TB": "₹2,49,900", "2TB": "₹2,99,900", "4TB": "₹3,59,900" } },
  imac: { variants: ["256GB", "512GB", "1TB"], prices: { "256GB": "₹1,34,900", "512GB": "₹1,49,900", "1TB": "₹1,64,900" } },
  "mac-mini": { variants: ["256GB", "512GB"], prices: { "256GB": "₹59,900", "512GB": "₹74,900" } },
  "ipad-pro": { variants: ["256GB", "512GB", "1TB"], prices: { "256GB": "₹99,900", "512GB": "₹1,19,900", "1TB": "₹1,49,900" } },
  "ipad-air": { variants: ["128GB", "256GB"], prices: { "128GB": "₹59,900", "256GB": "₹69,900" } },
  ipad: { variants: ["128GB", "256GB"], prices: { "128GB": "₹39,900", "256GB": "₹49,900" } },
  "ipad-mini": { variants: ["128GB", "256GB"], prices: { "128GB": "₹49,900", "256GB": "₹59,900" } },
  "apple-watch-ultra": { variants: ["49mm"] },
  "apple-watch-series": { variants: ["42mm", "46mm"] },
  "apple-watch-se": { variants: ["40mm", "44mm"] },
  "airpods-pro-3": { variants: ["Standard"] },
  "airpods-4": { variants: ["Standard"] },
  "airpods-max": { variants: ["Standard"] },
  "magsafe-charger": { variants: ["Standard"] },
  "20w-usb-c-power-adapter": { variants: ["Standard"] },
  airtag: { variants: ["Standard"] },
  "silicone-case": { variants: ["Standard"] },
  "clear-case": { variants: ["Standard"] },
  "usb-c-cable": { variants: ["Standard"] },
};

export function getVariants(product: Product): VariantInfo {
  return VARIANT_MAP[product.slug] ?? { variants: ["Standard"] };
}

export function priceForVariant(product: Product, variant: string): string {
  const info = VARIANT_MAP[product.slug];
  return info?.prices?.[variant] ?? product.price;
}
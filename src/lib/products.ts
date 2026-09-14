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
  image?: string;
  images?: string[];
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
  status?: "in-stock" | "pre-order" | "coming-soon" | "new-launch" | string;
  colors: Color[];
  image?: string;
  images?: string[];
  highlights: string[];
};

import db from "../../data/products.json";

export const categories: Category[] = db.categories;

export const products: Product[] = db.products;

export function normalizeSlug(slug?: string): string {
  if (!slug) return "";
  try {
    slug = decodeURIComponent(slug);
  } catch {}
  return slug
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-");
}

export function matchProductSlug(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  try {
    if (decodeURIComponent(a) === decodeURIComponent(b)) return true;
  } catch {}
  return normalizeSlug(a) === normalizeSlug(b);
}

export const categoryBySlug = (slug: string): Category | undefined =>
  categories.find((c) => matchProductSlug(c.slug, slug));

export const productsByCategory = (slug: string): Product[] =>
  products.filter((p) => matchProductSlug(p.category, slug));

export const productBySlug = (slug: string): Product | undefined =>
  products.find((p) => matchProductSlug(p.slug, slug) || matchProductSlug(p.name, slug));

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
  "iphone-duo": { variants: ["256GB", "512GB", "1TB"], prices: { "256GB": "Starting From ₹2,99,999", "512GB": "₹3,29,999", "1TB": "₹3,69,999" } },
  "iphone-18-pro": { variants: ["256GB", "512GB", "1TB", "2TB"], prices: { "256GB": "Starting From ₹1,49,900", "512GB": "₹1,69,900", "1TB": "₹1,99,900", "2TB": "₹2,39,900" } },
  "iphone-18": { variants: ["128GB", "256GB", "512GB"], prices: { "128GB": "Starting From ₹84,900", "256GB": "₹94,900", "512GB": "₹1,14,900" } },
  "iphone-17-pro-max": { variants: ["256GB", "512GB", "1TB", "2TB"], prices: { "256GB": "₹1,39,900", "512GB": "₹1,59,900", "1TB": "₹1,89,900", "2TB": "₹2,19,900" } },
  "iphone-17-pro": { variants: ["256GB", "512GB", "1TB"], prices: { "256GB": "₹1,26,900", "512GB": "₹1,46,900", "1TB": "₹1,76,900" } },
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
  if (!product) return { variants: ["Standard"] };
  const matchedKey = Object.keys(VARIANT_MAP).find((key) => matchProductSlug(key, product.slug));
  if (matchedKey) {
    return VARIANT_MAP[matchedKey];
  }
  return { variants: ["Standard"] };
}

export function priceForVariant(product: Product, variant: string): string {
  if (!product) return "₹0";
  const info = getVariants(product);
  return info?.prices?.[variant] ?? product.price;
}
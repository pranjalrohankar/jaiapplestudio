import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import AddToCartButton from "@/components/AddToCartButton";
import type { Product } from "@/lib/products";

export default function ProductCard({ product }: { product: Product }) {
  const isComingSoon =
    product.badge?.toLowerCase().includes("coming soon") ||
    product.price?.toLowerCase().includes("coming soon");

  return (
    <div className="group flex flex-col justify-between rounded-[2rem] bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.06] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
      <div>
        {/* Top Product Showcase Link */}
        <Link
          href={`/product/${product.slug}`}
          className="relative block overflow-hidden rounded-2xl bg-[#f5f5f7] p-2 transition-transform duration-300 group-hover:scale-[1.01]"
        >
          <ProductImage product={product} className="aspect-[4/3] w-full" />
          {product.badge ? (
            <span
              className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-wide text-white shadow-sm ${
                isComingSoon
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 ring-1 ring-purple-300/40"
                  : "bg-ink"
              }`}
            >
              {isComingSoon ? (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                </span>
              ) : null}
              {product.badge}
            </span>
          ) : null}
        </Link>

        {/* Product Meta */}
        <div className="mt-4 flex flex-col">
          <Link
            href={`/product/${product.slug}`}
            className="text-lg sm:text-xl font-bold tracking-tight text-ink hover:text-apple transition"
          >
            {product.name}
          </Link>
          <p className="mt-1 text-xs sm:text-sm text-ink/65 line-clamp-2 leading-relaxed min-h-[36px]">
            {product.tagline}
          </p>

          {/* Color Dots Swatch */}
          {product.colors.length > 0 ? (
            <div className="mt-3 flex items-center gap-1.5 min-h-[18px]">
              {product.colors.map((c) => (
                <span
                  key={c.name}
                  title={c.name}
                  className="h-3.5 w-3.5 rounded-full ring-1 ring-black/15 shadow-inner"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          ) : (
            <div className="mt-3 min-h-[18px]" />
          )}

          {/* Price */}
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-lg sm:text-xl font-extrabold ${
                isComingSoon ? "text-purple-700" : "text-ink"
              }`}
            >
              {product.price}
            </span>
            {product.oldPrice ? (
              <span className="text-xs sm:text-sm text-ink/40 line-through">
                {product.oldPrice}
              </span>
            ) : null}
          </div>
          <p className="text-[11px] text-ink/45 mt-0.5">
            {isComingSoon
              ? "*Pre-orders open. Select finish & storage."
              : "*Indicative price. Configure options to buy."}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="mt-5 pt-3.5 border-t border-black/[0.06] flex items-center gap-2">
        <AddToCartButton
          product={product}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-apple py-2.5 px-3 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-apple-dark active:scale-[0.98] whitespace-nowrap overflow-hidden"
        />
        <Link
          href={`/product/${product.slug}`}
          className="inline-flex items-center justify-center rounded-full border border-black/15 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-ink transition hover:bg-[#f5f5f7] hover:border-black/30 shrink-0 whitespace-nowrap"
        >
          Details
        </Link>
      </div>
    </div>
  );
}
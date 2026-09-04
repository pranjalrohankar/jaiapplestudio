import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import AddToCartButton from "@/components/AddToCartButton";
import { WhatsAppButton } from "@/components/EnquiryButtons";
import type { Product } from "@/lib/products";

export default function ProductCard({ product }: { product: Product }) {
  const isComingSoon =
    product.badge?.toLowerCase().includes("coming soon") ||
    product.price?.toLowerCase().includes("coming soon");

  return (
    <div className="group flex flex-col rounded-3xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_12px_28px_-18px_rgba(0,0,0,0.2)] ring-1 ring-black/[0.04] transition duration-300 hover:-translate-y-1 hover:shadow-[0_2px_6px_rgba(0,0,0,0.08),0_20px_40px_-20px_rgba(0,0,0,0.3)] sm:p-7">
      <Link
        href={`/product/${product.slug}`}
        className="relative block overflow-hidden rounded-2xl bg-cloud"
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

      <div className="mt-5 flex flex-1 flex-col">
        <Link href={`/product/${product.slug}`} className="text-xl font-semibold tracking-tight hover:text-apple">
          {product.name}
        </Link>
        <p className="mt-1 text-[15px] text-ink/70">{product.tagline}</p>

        {product.colors.length > 0 ? (
          <div className="mt-3 flex items-center gap-2">
            {product.colors.map((c) => (
              <span
                key={c.name}
                title={c.name}
                className="h-4 w-4 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex items-baseline gap-2">
          <span
            className={`text-lg font-semibold ${
              isComingSoon ? "text-purple-700 font-bold" : "text-ink"
            }`}
          >
            {product.price}
          </span>
          {product.oldPrice ? (
            <span className="text-sm text-ink/40 line-through">{product.oldPrice}</span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-ink/50">
          {isComingSoon
            ? "*Pre-booking open now. Deliveries begin on official launch."
            : "*Price may vary. Confirm price with store."}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-black/5 pt-4 sm:mt-auto">
          {isComingSoon ? (
            <WhatsAppButton
              productName={`${product.name} (Pre-Book)`}
              label="Pre-Book"
              className="btn-wa px-5 py-2 text-[15px] font-bold"
            />
          ) : (
            <AddToCartButton product={product} className="btn-apple px-5 py-2 text-[15px]" />
          )}
          <WhatsAppButton
            productName={product.name}
            label="Enquire"
            className="btn-ghost !border-black/10 px-4 py-2 text-[15px]"
          />
          <Link
            href={`/product/${product.slug}`}
            className="ml-auto text-sm font-semibold text-apple hover:underline"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
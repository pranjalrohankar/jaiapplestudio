"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { getVariants, priceForVariant, type Product } from "@/lib/products";
import { priceValue, formatINR } from "@/lib/currency";
import {
  MinusIcon,
  PlusIcon,
  BagIcon,
  CheckIcon,
  ChevronRightIcon,
  StarIcon,
  WhatsAppIcon,
} from "@/lib/icons";
import QuickEnquiryModal from "@/components/QuickEnquiryModal";

export default function ProductDetailConfigurator({ product }: { product: Product }) {
  const router = useRouter();
  const info = getVariants(product);
  const { addItem, count } = useCart();

  const [color, setColor] = useState<string>(product.colors[0]?.name ?? "");
  const [variant, setVariant] = useState<string>(info.variants[0] ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  const priceLabel = priceForVariant(product, variant);
  const numericUnitPrice = priceValue(priceLabel);
  const isPreOrder =
    product.badge?.toLowerCase().includes("pre-order") ||
    product.badge?.toLowerCase().includes("preorder");

  const isComingSoon =
    !isPreOrder &&
    (product.badge?.toLowerCase().includes("coming soon") ||
      product.price?.toLowerCase().includes("coming soon"));

  const activeColorObj = product.colors.find((c) => c.name === color) ?? product.colors[0];
  const displayImage = activeColorObj?.image || product.image;

  const totalPrice =
    numericUnitPrice > 0 ? formatINR(numericUnitPrice * qty) : priceLabel;

  const emiPerMonth =
    numericUnitPrice > 0 ? formatINR(Math.round(numericUnitPrice / 12)) : null;

  function handleAddToCart() {
    addItem(product, qty, { color, variant, priceLabel });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 3500);
  }

  function handleBuyNow() {
    addItem(product, qty, { color, variant, priceLabel });
    router.push("/cart");
  }

  return (
    <div className="grid items-start gap-12 lg:grid-cols-12">
      {/* LEFT COLUMN: Large Interactive Showcase */}
      <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-6">
        {/* Main Product Showcase Box */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-[#fbfbfd] via-[#f5f5f7] to-[#ebebee] p-8 sm:p-12 border border-black/[0.06] shadow-sm flex flex-col items-center justify-center min-h-[380px] sm:min-h-[480px]">
          {/* Badge */}
          {product.badge && (
            <span
              className={`absolute top-6 left-6 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white shadow-xs ${
                isPreOrder
                  ? "bg-[#0071e3]"
                  : isComingSoon
                  ? "bg-[#5856d6]"
                  : "bg-[#1d1d1f]"
              }`}
            >
              {product.badge}
            </span>
          )}

          {/* Product Centerpiece */}
          <div className="relative aspect-square w-full max-w-[340px] sm:max-w-[420px] my-auto flex items-center justify-center">
            {displayImage ? (
              <div
                key={displayImage}
                className="relative w-full h-full animate-fadeIn transition-all duration-300 flex items-center justify-center"
              >
                <Image
                  src={displayImage}
                  alt={`${product.name} - ${color}`}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 500px"
                  className="object-contain p-3 sm:p-4 drop-shadow-[0_20px_45px_rgba(0,0,0,0.12)] transition-all duration-300 hover:scale-[1.03]"
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-ink/30">
                {product.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Active Color Name Pill */}
          {activeColorObj && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-full bg-white/90 py-2 px-4 shadow-sm ring-1 ring-black/10 backdrop-blur-md">
              <span
                className="h-4 w-4 rounded-full ring-1 ring-black/20 shadow-inner"
                style={{ backgroundColor: activeColorObj.hex }}
              />
              <span className="text-xs font-bold text-ink tracking-wide">
                Finish: {activeColorObj.name}
              </span>
            </div>
          )}

          {/* Interactive Color Finish Mini Bar for Instant Switching */}
          {product.colors.length > 1 && (
            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap max-w-full">
              {product.colors.map((c) => {
                const isSelected = (activeColorObj?.name || color) === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColor(c.name)}
                    title={`Switch to ${c.name}`}
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white text-[#0071e3] ring-2 ring-[#0071e3] shadow-xs scale-105"
                        : "bg-white/70 text-gray-700 hover:bg-white hover:scale-102 ring-1 ring-black/10"
                    }`}
                  >
                    <span
                      className="h-3 w-3 rounded-full ring-1 ring-black/15 shadow-inner"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Invisible Preloader for zero-latency color switching */}
          <div className="hidden" aria-hidden="true">
            {product.colors.map((c) =>
              c.image ? <img key={c.name} src={c.image} alt="" className="hidden" /> : null
            )}
          </div>
        </div>

        {/* Apple Value Guarantee Strip */}
        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/[0.06] shadow-sm text-center">
          <div className="space-y-1">
            <span className="text-lg">🛡️</span>
            <p className="text-xs font-bold text-ink">1-Yr Warranty</p>
            <p className="text-[10px] text-ink/50">Official Apple India</p>
          </div>
          <div className="space-y-1 border-x border-black/5">
            <span className="text-lg">⚡</span>
            <p className="text-xs font-bold text-ink">No-Cost EMI</p>
            <p className="text-[10px] text-ink/50">Up to 12 months</p>
          </div>
          <div className="space-y-1">
            <span className="text-lg">🚚</span>
            <p className="text-xs font-bold text-ink">Fast Delivery</p>
            <p className="text-[10px] text-ink/50">Pickup or Pune Metro</p>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Full Apple Configurator & Highlights */}
      <div className="lg:col-span-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-ink">
            {product.name}
          </h1>
          <p className="mt-2 text-base sm:text-lg text-ink/65 font-medium leading-relaxed">
            {product.tagline}
          </p>

          {/* Pricing & EMI Card */}
          <div className="mt-5 rounded-2xl bg-[#f8f8fa] p-5 border border-[#e6e6e6]">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                  Store Price
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span
                    className={`text-3xl sm:text-4xl font-extrabold ${
                      isComingSoon ? "text-purple-700" : "text-[#111111]"
                    }`}
                  >
                    {priceLabel}
                  </span>
                  {product.oldPrice && (
                    <span className="text-base text-gray-400 line-through font-semibold">
                      {product.oldPrice}
                    </span>
                  )}
                </div>

                {numericUnitPrice > 0 && !isComingSoon && (
                  <p className="mt-1.5 text-xs sm:text-sm font-bold text-[#0a8848]">
                    <span>Price After Cashback: </span>
                    <span className="text-base">
                      {formatINR(
                        numericUnitPrice -
                          (numericUnitPrice > 80000
                            ? 5000
                            : numericUnitPrice > 40000
                            ? 4000
                            : 2000)
                      )}
                    </span>
                  </p>
                )}
              </div>

              {emiPerMonth && (
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                    No-Cost EMI
                  </span>
                  <p className="text-xs font-bold text-gray-900 mt-1">
                    From {emiPerMonth}/mo*
                  </p>
                </div>
              )}
            </div>

            <p className="mt-3 text-xs text-gray-500 leading-relaxed border-t border-gray-200/80 pt-2.5">
              {isComingSoon
                ? "*Pre-booking open now. Zero advance fee with priority allocation on official launch day."
                : "*Prices are inclusive of all taxes. Final best price, instant bank cashback & exchange bonus applied at checkout."}
            </p>
          </div>

          <p className="mt-4 text-sm text-ink/75 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* 1. SELECT FINISH / COLOR */}
        {product.colors.length > 0 && (
          <div className="border-t border-black/10 pt-6">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink/60">
                1. Select Finish:{" "}
                <span className="text-ink font-extrabold text-sm capitalize">{color}</span>
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {product.colors.map((c) => {
                const isSelected = color === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColor(c.name)}
                    className={`group flex items-center gap-3 rounded-full px-4 py-2.5 text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-ink text-white shadow-md ring-2 ring-ink ring-offset-2 scale-[1.02]"
                        : "bg-[#f5f5f7] text-ink/80 hover:bg-gray-200"
                    }`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full shrink-0 shadow-inner ${
                        isSelected ? "ring-2 ring-white" : "ring-1 ring-black/15"
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. SELECT STORAGE / CAPACITY */}
        {info.variants.length > 0 && (
          <div className="border-t border-black/10 pt-6">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink/60">
                2. Select Storage / Model:{" "}
                <span className="text-ink font-extrabold text-sm">{variant}</span>
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {info.variants.map((v) => {
                const isSelected = variant === v;
                const vPrice =
                  info.prices?.[v] || (isComingSoon ? "Coming Soon" : product.price);
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVariant(v)}
                    className={`flex flex-col items-center justify-center rounded-2xl p-4 border text-center transition-all ${
                      isSelected
                        ? "border-apple bg-apple/[0.05] text-ink ring-2 ring-apple/20 shadow-sm"
                        : "border-gray-200 bg-white text-ink hover:border-gray-300 hover:bg-[#fafafa]"
                    }`}
                  >
                    <span className="text-base font-extrabold">{v}</span>
                    <span
                      className={`text-xs mt-1 font-semibold ${
                        isSelected ? "text-apple" : "text-ink/60"
                      }`}
                    >
                      {vPrice}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. QUANTITY & TOTAL */}
        <div className="border-t border-black/10 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-ink/60 block">
                Quantity
              </span>
              <span className="text-sm font-semibold text-ink/70">
                Total: <span className="font-extrabold text-ink text-base">{totalPrice}</span>
              </span>
            </div>

            <div className="flex items-center gap-3 rounded-full bg-[#f5f5f7] p-1.5 ring-1 ring-black/5">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-8 w-8 place-items-center rounded-full bg-white text-ink shadow-sm transition hover:bg-ink hover:text-white"
                aria-label="Decrease quantity"
              >
                <MinusIcon width={14} height={14} />
              </button>
              <span className="w-8 text-center text-sm font-bold text-ink">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(10, q + 1))}
                className="grid h-8 w-8 place-items-center rounded-full bg-white text-ink shadow-sm transition hover:bg-ink hover:text-white"
                aria-label="Increase quantity"
              >
                <PlusIcon width={14} height={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-apple py-4 px-6 text-base font-bold text-white shadow-lg shadow-apple/20 transition hover:bg-apple-dark active:scale-[0.99]"
            >
              {added ? (
                <>
                  <CheckIcon width={18} height={18} />
                  Added to Bag ({count})
                </>
              ) : (
                <>
                  <BagIcon width={18} height={18} />
                  {isPreOrder ? `Pre-Order Now — ${totalPrice}` : isComingSoon ? "Pre-Book to Cart" : `Add to Cart — ${totalPrice}`}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-ink py-4 px-6 text-base font-bold text-white shadow-xl shadow-black/10 transition hover:bg-zinc-800 active:scale-[0.99]"
            >
              <BagIcon width={18} height={18} />
              {isPreOrder ? "Instant Pre-Booking →" : "Buy Now →"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsEnquiryOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-[#f5f5f7] hover:bg-gray-200 py-3 px-4 text-xs font-bold text-ink transition border border-black/5"
          >
            <WhatsAppIcon width={16} height={16} className="text-wa-dark" />
            <span>⚡ Have a Question? Quick Enquiry &amp; EMI Info</span>
          </button>

          <p className="text-center text-xs text-ink/50">
            Free store pickup at Jai Apple Store, Jay Plaza, Pimpri or express delivery across Pune.
          </p>
        </div>

        {/* HIGHLIGHTS & SPECS */}
        {product.highlights.length > 0 && (
          <div className="rounded-3xl bg-[#f5f5f7] p-6 sm:p-7 border border-black/[0.05]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink/55">
              Key Features & Highlights
            </h3>
            <ul className="mt-4 space-y-3">
              {product.highlights.map((h) => (
                <li key={h} className="flex items-start gap-3 text-sm font-medium text-ink/85">
                  <CheckIcon width={18} height={18} className="mt-0.5 shrink-0 text-apple" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Quick Product Enquiry Modal */}
      <QuickEnquiryModal
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
        productName={product.name}
        productSlug={product.slug}
        variant={variant}
        color={color}
        price={totalPrice}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { getVariants, priceForVariant, type Product } from "@/lib/products";
import { priceValue, formatINR } from "@/lib/currency";
import { CloseIcon, MinusIcon, PlusIcon, BagIcon, CheckIcon } from "@/lib/icons";

export default function SellModal({
  product,
  onClose,
  onAdded,
}: {
  product: Product;
  onClose: () => void;
  onAdded: () => void;
}) {
  const info = getVariants(product);
  const { addItem } = useCart();

  const [mounted, setMounted] = useState(false);
  const [color, setColor] = useState<string>(product.colors[0]?.name ?? "");
  const [variant, setVariant] = useState<string>(info.variants[0] ?? "");
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const priceLabel = priceForVariant(product, variant);
  const numericUnitPrice = priceValue(priceLabel);
  const isPreOrder =
    product.badge?.toLowerCase().includes("pre-order") ||
    product.badge?.toLowerCase().includes("preorder");

  const isComingSoon =
    !isPreOrder &&
    (product.badge?.toLowerCase().includes("coming soon") ||
      product.price?.toLowerCase().includes("coming soon"));

  const isSpecial = isPreOrder || isComingSoon;

  const activeColorObj = product.colors.find((c) => c.name === color) ?? product.colors[0];
  const displayImage = activeColorObj?.image || product.image;

  function handleConfirmAdd() {
    addItem(product, qty, { color, variant, priceLabel });
    onAdded();
    setJustAdded(true);
  }

  // Monthly EMI estimation for display
  const emiPerMonth =
    numericUnitPrice > 0
      ? formatINR(Math.round(numericUnitPrice / 12))
      : null;

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3 sm:p-6 backdrop-blur-xl transition-opacity animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg md:max-w-3xl lg:max-w-4xl overflow-hidden rounded-[2.25rem] bg-white shadow-[0_25px_80px_rgba(0,0,0,0.4)] ring-1 ring-black/10 max-h-[92vh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-sm ring-1 ring-black/10 backdrop-blur-md transition hover:bg-ink hover:text-white"
          aria-label="Close modal"
        >
          <CloseIcon width={18} height={18} />
        </button>

        {/* LEFT COLUMN: Product Visual Studio Showcase */}
        <div className="relative bg-gradient-to-b from-[#fbfbfd] via-[#f5f5f7] to-[#ebebee] p-6 sm:p-8 md:w-5/12 lg:w-1/2 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-black/[0.06] shrink-0">
          {/* Badge & Category */}
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/45">
              Apple Official Device
            </span>
            {product.badge ? (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow-xs ${
                  isPreOrder
                    ? "bg-[#0071e3]"
                    : isComingSoon
                    ? "bg-[#5856d6]"
                    : "bg-[#1d1d1f]"
                }`}
              >
                {product.badge}
              </span>
            ) : null}
          </div>

          {/* Product Centerpiece Visual */}
          <div className="relative h-44 sm:h-56 md:h-64 w-full max-w-[280px] my-4 flex items-center justify-center">
            {displayImage ? (
              <div
                key={displayImage}
                className="relative w-full h-full animate-fadeIn transition-all duration-300 flex items-center justify-center"
              >
                <Image
                  src={displayImage}
                  alt={`${product.name} - ${color}`}
                  fill
                  sizes="(max-width: 768px) 300px, 400px"
                  className="object-contain p-2.5 drop-shadow-[0_15px_35px_rgba(0,0,0,0.12)] transition duration-300"
                  priority
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center font-bold text-ink/30 text-4xl">
                {product.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* Active Finish Indicator & Guarantees */}
          <div className="w-full space-y-3">
            {activeColorObj && (
              <div className="flex items-center justify-center gap-2 rounded-full bg-white/80 py-1.5 px-3.5 backdrop-blur-md ring-1 ring-black/5 mx-auto max-w-max">
                <span
                  className="h-3.5 w-3.5 rounded-full ring-1 ring-black/20 shadow-inner"
                  style={{ backgroundColor: activeColorObj.hex }}
                />
                <span className="text-xs font-bold text-ink">{activeColorObj.name}</span>
              </div>
            )}

            {/* Invisible Preloader */}
            <div className="hidden" aria-hidden="true">
              {product.colors.map((c) =>
                c.image ? <img key={c.name} src={c.image} alt="" className="hidden" /> : null
              )}
            </div>

            <div className="hidden sm:grid grid-cols-2 gap-2 pt-2 border-t border-black/5 text-[11px] text-ink/60 text-center">
              <span className="flex items-center justify-center gap-1">
                🛡️ 1-Yr Official Warranty
              </span>
              <span className="flex items-center justify-center gap-1">
                ⚡ No-Cost EMI Available
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Configurator or Added State */}
        <div className="flex-1 p-6 sm:p-8 overflow-y-auto flex flex-col justify-between">
          {justAdded ? (
            /* Celebratory Added State */
            <div className="flex flex-col items-center justify-center text-center py-6 sm:py-10 space-y-5 animate-fadeIn">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm ring-8 ring-emerald-50">
                <CheckIcon width={32} height={32} />
              </div>

              <div>
                <h3 className="text-2xl font-bold tracking-tight text-ink">Added to Your Bag</h3>
                <p className="text-sm text-ink/60 mt-1">
                  {qty} × {product.name} {variant ? `(${variant})` : ""}{" "}
                  {color ? `• ${color}` : ""}
                </p>
                <p className="text-lg font-extrabold text-ink mt-2">
                  {numericUnitPrice > 0 ? formatINR(numericUnitPrice * qty) : priceLabel}
                </p>
              </div>

              <div className="w-full max-w-sm space-y-3 pt-4 border-t border-black/10">
                <Link
                  href="/cart"
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-ink py-4 text-sm font-bold text-white shadow-xl shadow-black/10 transition hover:bg-zinc-800"
                >
                  <BagIcon width={18} height={18} />
                  Review Bag & Buy Now
                </Link>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full rounded-full bg-cloud py-3 text-xs font-bold text-ink hover:bg-gray-200 transition"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            /* Interactive Customizer */
            <div className="space-y-6">
              {/* Product Header */}
              <div className="border-b border-black/[0.06] pb-4">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                  {product.name}
                </h2>
                <p className="text-sm text-ink/60 mt-0.5">{product.tagline}</p>

                <div className="mt-3 flex items-baseline gap-3">
                  <span
                    className={`text-2xl font-extrabold ${
                      isComingSoon ? "text-purple-700" : "text-ink"
                    }`}
                  >
                    {priceLabel}
                  </span>
                  {emiPerMonth && (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full ring-1 ring-emerald-200">
                      EMI from {emiPerMonth}/mo
                    </span>
                  )}
                </div>
              </div>

              {/* 1. Finish Selection */}
              {product.colors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink/50">
                      1. Choose Finish:{" "}
                      <span className="text-ink font-bold capitalize">{color}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {product.colors.map((c) => {
                      const isSelected = color === c.name;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setColor(c.name)}
                          className={`group relative flex items-center gap-2.5 rounded-full px-4 py-2.5 text-xs font-semibold transition-all ${
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

              {/* 2. Storage / Capacity Selection */}
              {info.variants.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink/50">
                      2. Choose Storage / Model:{" "}
                      <span className="text-ink font-bold">{variant}</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {info.variants.map((v) => {
                      const isSelected = variant === v;
                      const vPrice =
                        info.prices?.[v] || (isComingSoon ? "Coming Soon" : product.price);
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setVariant(v)}
                          className={`flex flex-col items-center justify-center rounded-2xl p-3.5 border text-center transition-all ${
                            isSelected
                              ? "border-apple bg-apple/[0.04] text-ink ring-2 ring-apple/20 shadow-sm"
                              : "border-gray-200 bg-white text-ink hover:border-gray-300 hover:bg-[#fafafa]"
                          }`}
                        >
                          <span className="text-sm font-bold">{v}</span>
                          <span
                            className={`text-[11px] mt-1 font-medium ${
                              isSelected ? "text-apple font-bold" : "text-ink/60"
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

              {/* 3. Quantity Stepper */}
              <div className="flex items-center justify-between pt-3 border-t border-black/[0.06]">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-ink/50 block">
                    Quantity
                  </span>
                  <span className="text-xs text-ink/60">
                    Total:{" "}
                    <span className="font-bold text-ink">
                      {numericUnitPrice > 0
                        ? formatINR(numericUnitPrice * qty)
                        : isComingSoon
                        ? "Pre-Order"
                        : priceLabel}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-full bg-[#f5f5f7] p-1 ring-1 ring-black/5">
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

              {/* Bottom CTA Action Bar */}
              <div className="pt-4 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={handleConfirmAdd}
                  className="w-full flex items-center justify-center gap-2.5 rounded-full bg-ink py-4 text-sm sm:text-base font-bold text-white shadow-xl shadow-black/10 transition hover:bg-zinc-800 active:scale-[0.99]"
                >
                  <BagIcon width={18} height={18} />
                  {isPreOrder
                    ? "Add Pre-Order to Bag"
                    : isComingSoon
                    ? "Add Pre-Booking to Bag"
                    : `Add to Bag — ${
                        numericUnitPrice > 0 ? formatINR(numericUnitPrice * qty) : priceLabel
                      }`}
                </button>
                <p className="mt-2 text-center text-[11px] text-ink/45">
                  Free store pickup & express delivery across Pune / Pimpri-Chinchwad.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
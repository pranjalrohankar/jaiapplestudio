"use client";

import { useState } from "react";
import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import AddToCartButton from "@/components/AddToCartButton";
import type { Product } from "@/lib/products";
import { priceValue, formatINR } from "@/lib/currency";

export default function ProductCard({ product }: { product: Product }) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const isPreOrder =
    product.badge?.toLowerCase().includes("pre-order") ||
    product.badge?.toLowerCase().includes("preorder");

  const isComingSoon =
    !isPreOrder &&
    (product.badge?.toLowerCase().includes("coming soon") ||
      product.price?.toLowerCase().includes("coming soon"));

  const isSpecial = isPreOrder || isComingSoon;

  const numericPrice = priceValue(product.price);
  const numericOldPrice = product.oldPrice ? priceValue(product.oldPrice) : 0;
  
  // Calculate discount if old price exists
  const discountAmount =
    numericOldPrice > numericPrice && numericPrice > 0
      ? formatINR(numericOldPrice - numericPrice)
      : null;

  // Calculate instant bank cashback (₹3000 to ₹5000 for Apple devices, matching iNvent)
  const cashbackAmount =
    numericPrice > 80000 ? 4000 : numericPrice > 40000 ? 3000 : numericPrice > 20000 ? 2000 : 0;
  const priceAfterCashback =
    numericPrice > 0 && cashbackAmount > 0 ? formatINR(numericPrice - cashbackAmount) : null;

  // Find active color object if user selected/hovered one
  const activeColorObj = selectedColor
    ? product.colors.find((c) => c.name === selectedColor)
    : null;
  const activeImage = activeColorObj?.image || product.image;

  return (
    <div className="product-block group flex flex-col justify-between rounded-2xl bg-white p-4 sm:p-5 border border-[#e6e6e6] transition-all duration-300 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] hover:border-gray-300 h-full">
      <div>
        {/* Top Product Image Container */}
        <Link
          href={`/product/${product.slug}`}
          className="relative block overflow-hidden rounded-2xl bg-[#f8f8fa] hover:bg-[#f2f2f6] p-3 sm:p-4 mb-3 transition-colors duration-300"
        >
          <div className="w-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <ProductImage
              product={product}
              overrideImage={activeImage}
              className="aspect-square w-full object-contain max-h-[210px]"
            />
          </div>

          {/* iNvent Style Price-Off / Status Badge */}
          {product.badge ? (
            <span
              className={`price-off-tag absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs ${
                isPreOrder
                  ? "bg-[#0071e3]"
                  : isComingSoon
                  ? "bg-[#5856d6]"
                  : "bg-[#1d1d1f]"
              }`}
            >
              {product.badge}
            </span>
          ) : discountAmount ? (
            <span className="price-off-tag absolute left-3 top-3 inline-flex items-center rounded-full bg-[#0071e3]/10 border border-[#0071e3]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#0071e3]">
              {discountAmount} Off
            </span>
          ) : null}
        </Link>

        {/* Product Description Content (matching iNvent .product-desc-content) */}
        <div className="product-desc-content flex flex-col">
          <Link
            href={`/product/${product.slug}`}
            className="product-title text-base font-semibold tracking-tight text-[#111111] hover:text-[#0071e3] transition line-clamp-1"
          >
            {product.name}
          </Link>

          {/* Tagline / Subtitle */}
          <p className="mt-1 text-xs text-gray-500 line-clamp-1 min-h-[18px]">
            {product.tagline}
          </p>

          {/* Color Dots Swatch with Interactive Switching */}
          {product.colors.length > 0 ? (
            <div className="mt-2 flex items-center gap-1.5 min-h-[18px]">
              {product.colors.map((c) => {
                const isActive = (selectedColor || product.colors[0]?.name) === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    onMouseEnter={() => setSelectedColor(c.name)}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedColor(c.name);
                    }}
                    className={`h-3.5 w-3.5 rounded-full border transition-all cursor-pointer ${
                      isActive
                        ? "ring-2 ring-[#0071e3] ring-offset-1 scale-110 border-transparent shadow-xs"
                        : "border-black/20 hover:scale-110"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    aria-label={`Select ${c.name}`}
                  />
                );
              })}
            </div>
          ) : (
            <div className="mt-2 min-h-[18px]" />
          )}

          {/* Pricing Area (matching iNvent .product-price) */}
          <div className="product-price mt-3 pt-2.5 border-t border-gray-100">
            <div className="flex items-baseline gap-2">
              {product.oldPrice && numericOldPrice > numericPrice ? (
                <del className="text-xs text-gray-400 line-through">
                  {product.oldPrice}
                </del>
              ) : null}
              <ins className="no-underline">
                <span
                  className={`text-base sm:text-[17px] font-bold ${
                    isPreOrder
                      ? "text-[#0071e3]"
                      : isComingSoon
                      ? "text-purple-700"
                      : "text-[#111111]"
                  }`}
                >
                  {product.price}
                </span>
              </ins>
            </div>

            {/* iNvent Signature: Price After Cashback */}
            {priceAfterCashback && !isSpecial ? (
              <p className="offer_price mt-1 text-[11.5px] font-semibold text-[#0a8848]">
                <span>Price After Cashback </span>
                <span className="font-bold">{priceAfterCashback}</span>
              </p>
            ) : isPreOrder ? (
              <p className="mt-1 text-[11.5px] font-semibold text-blue-600">
                Pre-Orders Live · Reserve Yours
              </p>
            ) : isComingSoon ? (
              <p className="mt-1 text-[11.5px] font-semibold text-purple-600">
                Coming Soon · Pre-Bookings Open
              </p>
            ) : null}

            {/* Cashback Subtext Note */}
            {cashbackAmount > 0 && !isSpecial ? (
              <p className="cashback-message text-[11px] text-gray-500 mt-0.5">
                Get {formatINR(cashbackAmount)} Instant cashback
              </p>
            ) : (
              <p className="text-[11px] text-gray-400 mt-0.5">
                100% Genuine Apple Warranty
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action CTA: iNvent Outline / Solid Primary Button */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <AddToCartButton
          product={product}
          label="Buy now"
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-[#0071e3] bg-transparent text-[#0071e3] hover:bg-[#0071e3] hover:text-white py-2 px-3 text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-[0.98] whitespace-nowrap"
        />
      </div>
    </div>
  );
}
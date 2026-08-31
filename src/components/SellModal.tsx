"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { getVariants, priceForVariant, type Product } from "@/lib/products";
import ProductImage from "@/components/ProductImage";
import { CloseIcon, MinusIcon, PlusIcon, BagIcon } from "@/lib/icons";

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

  const [color, setColor] = useState<string>(product.colors[0]?.name ?? "");
  const [variant, setVariant] = useState<string>(info.variants[0]);
  const [qty, setQty] = useState(1);

  const priceLabel = priceForVariant(product, variant);

  function confirm() {
    addItem(product, qty, { color, variant, priceLabel });
    onAdded();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-white shadow-2xl sm:rounded-[2rem]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 pb-0">
          <span className="text-sm font-semibold text-ink/50">Choose options</span>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-ink transition hover:bg-ink hover:text-white"
            aria-label="Close"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        <div className="px-6 pt-5">
          <ProductImage product={product} className="aspect-[16/9] w-full rounded-2xl" />
        </div>

        <div className="p-6">
          <h3 className="text-xl font-semibold tracking-tight">{product.name}</h3>
          <p className="mt-1 text-lg font-semibold text-apple">{priceLabel}</p>

          {product.colors.length > 0 ? (
            <div className="mt-5">
              <p className="text-sm font-semibold uppercase tracking-wider text-ink/50">Colour</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setColor(c.name)}
                    className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                      color === c.name
                        ? "bg-ink text-white"
                        : "bg-cloud text-ink/80 hover:bg-gray-200"
                    }`}
                  >
                    <span
                      className={`h-4 w-4 rounded-full ${color === c.name ? "ring-2 ring-white" : "ring-1 ring-black/15"}`}
                      style={{ backgroundColor: c.hex }}
                    />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-ink/50">Storage / Size</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {info.variants.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariant(v)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    variant === v ? "bg-apple text-white" : "bg-cloud text-ink/80 hover:bg-gray-200"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wider text-ink/50">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-ink transition hover:bg-ink hover:text-white"
                aria-label="Decrease quantity"
              >
                <MinusIcon width={16} height={16} />
              </button>
              <span className="w-6 text-center font-semibold">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(10, q + 1))}
                className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-ink transition hover:bg-ink hover:text-white"
                aria-label="Increase quantity"
              >
                <PlusIcon width={16} height={16} />
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button type="button" onClick={confirm} className="btn-apple flex-1">
              <BagIcon width={18} height={18} />
              Add to Cart
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-ink/50">
            Price shown is indicative — final price confirmed on WhatsApp.
          </p>
        </div>
      </div>
    </div>
  );
}
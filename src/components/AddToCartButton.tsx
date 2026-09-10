"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/products";
import { BagIcon, CheckIcon } from "@/lib/icons";
import SellModal from "@/components/SellModal";

export default function AddToCartButton({
  product,
  className = "btn-apple",
  label,
}: {
  product: Product;
  className?: string;
  label?: string;
}) {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);

  function handleAdded() {
    setAdded(true);
    window.setTimeout(() => setAdded(false), 3000);
  }

  const isPreOrder =
    product.badge?.toLowerCase().includes("pre-order") ||
    product.badge?.toLowerCase().includes("preorder");

  const isComingSoon =
    product.badge?.toLowerCase().includes("coming soon") ||
    product.price?.toLowerCase().includes("coming soon");

  const defaultText = isPreOrder ? "Pre-Order Now" : isComingSoon ? "Pre-Book" : (label || "Buy now");

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {added ? (
          <CheckIcon width={16} height={16} className="shrink-0" />
        ) : (
          <BagIcon width={16} height={16} className="shrink-0" />
        )}
        <span className="whitespace-nowrap truncate">
          {added ? `Added (${count})` : defaultText}
        </span>
      </button>

      {open ? (
        <SellModal product={product} onClose={() => setOpen(false)} onAdded={handleAdded} />
      ) : null}
    </>
  );
}
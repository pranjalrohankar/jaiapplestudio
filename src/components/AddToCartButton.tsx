"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { store, waLink } from "@/lib/store";
import type { Product } from "@/lib/products";
import { BagIcon, CheckIcon, WhatsAppIcon } from "@/lib/icons";
import SellModal from "@/components/SellModal";

export default function AddToCartButton({
  product,
  className = "btn-apple",
}: {
  product: Product;
  className?: string;
}) {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [added, setAdded] = useState(false);

  const isComingSoon =
    product.badge?.toLowerCase().includes("coming soon") ||
    product.price?.toLowerCase().includes("coming soon");

  if (isComingSoon) {
    const preBookMessage = `Hi ${store.name}! I would like to pre-book the new ${product.name} (Coming Soon). Please notify me as soon as stock arrives!`;
    return (
      <a
        href={waLink(preBookMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className={`btn-wa ${className}`}
      >
        <WhatsAppIcon width={18} height={18} />
        Pre-Book
      </a>
    );
  }

  function handleAdded() {
    setOpen(false);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {added ? <CheckIcon width={18} height={18} /> : <BagIcon width={18} height={18} />}
        {added ? `Added (${count})` : "Add to Cart"}
      </button>

      {open ? (
        <SellModal product={product} onClose={() => setOpen(false)} onAdded={handleAdded} />
      ) : null}
    </>
  );
}
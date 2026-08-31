"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/products";
import { BagIcon, CheckIcon } from "@/lib/icons";
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
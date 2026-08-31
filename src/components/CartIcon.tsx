"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { BagIcon } from "@/lib/icons";

export default function CartIcon() {
  const { count, hydrated } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={`Cart with ${count} items`}
      className="relative grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-cloud"
    >
      <BagIcon width={22} height={22} />
      {hydrated && count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-apple px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
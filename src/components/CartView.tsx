"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { formatINR } from "@/lib/currency";
import { nextOrderNumber, buildOrderMessage } from "@/lib/order";
import { waLink } from "@/lib/store";
import { MinusIcon, PlusIcon, TrashIcon, WhatsAppIcon, ChevronRightIcon } from "@/lib/icons";

export default function CartView() {
  const { items, subtotal, setQty, removeItem, clearCart } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [placed, setPlaced] = useState<string | null>(null);

  function placeOrder() {
    const orderNo = nextOrderNumber();
    const message = buildOrderMessage({ orderNo, items, subtotal, name, phone });
    window.open(waLink(message), "_blank", "noopener,noreferrer");
    setPlaced(`Order ${orderNo} is ready in WhatsApp — just press Send. Thank you!`);
    clearCart();
  }

  if (items.length === 0) {
    return (
      <section className="py-24 text-center">
        <div className="container-px">
          <p className="text-[12rem] font-semibold leading-none text-cloud">0</p>
          <h1 className="text-display-md">Your cart is empty.</h1>
          <p className="mx-auto mt-3 max-w-md text-ink/65">
            Browse the lineup and add a few devices — then check out on WhatsApp.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/iphone" className="btn-apple">
              Browse iPhones
            </Link>
            <Link href="/" className="btn-ghost">
              Go to home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16">
      <div className="container-px">
        <h1 className="text-display-md">Your cart.</h1>
        <p className="mt-3 max-w-lg text-ink/65">
          Review your items, then place the order — it opens in WhatsApp with your
          order number pre-filled.
        </p>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.lineKey}
                className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04] sm:p-5"
              >
                <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-cloud">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} width={64} height={64} className="object-contain" />
                  ) : (
                    <span className="text-sm font-semibold text-ink/50">
                      {item.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <Link href={`/product/${item.slug}`} className="font-semibold hover:text-apple">
                    {item.name}
                  </Link>
                  <p className="text-sm text-ink/60">
                    {[item.color, item.variant].filter(Boolean).join(" · ") || item.priceLabel}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQty(item.lineKey, item.qty - 1)}
                    className="grid h-8 w-8 place-items-center rounded-full bg-cloud text-ink transition hover:bg-ink hover:text-white"
                    aria-label={`Decrease ${item.name}`}
                  >
                    <MinusIcon width={14} height={14} />
                  </button>
                  <span className="w-8 text-center font-semibold">{item.qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(item.lineKey, item.qty + 1)}
                    className="grid h-8 w-8 place-items-center rounded-full bg-cloud text-ink transition hover:bg-ink hover:text-white"
                    aria-label={`Increase ${item.name}`}
                  >
                    <PlusIcon width={14} height={14} />
                  </button>
                </div>

                <div className="flex w-28 items-center justify-end gap-3 sm:w-32">
                  <span className="font-semibold">{formatINR(item.price * item.qty)}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.lineKey)}
                    className="text-ink/40 transition hover:text-red-500"
                    aria-label={`Remove ${item.name}`}
                  >
                    <TrashIcon width={18} height={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-cloud p-6 sm:p-7">
            <h2 className="text-lg font-semibold tracking-tight">Order summary</h2>

            <div className="mt-5 space-y-2 border-b border-black/10 pb-5 text-sm text-ink/70">
              {items.map((i) => (
                <div key={i.lineKey} className="flex justify-between">
                  <span>
                    {i.name}
                    {[i.color, i.variant].filter(Boolean).length > 0
                      ? ` (${[i.color, i.variant].filter(Boolean).join(", ")})`
                      : ""}{" "}
                    × {i.qty}
                  </span>
                  <span>{formatINR(i.price * i.qty)}</span>
                </div>
              ))}
            </div>

            <div className="flex items-baseline justify-between pt-4">
              <span className="font-semibold">Subtotal</span>
              <span className="text-2xl font-semibold">{formatINR(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs text-ink/50">
              Indicative total — final price, EMI and exchange are confirmed on WhatsApp.
            </p>

            <div className="mt-6 space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-apple"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your phone number"
                type="tel"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-apple"
              />
            </div>

            <button type="button" onClick={placeOrder} className="btn-wa mt-5 w-full">
              <WhatsAppIcon width={18} height={18} />
              Checkout on WhatsApp
            </button>
            <p className="mt-3 text-xs leading-relaxed text-ink/55">
              Your order number is generated automatically (<span className="font-semibold">Date + count</span>) and
              included in the WhatsApp message.
            </p>

            {placed ? (
              <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700">
                {placed}
              </p>
            ) : null}
          </div>
        </div>

        <Link href="/" className="mt-10 inline-flex items-center gap-1 font-semibold text-apple hover:underline">
          Continue shopping <ChevronRightIcon width={16} height={16} />
        </Link>
      </div>
    </section>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { formatINR } from "@/lib/currency";
import { nextOrderNumber, buildOrderMessage, recordOrder, formatDate, type OrderRecord } from "@/lib/order";
import { waLink } from "@/lib/store";
import {
  MinusIcon,
  PlusIcon,
  TrashIcon,
  BagIcon,
  ChevronRightIcon,
  CloseIcon,
} from "@/lib/icons";

export default function CartView() {
  const { items, subtotal, setQty, removeItem, clearCart } = useCart();
  const { customer, loginCustomer } = useAuth();

  // Quick Login / Details Modal state
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [custName, setCustName] = useState(customer?.name || "");
  const [custPhone, setCustPhone] = useState(customer?.phone || "");
  const [custCity, setCustCity] = useState(customer?.city || "");
  const [custNote, setCustNote] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);

  function handleBuyNowClick() {
    if (!customer) {
      setShowLoginModal(true);
      return;
    }

    launchOrder(customer.name, customer.phone, customer.city, custNote);
  }

  function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!custName.trim()) {
      setModalError("Please enter your name.");
      return;
    }
    if (!custPhone.trim()) {
      setModalError("Please enter your mobile phone number.");
      return;
    }

    setModalError(null);
    const profile = {
      name: custName.trim(),
      phone: custPhone.trim(),
      city: custCity.trim() || undefined,
    };
    loginCustomer(profile);
    setShowLoginModal(false);

    launchOrder(profile.name, profile.phone, profile.city, custNote);
  }

  async function launchOrder(name: string, phone: string, city?: string, note?: string) {
    const orderNo = nextOrderNumber();
    const hasComingSoon = items.some((i) => i.price === 0);
    const totalDisplay =
      subtotal > 0
        ? `₹${subtotal.toLocaleString("en-IN")}${hasComingSoon ? " (+ Pre-orders)" : ""}`
        : "Coming Soon (Pre-Order)";

    const orderRecord: OrderRecord = {
      orderNo,
      date: formatDate(),
      createdAt: new Date().toISOString(),
      customerName: name,
      customerPhone: phone,
      customerCity: city || undefined,
      customerNote: note || undefined,
      items: items.map((i) => ({
        name: i.name,
        color: i.color,
        variant: i.variant,
        qty: i.qty,
        price: i.price,
        priceLabel: i.priceLabel,
        image: i.image,
      })),
      subtotal,
      totalDisplay,
      status: "New",
      adminNote: "",
    };

    // Save order record to live orders database / sheet
    try {
      await recordOrder(orderRecord);
    } catch (err) {
      console.warn("Failed to record order:", err);
    }

    const message = buildOrderMessage({
      orderNo,
      items,
      subtotal,
      name,
      phone,
      city,
      customerNote: note || undefined,
    });

    window.open(waLink(message), "_blank", "noopener,noreferrer");
  }

  if (items.length === 0) {
    return (
      <section className="py-24 text-center">
        <div className="container-px">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-3xl bg-cloud text-ink/40 mb-6">
            <BagIcon width={40} height={40} />
          </div>
          <h1 className="text-display-md text-ink">Your cart is empty.</h1>
          <p className="mx-auto mt-3 max-w-md text-ink/65">
            Explore the latest iPhones, Macs, iPads, Watches and AirPods — add items to cart and check out easily.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/iphone" className="btn-apple">
              Browse iPhones
            </Link>
            <Link href="/" className="btn-ghost">
              Go to Home
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const hasComingSoon = items.some((i) => i.price === 0);
  const totalCount = items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <section className="py-12 sm:py-16 bg-[#fbfbfd]">
      <div className="container-px max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-ink">
              Review Your Cart
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              {totalCount} {totalCount === 1 ? "item" : "items"} ready for order confirmation
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
            >
              Clear All
            </button>
            <Link href="/iphone" className="text-xs font-semibold text-apple hover:underline">
              + Add More Products
            </Link>
          </div>
        </div>

        {/* Main Grid: Products Cards & Order Summary */}
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-12">
          {/* Individual Product Cards Column */}
          <div className="space-y-4 lg:col-span-8">
            {items.map((item) => (
              <div
                key={item.lineKey}
                className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-3xl bg-white p-5 sm:p-6 shadow-sm border border-gray-200/80 transition hover:shadow-md"
              >
                {/* Product Thumbnail */}
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-2xl bg-[#f5f5f7] p-2 flex items-center justify-center">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={100}
                      height={100}
                      className="object-contain max-h-full max-w-full"
                    />
                  ) : (
                    <span className="text-lg font-bold text-ink/40">
                      {item.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/product/${item.slug}`}
                      className="text-lg sm:text-xl font-bold tracking-tight text-ink hover:text-apple transition"
                    >
                      {item.name}
                    </Link>
                  </div>

                  {/* Badges for selected Finish & Storage */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.color && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-semibold text-ink/80 ring-1 ring-black/5">
                        <span className="h-2 w-2 rounded-full bg-ink/70"></span>
                        {item.color}
                      </span>
                    )}
                    {item.variant && (
                      <span className="inline-flex items-center rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-semibold text-ink/80 ring-1 ring-black/5">
                        {item.variant}
                      </span>
                    )}
                  </div>

                  {/* Unit price */}
                  <p className="mt-2 text-xs text-ink/50">
                    Unit Price:{" "}
                    <span className="font-semibold text-ink/80">
                      {item.price > 0 ? formatINR(item.price) : item.priceLabel || "Coming Soon"}
                    </span>
                  </p>
                </div>

                {/* Quantity Controls & Line Total */}
                <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-black/5">
                  {/* Quantity */}
                  <div className="flex items-center gap-2 rounded-full bg-[#f5f5f7] p-1 ring-1 ring-black/5">
                    <button
                      type="button"
                      onClick={() => setQty(item.lineKey, item.qty - 1)}
                      className="grid h-7 w-7 place-items-center rounded-full bg-white text-ink shadow-sm transition hover:bg-ink hover:text-white"
                      aria-label={`Decrease ${item.name}`}
                    >
                      <MinusIcon width={12} height={12} />
                    </button>
                    <span className="w-7 text-center text-xs font-bold text-ink">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(item.lineKey, item.qty + 1)}
                      className="grid h-7 w-7 place-items-center rounded-full bg-white text-ink shadow-sm transition hover:bg-ink hover:text-white"
                      aria-label={`Increase ${item.name}`}
                    >
                      <PlusIcon width={12} height={12} />
                    </button>
                  </div>

                  {/* Total Amount for this item */}
                  <div className="text-right min-w-[95px]">
                    <p className="text-base sm:text-lg font-bold text-ink">
                      {item.price > 0 ? formatINR(item.price * item.qty) : "Pre-Order"}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeItem(item.lineKey)}
                    className="p-1.5 text-ink/40 transition hover:text-red-600 rounded-lg hover:bg-red-50"
                    aria-label={`Remove ${item.name}`}
                    title="Remove item"
                  >
                    <TrashIcon width={18} height={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary & Buy Now Column */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-3xl bg-white p-6 sm:p-7 shadow-sm border border-gray-200/80">
              <h2 className="text-xl font-bold tracking-tight text-ink">Order Summary</h2>

              {/* Items Breakdown */}
              <div className="mt-5 space-y-2.5 border-b border-black/10 pb-5 text-sm text-ink/75">
                {items.map((i) => (
                  <div key={i.lineKey} className="flex justify-between items-start text-xs">
                    <span className="truncate pr-2">
                      {i.name} {i.variant ? `(${i.variant})` : ""} × {i.qty}
                    </span>
                    <span className="font-semibold shrink-0 text-ink">
                      {i.price > 0 ? formatINR(i.price * i.qty) : "Coming Soon"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Subtotal */}
              <div className="flex items-baseline justify-between pt-4">
                <span className="text-sm font-semibold text-ink/70">Estimated Total</span>
                <span className="text-2xl font-extrabold text-ink">
                  {subtotal > 0 ? formatINR(subtotal) : "TBD"}
                  {hasComingSoon && subtotal > 0 && (
                    <span className="text-xs text-ink/50 block text-right font-normal">
                      + Pre-Orders
                    </span>
                  )}
                </span>
              </div>

              <p className="mt-1.5 text-[11px] text-ink/50 leading-relaxed">
                *Official indicative price. Best discount, No-Cost EMI tenure, and exchange bonus are confirmed on order call.
              </p>

              {/* Customer Account Indicator */}
              <div className="mt-6 rounded-2xl bg-[#f5f5f7] p-3.5 ring-1 ring-black/5">
                {customer ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50">
                        Customer Profile
                      </p>
                      <p className="text-xs font-bold text-ink mt-0.5">
                        {customer.name} ({customer.phone})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLoginModal(true)}
                      className="text-xs font-semibold text-apple hover:underline"
                    >
                      Edit Details
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-ink">Guest Checkout</p>
                      <p className="text-[11px] text-ink/60">Details saved on Buy Now</p>
                    </div>
                    <Link href="/login?redirect=/cart" className="text-xs font-semibold text-apple hover:underline">
                      Login &rarr;
                    </Link>
                  </div>
                )}
              </div>

              {/* BUY NOW BUTTON */}
              <button
                type="button"
                onClick={handleBuyNowClick}
                className="w-full mt-5 flex items-center justify-center gap-2 rounded-full bg-ink py-4 text-base font-bold text-white shadow-xl shadow-black/10 transition hover:bg-zinc-800 active:scale-[0.99]"
              >
                <BagIcon width={18} height={18} />
                Buy Now
              </button>

              <p className="mt-3 text-center text-xs text-ink/50">
                100% Genuine Apple Warranty & Support from Jai Apple Store.
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-semibold text-apple hover:underline text-sm"
          >
            Continue shopping <ChevronRightIcon width={16} height={16} />
          </Link>
        </div>
      </div>

      {/* Customer Details Modal (if not logged in or editing) */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-opacity animate-fadeIn"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="w-full max-w-md rounded-[2.5rem] bg-white p-6 sm:p-8 shadow-2xl ring-1 ring-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/10">
              <h3 className="text-xl font-bold text-ink">Enter Details to Buy</h3>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-cloud text-ink hover:bg-ink hover:text-white transition"
              >
                <CloseIcon width={16} height={16} />
              </button>
            </div>

            <p className="mt-3 text-xs text-ink/60">
              Please enter your contact details to complete your order.
            </p>

            {modalError && (
              <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/60 mb-1">
                  Full Name *
                </label>
                <input
                  required
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-black/15 bg-cloud/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-apple focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/60 mb-1">
                  Mobile Phone Number *
                </label>
                <input
                  required
                  type="tel"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl border border-black/15 bg-cloud/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-apple focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/60 mb-1">
                  City / Area (Optional)
                </label>
                <input
                  type="text"
                  value={custCity}
                  onChange={(e) => setCustCity(e.target.value)}
                  placeholder="e.g. Pimpri-Chinchwad, Pune"
                  className="w-full rounded-xl border border-black/15 bg-cloud/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-apple focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink/60 mb-1">
                  Order Note (Optional)
                </label>
                <textarea
                  value={custNote}
                  onChange={(e) => setCustNote(e.target.value)}
                  placeholder="e.g. Interested in No-Cost EMI / trade-in..."
                  rows={2}
                  className="w-full rounded-xl border border-black/15 bg-cloud/50 px-3.5 py-2 text-xs outline-none transition focus:border-apple focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-full bg-ink py-4 text-sm font-bold text-white shadow-xl shadow-black/10 transition hover:bg-zinc-800 active:scale-[0.99]"
              >
                <BagIcon width={16} height={16} />
                Proceed to Buy
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
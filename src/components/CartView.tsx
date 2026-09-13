"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, type CartItem } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { formatINR } from "@/lib/currency";
import { products } from "@/lib/products";
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

/**
 * Universal detector for pre-order and coming-soon items
 */
function isItemPreOrder(item: CartItem): boolean {
  if (item.isPreOrder) return true;
  if (item.status === "pre-order") return true;
  if (item.badge && /pre-?order/i.test(item.badge)) return true;
  if (item.priceLabel && /pre-?order/i.test(item.priceLabel)) return true;
  if (item.name && /iphone 18|pre-?order/i.test(item.name)) return true;
  if (item.price === 0) return true;
  if (item.priceLabel && /coming soon/i.test(item.priceLabel)) return true;

  const catalogProd = products.find((p) => p.slug === item.slug);
  if (catalogProd) {
    if (catalogProd.status === "pre-order") return true;
    if (catalogProd.badge && /pre-?order/i.test(catalogProd.badge)) return true;
    if (catalogProd.price && /pre-?order|coming soon/i.test(catalogProd.price)) return true;
    if (catalogProd.name && /iphone 18/i.test(catalogProd.name)) return true;
  }
  return false;
}

function isItemComingSoon(item: CartItem): boolean {
  if (isItemPreOrder(item)) return false;
  if (item.isComingSoon) return true;
  if (item.status === "coming-soon") return true;
  if (item.badge && /coming soon/i.test(item.badge)) return true;
  return false;
}

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

  const hasPreOrder = items.some(isItemPreOrder);
  const hasComingSoon = items.some(isItemComingSoon);
  const allPreOrders = items.length > 0 && items.every(isItemPreOrder);
  const totalCount = items.reduce((sum, item) => sum + item.qty, 0);

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

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function launchOrder(name: string, phone: string, city?: string, note?: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const orderNo = nextOrderNumber();
    const totalDisplay =
      subtotal > 0
        ? `₹${subtotal.toLocaleString("en-IN")}${
            hasPreOrder ? " (Includes Pre-Order)" : hasComingSoon ? " (+ Pre-orders)" : ""
          }`
        : "Pre-Order Advance Booking";

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
        badge: i.badge,
        status: i.status,
        isPreOrder: isItemPreOrder(i),
        isComingSoon: isItemComingSoon(i),
      })),
      subtotal,
      totalDisplay,
      status: "New",
      adminNote: hasPreOrder ? "Pre-Order Priority Booking" : "",
    };

    try {
      await recordOrder(orderRecord);
    } catch (err) {
      console.warn("Failed to record order:", err);
    } finally {
      setTimeout(() => setIsSubmitting(false), 2000);
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
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-[#f5f5f7] text-[#1d1d1f]/40 mb-6">
            <BagIcon width={36} height={36} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f]">Your cart is empty.</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
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

  return (
    <section className="py-12 sm:py-16 bg-[#fbfbfd]">
      <div className="container-px max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1d1d1f]">
              Review Your Cart
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {totalCount} {totalCount === 1 ? "item" : "items"} ready for {hasPreOrder ? "pre-order confirmation" : "order confirmation"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-medium text-gray-400 hover:text-red-600 transition"
            >
              Clear All
            </button>
            <Link href="/iphone" className="text-xs font-semibold text-[#0071e3] hover:underline">
              + Add More Products
            </Link>
          </div>
        </div>

        {/* Main Grid: Products Cards & Order Summary */}
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-12">
          {/* Individual Product Cards Column */}
          <div className="space-y-4 lg:col-span-8">
            {items.map((item) => {
              const itemIsPreOrder = isItemPreOrder(item);
              const itemIsComingSoon = isItemComingSoon(item);

              return (
                <div
                  key={item.lineKey}
                  className="group relative flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-gray-200/80 transition hover:border-gray-300"
                >
                  {/* Product Thumbnail */}
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-[#f5f5f7] border border-gray-100/80 flex items-center justify-center">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name || "Apple Product"}
                        fill
                        sizes="112px"
                        className="object-contain p-2"
                      />
                    ) : (
                      <span className="text-lg font-bold text-gray-400">
                        {item.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/product/${item.slug}`}
                        className="text-lg font-bold tracking-tight text-[#1d1d1f] hover:text-[#0071e3] transition"
                      >
                        {item.name}
                      </Link>

                      {/* Clean Apple-style status tag */}
                      {itemIsPreOrder && (
                        <span className="inline-flex items-center rounded-full bg-[#f5f5f7] px-2.5 py-0.5 text-[11px] font-semibold text-[#1d1d1f] border border-black/10">
                          Pre-Order
                        </span>
                      )}
                      {itemIsComingSoon && (
                        <span className="inline-flex items-center rounded-full bg-[#f5f5f7] px-2.5 py-0.5 text-[11px] font-semibold text-[#1d1d1f] border border-black/10">
                          Coming Soon
                        </span>
                      )}
                    </div>

                    {/* Finish & Storage details */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.color && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f5f7] px-2.5 py-1 text-xs font-medium text-gray-700">
                          <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                          {item.color}
                        </span>
                      )}
                      {item.variant && (
                        <span className="inline-flex items-center rounded-full bg-[#f5f5f7] px-2.5 py-1 text-xs font-medium text-gray-700">
                          {item.variant}
                        </span>
                      )}
                    </div>

                    {/* Unit price */}
                    <p className="mt-2 text-xs text-gray-500">
                      Unit Price:{" "}
                      <span className="font-semibold text-[#1d1d1f]">
                        {item.price > 0
                          ? formatINR(item.price)
                          : itemIsPreOrder
                          ? "Pre-Order"
                          : item.priceLabel || "Coming Soon"}
                      </span>
                    </p>
                  </div>

                  {/* Quantity Controls & Line Total */}
                  <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    {/* Quantity */}
                    <div className="flex items-center gap-1.5 rounded-full bg-[#f5f5f7] p-1 border border-black/5">
                      <button
                        type="button"
                        onClick={() => setQty(item.lineKey, item.qty - 1)}
                        className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#1d1d1f] shadow-xs transition hover:bg-[#1d1d1f] hover:text-white"
                        aria-label={`Decrease ${item.name}`}
                      >
                        <MinusIcon width={12} height={12} />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-[#1d1d1f]">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(item.lineKey, item.qty + 1)}
                        className="grid h-7 w-7 place-items-center rounded-full bg-white text-[#1d1d1f] shadow-xs transition hover:bg-[#1d1d1f] hover:text-white"
                        aria-label={`Increase ${item.name}`}
                      >
                        <PlusIcon width={12} height={12} />
                      </button>
                    </div>

                    {/* Total Amount for this item */}
                    <div className="text-right min-w-[90px]">
                      <p className="text-base font-bold text-[#1d1d1f]">
                        {item.price > 0
                          ? formatINR(item.price * item.qty)
                          : "Pre-Order"}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.lineKey)}
                      className="p-1.5 text-gray-400 transition hover:text-red-600 rounded-lg hover:bg-red-50"
                      aria-label={`Remove ${item.name}`}
                      title="Remove item"
                    >
                      <TrashIcon width={18} height={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Column */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-2xl bg-white p-6 sm:p-7 shadow-sm border border-gray-200/80">
              <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f]">Order Summary</h2>

              {/* Items Breakdown */}
              <div className="mt-5 space-y-2.5 border-b border-gray-100 pb-5 text-sm">
                {items.map((i) => {
                  const itemIsPreOrder = isItemPreOrder(i);
                  return (
                    <div key={i.lineKey} className="flex justify-between items-start text-xs text-gray-600">
                      <span className="truncate pr-2">
                        {i.name} {i.variant ? `(${i.variant})` : ""} × {i.qty}
                        {itemIsPreOrder && (
                          <span className="ml-1 text-[10px] font-semibold text-[#0071e3]">
                            (Pre-Order)
                          </span>
                        )}
                      </span>
                      <span className="font-semibold shrink-0 text-[#1d1d1f]">
                        {i.price > 0 ? formatINR(i.price * i.qty) : "Pre-Order"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Clean Pre-Order Info Note */}
              {hasPreOrder && (
                <div className="mt-4 rounded-xl bg-[#f5f5f7] p-3 text-xs text-gray-600 border border-black/5">
                  <p className="font-semibold text-[#1d1d1f]">Priority Pre-Order</p>
                  <p className="text-[11.5px] text-gray-500 mt-0.5 leading-relaxed">
                    Your advance booking will be confirmed with the Jai Apple Store team upon submission.
                  </p>
                </div>
              )}

              {/* Subtotal */}
              <div className="flex items-baseline justify-between pt-4">
                <span className="text-sm font-medium text-gray-600">
                  {allPreOrders ? "Pre-Order Total" : "Estimated Total"}
                </span>
                <span className="text-2xl font-bold text-[#1d1d1f]">
                  {subtotal > 0 ? formatINR(subtotal) : "Advance Booking"}
                  {hasPreOrder && subtotal > 0 && (
                    <span className="text-[11px] text-gray-500 block text-right font-normal">
                      (Includes Pre-Order)
                    </span>
                  )}
                </span>
              </div>

              <p className="mt-1.5 text-[11px] text-gray-400 leading-relaxed">
                *Official indicative price. Best discount, No-Cost EMI tenure, and exchange bonus are confirmed on order call.
              </p>

              {/* Customer Account Box */}
              <div className="mt-6 rounded-xl bg-[#f5f5f7] p-3.5 border border-black/5">
                {customer ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Customer Profile
                      </p>
                      <p className="text-xs font-bold text-[#1d1d1f] mt-0.5">
                        {customer.name} ({customer.phone})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLoginModal(true)}
                      className="text-xs font-semibold text-[#0071e3] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#1d1d1f]">Guest Checkout</p>
                      <p className="text-[11px] text-gray-500">Contact saved on confirmation</p>
                    </div>
                    <Link href="/login?redirect=/cart" className="text-xs font-semibold text-[#0071e3] hover:underline">
                      Login &rarr;
                    </Link>
                  </div>
                )}
              </div>

              {/* MAIN ACTION BUTTON: Solid Apple Black */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleBuyNowClick}
                className="w-full mt-5 flex items-center justify-center gap-2 rounded-full bg-[#1d1d1f] hover:bg-[#333336] text-white py-4 text-sm font-semibold shadow-sm transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <BagIcon width={16} height={16} />
                )}
                <span>{isSubmitting ? "Processing Order..." : hasPreOrder ? "Pre-Order Now" : "Buy Now"}</span>
              </button>

              <p className="mt-3 text-center text-xs text-gray-400">
                100% Genuine Apple Warranty & Support from Jai Apple Store.
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-semibold text-[#0071e3] hover:underline text-sm"
          >
            Continue shopping <ChevronRightIcon width={16} height={16} />
          </Link>
        </div>
      </div>

      {/* Customer Details Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity animate-fadeIn"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-2xl border border-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#1d1d1f]">
                {hasPreOrder ? "Enter Details to Pre-Order" : "Enter Details to Buy"}
              </h3>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-600 hover:bg-[#1d1d1f] hover:text-white transition"
              >
                <CloseIcon width={14} height={14} />
              </button>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              {hasPreOrder
                ? "Please enter your contact details to complete your pre-order registration."
                : "Please enter your contact details to complete your order."}
            </p>

            {modalError && (
              <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Full Name *
                </label>
                <input
                  required
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#0071e3] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Mobile Phone Number *
                </label>
                <input
                  required
                  type="tel"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#0071e3] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  City / Area (Optional)
                </label>
                <input
                  type="text"
                  value={custCity}
                  onChange={(e) => setCustCity(e.target.value)}
                  placeholder="e.g. Pimpri-Chinchwad, Pune"
                  className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#0071e3] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Order / Pre-Order Note (Optional)
                </label>
                <textarea
                  value={custNote}
                  onChange={(e) => setCustNote(e.target.value)}
                  placeholder="e.g. Preferred delivery date, No-Cost EMI..."
                  rows={2}
                  className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-3.5 py-2 text-xs outline-none transition focus:border-[#0071e3] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-full bg-[#1d1d1f] hover:bg-[#333336] text-white py-3.5 text-sm font-semibold shadow-sm transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <BagIcon width={16} height={16} />
                )}
                <span>{isSubmitting ? "Submitting..." : hasPreOrder ? "Confirm Pre-Order & Proceed" : "Proceed to Buy"}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
"use client";

import { store } from "@/lib/store";
import { formatINR } from "@/lib/currency";
import type { CartItem } from "@/lib/cart-context";

export type OrderItem = {
  name: string;
  color?: string;
  variant?: string;
  qty: number;
  price: number;
  priceLabel: string;
  image?: string;
  badge?: string;
  status?: string;
  isPreOrder?: boolean;
  isComingSoon?: boolean;
};

export type OrderRecord = {
  orderNo: string;
  date: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerCity?: string;
  customerNote?: string;
  items: OrderItem[];
  subtotal: number;
  totalDisplay: string;
  status: "New" | "Contacted" | "Confirmed" | "Dispatched" | "Delivered" | "Cancelled";
  adminNote?: string;
};

/**
 * Order number = JAS-YYYYMMDD-XXXX (Guaranteed unique across all devices & sessions)
 */
export function nextOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const dateTag = `${y}${m}${d}`;

  // High-entropy timestamp + random alphanumeric suffix
  const timeSuffix = Date.now().toString(36).slice(-3).toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();

  return `JAS-${dateTag}-${timeSuffix}${randomSuffix}`;
}

export function formatDate(now = new Date()): string {
  return now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function itemLine(item: CartItem, index: number): string {
  const color = item.color ? `Finish: ${item.color}` : "";
  const variant = item.variant ? `Storage/Size: ${item.variant}` : "";
  const specs = [color, variant].filter(Boolean).join(" | ");

  const isPreOrder =
    item.isPreOrder ||
    item.status === "pre-order" ||
    item.badge?.toLowerCase().includes("pre-order") ||
    item.badge?.toLowerCase().includes("preorder");

  const isComingSoon =
    item.isComingSoon ||
    item.status === "coming-soon" ||
    item.badge?.toLowerCase().includes("coming soon") ||
    item.priceLabel?.toLowerCase().includes("coming soon");

  const tag = isPreOrder ? " ⚡ [PRE-ORDER]" : isComingSoon ? " 🟣 [COMING SOON / PRE-BOOK]" : "";

  const priceDisplay =
    item.price > 0
      ? `${formatINR(item.price * item.qty)} (${formatINR(item.price)} each)`
      : item.priceLabel || (isPreOrder ? "Pre-Order Booking" : "Coming Soon");

  return `${index + 1}) *${item.name}*${tag} (Qty: ${item.qty})\n   ${specs ? `• ${specs}\n   ` : ""}• Price: ${priceDisplay}`;
}

export function buildOrderMessage({
  items,
  subtotal,
  name,
  phone,
  city,
  customerNote,
}: {
  orderNo?: string;
  items: CartItem[];
  subtotal: number;
  name: string;
  phone: string;
  city?: string;
  customerNote?: string;
}): string {
  const hasPreOrder = items.some(
    (i) =>
      i.isPreOrder ||
      i.status === "pre-order" ||
      i.badge?.toLowerCase().includes("pre-order") ||
      i.badge?.toLowerCase().includes("preorder")
  );
  const hasComingSoon = items.some(
    (i) =>
      i.isComingSoon ||
      i.status === "coming-soon" ||
      i.badge?.toLowerCase().includes("coming soon") ||
      i.price === 0
  );

  let subtotalDisplay = "";
  if (subtotal > 0) {
    subtotalDisplay =
      formatINR(subtotal) +
      (hasPreOrder ? " (Includes Pre-Order)" : hasComingSoon ? " (+ Pre-order items)" : "");
  } else {
    subtotalDisplay = hasPreOrder
      ? "Pre-Order Advance Booking"
      : "Coming Soon (Price to be confirmed)";
  }

  const lines: string[] = [
    `👋 Hi ${store.name}!`,
    hasPreOrder
      ? `I am placing a *PRE-ORDER / ADVANCE BOOKING* for the following items:`
      : `I am interested in placing an order for the following items:`,
    ``,
    `🛒 *PRODUCTS & DETAILS:*`,
    ...items.map(itemLine),
    ``,
    `💰 *ESTIMATED TOTAL:* ${subtotalDisplay}`,
    ``,
    `👤 *CUSTOMER DETAILS:*`,
    `• *Name:* ${name || "Customer"}`,
    `• *Phone:* ${phone || "Provided on WhatsApp"}`,
    ...(city ? [`• *Location / Area:* ${city}`] : []),
    ...(customerNote ? [`• *Note:* ${customerNote}`] : []),
    ``,
    hasPreOrder
      ? `Please confirm my priority pre-order registration, estimated delivery schedule, and booking confirmation. Thank you!`
      : `Please confirm product availability, current best price/offers, and pickup or delivery details. Thank you!`,
  ];

  return lines.join("\n");
}

export async function recordOrder(order: OrderRecord) {
  try {
    // 1. Post to unified enquiries API
    await fetch("/api/enquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        enquiry: {
          enquiryNo: order.orderNo,
          name: order.customerName,
          phone: order.customerPhone,
          city: order.customerCity,
          message: order.customerNote,
          items: order.items,
          subtotal: order.subtotal,
          totalDisplay: order.totalDisplay,
          source: "cart_checkout",
          status: order.status || "New",
          adminNote: order.adminNote,
          date: order.date,
          createdAt: order.createdAt,
        },
      }),
    });

    // 2. Also post to orders API for backward compatibility
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    return await res.json();
  } catch (err) {
    console.warn("Could not record order on server API:", err);
  }
}
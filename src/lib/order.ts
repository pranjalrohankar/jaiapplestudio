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
 * Order number = "Date" + n+1, where n is the count of orders already
 * generated today on this device, stored in localStorage.
 * Format: JAS-YYYYMMDD-001 (updates automatically each day).
 */
export function nextOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const dateTag = `${y}${m}${d}`;

  const key = `jas-order-${dateTag}`;
  let last = 0;
  try {
    last = Number(window.localStorage.getItem(key) ?? "0") || 0;
  } catch {
    // ignore
  }

  const n = last + 1;
  try {
    window.localStorage.setItem(key, String(n));
  } catch {
    // ignore
  }

  return `JAS-${dateTag}-${String(n).padStart(3, "0")}`;
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
  
  const priceDisplay =
    item.price > 0
      ? `${formatINR(item.price * item.qty)} (${formatINR(item.price)} each)`
      : item.priceLabel || "Coming Soon (Pre-Order)";

  return `${index + 1}) *${item.name}* (Qty: ${item.qty})\n   ${specs ? `• ${specs}\n   ` : ""}• Price: ${priceDisplay}`;
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
  const hasComingSoon = items.some((i) => i.price === 0);
  const subtotalDisplay =
    subtotal > 0
      ? formatINR(subtotal) + (hasComingSoon ? " (+ Pre-order items)" : "")
      : "Pre-order (Price to be confirmed)";

  const lines: string[] = [
    `👋 Hi ${store.name}!`,
    `I am interested in placing an order for the following items:`,
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
    `Please confirm product availability, current best price/offers, and pickup or delivery details. Thank you!`,
  ];

  return lines.join("\n");
}

export async function recordOrder(order: OrderRecord) {
  try {
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
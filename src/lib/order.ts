"use client";

import { store } from "@/lib/store";
import { formatINR } from "@/lib/currency";
import type { CartItem } from "@/lib/cart-context";

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

/**
 * One line per cart item with the three columns the customer asked for:
 * Product name | Colour | Storage/Size
 */
function itemLine(item: CartItem, index: number): string {
  const color = item.color || "-";
  const variant = item.variant || "-";
  return `${index + 1}) ${item.name}  |  ${color}  |  ${variant}  |  x${item.qty}  =  ${formatINR(
    item.price * item.qty,
  )}`;
}

export function buildOrderMessage({
  orderNo,
  items,
  subtotal,
  name,
  phone,
}: {
  orderNo: string;
  items: CartItem[];
  subtotal: number;
  name: string;
  phone: string;
}): string {
  const lines: string[] = [
    `NEW ORDER - ${store.name}`,
    `Order No: ${orderNo}`,
    `Date: ${formatDate()}`,
    "",
    `ITEMS (Name | Colour | Storage | Qty | Amount)`,
    ...items.map(itemLine),
    "",
    `Subtotal: ${formatINR(subtotal)}`,
    "Prices are indicative - final price, EMI and exchange confirmed on confirmation call.",
    "",
    `Name: ${name || "-"}`,
    `Phone: ${phone || "-"}`,
    "",
    "Please confirm my order.",
  ];
  return lines.join("\n");
}
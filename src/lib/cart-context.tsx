"use client";

import { useSyncExternalStore } from "react";
import type { Product } from "@/lib/products";
import { priceValue } from "@/lib/currency";

export type CartItem = {
  lineKey: string;
  slug: string;
  name: string;
  color?: string;
  variant?: string;
  price: number;
  priceLabel: string;
  image?: string;
  qty: number;
};

export type AddOptions = {
  color?: string;
  variant?: string;
  priceLabel?: string;
};

export type CartState = {
  items: CartItem[];
  count: number;
  subtotal: number;
  hydrated: boolean;
};

const STORAGE_KEY = "jas-cart";

let items: CartItem[] = [];
let hydrated = false;

const initialSnapshot: CartState = { items, count: 0, subtotal: 0, hydrated };
let snapshot = initialSnapshot;
const listeners = new Set<() => void>();

function emit() {
  const count = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  snapshot = { items, count, subtotal, hydrated };
  for (const listener of listeners) listener();
}

function load() {
  if (hydrated || typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) items = JSON.parse(raw) as CartItem[];
  } catch {
    // ignore corrupt storage
  }
  hydrated = true;
  emit();
}

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage full / unavailable
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  load();
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): CartState {
  return snapshot;
}

function getServerSnapshot(): CartState {
  return initialSnapshot;
}

function commit() {
  persist();
  emit();
}

function lineKeyFor(product: Product, options?: AddOptions): string {
  return `${product.slug}__${options?.color ?? ""}__${options?.variant ?? ""}`;
}

function addItem(product: Product, qty = 1, options?: AddOptions) {
  const lineKey = lineKeyFor(product, options);
  const label = options?.priceLabel ?? product.price;

  const found = items.find((i) => i.lineKey === lineKey);
  if (found) {
    items = items.map((i) => (i.lineKey === lineKey ? { ...i, qty: i.qty + qty } : i));
  } else {
    items = [
      ...items,
      {
        lineKey,
        slug: product.slug,
        name: product.name,
        color: options?.color,
        variant: options?.variant,
        price: priceValue(label),
        priceLabel: label,
        image: product.image,
        qty,
      },
    ];
  }
  commit();
}

function removeItem(lineKey: string) {
  items = items.filter((i) => i.lineKey !== lineKey);
  commit();
}

function setQty(lineKey: string, qty: number) {
  if (qty <= 0) {
    removeItem(lineKey);
    return;
  }
  items = items.map((i) => (i.lineKey === lineKey ? { ...i, qty } : i));
  commit();
}

function clearCart() {
  items = [];
  commit();
}

export function useCart(): CartState & {
  addItem: typeof addItem;
  removeItem: typeof removeItem;
  setQty: typeof setQty;
  clearCart: typeof clearCart;
} {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { ...state, addItem, removeItem, setQty, clearCart };
}
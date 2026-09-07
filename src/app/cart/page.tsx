import type { Metadata } from "next";
import CartView from "@/components/CartView";

export const metadata: Metadata = {
  title: "Your Shopping Bag & Checkout",
  description:
    "Review your cart, select your products and accessories, and proceed to buy with official 1-year Apple India warranty from Jai Apple Store.",
};

export default function CartPage() {
  return <CartView />;
}
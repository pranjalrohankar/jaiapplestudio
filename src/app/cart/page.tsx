import type { Metadata } from "next";
import CartView from "@/components/CartView";

export const metadata: Metadata = {
  title: "Your Cart & WhatsApp Checkout",
  description:
    "Review your cart and place the order on WhatsApp with an auto-generated order number. Prices are indicative — final price confirmed by Jai Apple Store.",
};

export default function CartPage() {
  return <CartView />;
}
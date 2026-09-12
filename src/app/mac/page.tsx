import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Mac — Supercharged by Apple Silicon",
  description:
    "MacBook Air, MacBook Pro, Mac mini, iMac in stock at Jai Apple Store, Pimpri-Chinchwad. Student discounts and GST invoices available.",
};

export default function MacPage() {
  return <CategoryView slug="mac" />;
}
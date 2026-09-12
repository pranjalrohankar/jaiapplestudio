import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Apple Watch — The Ultimate Device for Healthy Life",
  description:
    "Apple Watch Series 10, Ultra 2, SE in stock at Jai Apple Store, Pimpri-Chinchwad. Best prices and original bands.",
};

export default function WatchPage() {
  return <CategoryView slug="watch" />;
}
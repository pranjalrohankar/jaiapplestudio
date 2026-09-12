import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "iPhone — Every Model, Every Colour",
  description:
    "Buy genuine iPhone at Jai Apple Store, Pimpri-Chinchwad. All models in stock with No-Cost EMI, exchange offers and 1-year warranty.",
};

export default function IphonePage() {
  return <CategoryView slug="iphone" />;
}
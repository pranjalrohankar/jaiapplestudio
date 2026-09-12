import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Apple Accessories — Power Adapters, Cases, Cables",
  description:
    "MagSafe chargers, USB-C cables, 20W/30W adapters, iPhone cases, Apple Pencil, and Magic accessories at Jai Apple Store.",
};

export default function AccessoriesPage() {
  return <CategoryView slug="accessories" />;
}
import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";

export const metadata: Metadata = {
  title: "Accessories — Cases, Chargers, AirTag & more",
  description:
    "Buy genuine Apple accessories at Jai Apple Store, Pimpri-Chinchwad. MagSafe, adapters, cases, cables and AirTag.",
};

export default function AccessoriesPage() {
  return <CategoryView slug="accessories" />;
}
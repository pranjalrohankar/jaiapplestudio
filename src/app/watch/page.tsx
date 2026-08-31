import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";

export const metadata: Metadata = {
  title: "Apple Watch — Ultra, Series & SE",
  description:
    "Buy genuine Apple Watch at Jai Apple Store, Pimpri-Chinchwad. Apple Watch Ultra, Series and SE with full warranty and EMI options.",
};

export default function WatchPage() {
  return <CategoryView slug="watch" />;
}
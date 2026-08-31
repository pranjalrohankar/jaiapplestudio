import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";

export const metadata: Metadata = {
  title: "AirPods — Pro, AirPods 4 & Max",
  description:
    "Buy genuine AirPods at Jai Apple Store, Pimpri-Chinchwad. AirPods Pro, AirPods 4 and AirPods Max with warranty and EMI options.",
};

export default function AirpodsPage() {
  return <CategoryView slug="airpods" />;
}
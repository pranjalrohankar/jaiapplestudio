import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "AirPods — Magic Like You've Never Heard",
  description:
    "AirPods Pro 2, AirPods 4, AirPods Max with Active Noise Cancellation at Jai Apple Store, Pimpri-Chinchwad.",
};

export default function AirpodsPage() {
  return <CategoryView slug="airpods" />;
}
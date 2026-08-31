import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";

export const metadata: Metadata = {
  title: "Mac — MacBook Air, Pro, iMac & Mini",
  description:
    "Buy genuine Mac at Jai Apple Store, Pimpri-Chinchwad. MacBook Air, MacBook Pro, iMac and Mac Mini with EMI options and full warranty.",
};

export default function MacPage() {
  return <CategoryView slug="mac" />;
}
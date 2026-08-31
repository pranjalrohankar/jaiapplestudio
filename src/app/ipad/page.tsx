import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";

export const metadata: Metadata = {
  title: "iPad — Pro, Air, iPad & mini",
  description:
    "Buy genuine iPad at Jai Apple Store, Pimpri-Chinchwad. iPad Pro, iPad Air, iPad and iPad mini with EMI and exchange offers.",
};

export default function IpadPage() {
  return <CategoryView slug="ipad" />;
}
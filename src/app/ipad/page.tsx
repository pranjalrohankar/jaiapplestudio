import type { Metadata } from "next";
import CategoryView from "@/components/CategoryView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "iPad — Touch, Draw, Type, Work",
  description:
    "iPad Pro, iPad Air, iPad 10th Gen, iPad mini at Jai Apple Store, Pimpri-Chinchwad. Apple Pencil and Magic Keyboard in stock.",
};

export default function IpadPage() {
  return <CategoryView slug="ipad" />;
}
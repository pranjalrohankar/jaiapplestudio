"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { products as defaultProducts, type Product } from "@/lib/products";

const filterTabs = [
  { label: "Trending Now", category: "all" },
  { label: "iPhones", category: "iphone" },
  { label: "MacBooks", category: "mac" },
  { label: "iPads", category: "ipad" },
  { label: "Apple Watches", category: "watch" },
  { label: "AirPods & Audio", category: "airpods" },
];

export default function Lineup() {
  const [activeTab, setActiveTab] = useState("all");
  const [productList, setProductList] = useState<Product[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = window.localStorage.getItem("jas-live-products");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return defaultProducts;
  });

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch(`/api/products?t=${Date.now()}`, {
          cache: "no-store",
          headers: { Pragma: "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.products) && data.products.length > 0) {
            setProductList(data.products);
            try {
              if (typeof window !== "undefined") {
                window.localStorage.setItem("jas-live-products", JSON.stringify(data.products));
              }
            } catch {}
          }
        }
      } catch {
        // Fallback to defaultProducts
      }
    }

    loadProducts();

    const handleUpdate = () => {
      loadProducts();
    };

    window.addEventListener("jas-data-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("jas-data-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const filteredProducts: Product[] =
    activeTab === "all"
      ? productList.slice(0, 8)
      : productList.filter((p) => p.category === activeTab).slice(0, 8);

  return (
    <section id="trending-products" className="py-16 sm:py-24 bg-white">
      <div className="container-xl">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111111]">
                Trending Now
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Discover the latest Apple devices with best cashback offers and instant delivery
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {filterTabs.map((tab) => (
                <button
                  key={tab.category}
                  type="button"
                  onClick={() => setActiveTab(tab.category)}
                  className={`rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.category
                      ? "bg-[#111111] text-white shadow-sm"
                      : "bg-[#f8f8fa] text-gray-600 hover:bg-gray-200/80 hover:text-black"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Product Cards Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((p, i) => (
            <Reveal key={p!.slug} delay={(i % 4) * 50}>
              <ProductCard product={p!} />
            </Reveal>
          ))}
        </div>

        {/* View All Products Action */}
        <Reveal className="mt-12 text-center">
          <Link
            href={activeTab === "all" ? "/iphone" : `/${activeTab}`}
            className="btn-dark px-8 py-3.5"
          >
            View all {activeTab === "all" ? "Products" : filterTabs.find((t) => t.category === activeTab)?.label}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
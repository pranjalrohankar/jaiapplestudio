"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { defaultCategoryTiles, type CategoryTile } from "@/lib/categories";

export default function CategoryTiles() {
  const [categories, setCategories] = useState<CategoryTile[]>(defaultCategoryTiles);

  useEffect(() => {
    // Check local cache on mount safely after hydration
    try {
      if (typeof window !== "undefined") {
        const cached = window.localStorage.getItem("jas-live-categories");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCategories(parsed);
          }
        }
      }
    } catch {}

    async function fetchCategories() {
      try {
        const res = await fetch(`/api/categories?t=${Date.now()}`, {
          cache: "no-store",
          headers: { Pragma: "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            const activeOnly = data.categories.filter((c: CategoryTile) => c.isActive !== false);
            if (activeOnly.length > 0) {
              setCategories(activeOnly);
              try {
                if (typeof window !== "undefined") {
                  window.localStorage.setItem("jas-live-categories", JSON.stringify(activeOnly));
                }
              } catch {}
            }
          }
        }
      } catch (err) {
        // Fallback to defaultCategoryTiles
      }
    }
    fetchCategories();

    const handleUpdate = () => {
      fetchCategories();
    };

    window.addEventListener("jas-data-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("jas-data-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return (
    <section className="bg-[#f8f8fa] py-12 sm:py-16 border-y border-gray-200/80">
      <div className="container-xl">
        <Reveal>
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
              Explore by Category
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-500">
              Find the perfect Apple device and accessories with genuine warranty
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((c, i) => (
            <Reveal key={c.id || c.slug || i} delay={i * 40}>
              <Link
                href={c.link || `/${c.slug}`}
                className="group flex flex-col items-center justify-between rounded-2xl bg-white p-4 sm:p-5 border border-[#e6e6e6] text-center transition-all duration-300 hover:shadow-md hover:border-[#0071e3]/40 hover:-translate-y-1 h-full"
              >
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 my-2 flex items-center justify-center overflow-hidden">
                  <Image
                    src={c.image}
                    alt={c.name || "Apple Category"}
                    fill
                    sizes="120px"
                    className={`p-1.5 transition-transform duration-300 group-hover:scale-110 ${
                      c.imageFit === "cover" ? "object-cover object-center" : "object-contain object-center"
                    }`}
                  />
                </div>
                <div className="mt-2">
                  <h3 className="text-sm sm:text-base font-bold text-[#111111] group-hover:text-[#0071e3] transition">
                    {c.name}
                  </h3>
                  {c.subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{c.subtitle}</p>}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { type OfferBanner, defaultOfferBanners } from "@/lib/banners";
import { ChevronRightIcon } from "@/lib/icons";

export default function OfferBanners() {
  const [banners, setBanners] = useState<OfferBanner[]>([]);

  useEffect(() => {
    // Check cached banners on mount safely after hydration
    try {
      if (typeof window !== "undefined") {
        const cached = window.localStorage.getItem("jas-live-banners");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBanners(parsed);
          }
        }
      }
    } catch {}

    async function fetchLiveBanners() {
      try {
        const res = await fetch(`/api/banners?t=${Date.now()}`, {
          cache: "no-store",
          headers: { Pragma: "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.banners)) {
            const activeOnly = data.banners.filter((b: OfferBanner) => b.isActive !== false);
            setBanners(activeOnly);
            try {
              if (typeof window !== "undefined") {
                if (activeOnly.length > 0) {
                  window.localStorage.setItem("jas-live-banners", JSON.stringify(activeOnly));
                } else {
                  window.localStorage.removeItem("jas-live-banners");
                }
              }
            } catch {}
          }
        }
      } catch (err) {
        // Fallback
      }
    }

    fetchLiveBanners();

    const handleUpdate = () => {
      fetchLiveBanners();
    };

    window.addEventListener("jas-data-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("jas-data-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  if (!banners || banners.length === 0) return null;

  const fullBanners = banners.filter((b) => b.layout === "full" || !b.layout);
  const halfBanners = banners.filter((b) => b.layout === "half");

  return (
    <section className="bg-[#f5f5f7] py-12 sm:py-16 border-b border-gray-200/80">
      <div className="container-xl space-y-8">
        {/* Full-width Offer Graphic Posters */}
        {fullBanners.map((banner) => (
          <Reveal key={banner.id}>
            <div className="group relative overflow-hidden rounded-3xl bg-black shadow-lg transition-all duration-500 hover:shadow-2xl">
              <Link href={banner.link || "/"} className="block relative w-full aspect-[16/9] sm:aspect-[21/9] min-h-[260px] sm:min-h-[380px]">
                <Image
                  src={banner.image}
                  alt={banner.title?.trim() || "Promotional Offer Banner"}
                  fill
                  sizes="(max-width: 1280px) 100vw, 1200px"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.01]"
                />

                {/* Banner Overlay Details */}
                {(banner.badge || banner.title || banner.subtitle || banner.priceTag) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
                    <div className="max-w-2xl">
                      {banner.badge && (
                        <span className="inline-block bg-[#0071e3] text-white px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2.5 shadow-md">
                          {banner.badge}
                        </span>
                      )}
                      {banner.title && (
                        <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
                          {banner.title}
                        </h3>
                      )}
                      {banner.subtitle && (
                        <p className="text-xs sm:text-base text-gray-200 mt-1.5 line-clamp-2 drop-shadow">
                          {banner.subtitle}
                        </p>
                      )}
                      {banner.priceTag && (
                        <p className="text-xs sm:text-sm font-bold text-amber-400 mt-2 drop-shadow">
                          {banner.priceTag}
                        </p>
                      )}
                      {banner.ctaText && (
                        <div className="mt-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-5 py-2 text-xs sm:text-sm font-bold text-white shadow-lg transition group-hover:bg-[#0066cd]">
                            {banner.ctaText}
                            <ChevronRightIcon width={14} height={14} />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            </div>
          </Reveal>
        ))}

        {/* 2-Column Half Promotional Banners */}
        {halfBanners.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {halfBanners.map((banner) => (
              <Reveal key={banner.id}>
                <div className="group relative overflow-hidden rounded-3xl bg-white border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-gray-300 flex flex-col h-full">
                  <Link href={banner.link || "/"} className="block relative w-full aspect-[16/10] overflow-hidden bg-gray-950">
                    <Image
                      src={banner.image}
                      alt={banner.title?.trim() || "Promotional Card"}
                      fill
                      sizes="(max-width: 768px) 100vw, 600px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {banner.badge && (
                      <span className="absolute top-4 left-4 bg-black/80 text-white backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                        {banner.badge}
                      </span>
                    )}
                  </Link>

                  <div className="p-6 flex flex-col flex-1 justify-between bg-white">
                    <div>
                      {banner.title && (
                        <h4 className="text-lg sm:text-xl font-extrabold text-gray-900 group-hover:text-[#0071e3] transition">
                          {banner.title}
                        </h4>
                      )}
                      {banner.subtitle && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed">
                          {banner.subtitle}
                        </p>
                      )}
                      {banner.priceTag && (
                        <p className="text-xs font-bold text-emerald-600 mt-2">
                          {banner.priceTag}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0071e3] group-hover:underline inline-flex items-center gap-1">
                        {banner.ctaText || "View Deal"} &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

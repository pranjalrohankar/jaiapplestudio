"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { defaultBanner, type BannerConfig } from "@/lib/banners";
import { WhatsAppIcon, ChevronRightIcon, CheckIcon } from "@/lib/icons";

export default function LaunchBanner() {
  const [banner, setBanner] = useState<BannerConfig>(defaultBanner);

  useEffect(() => {
    async function loadBanner() {
      try {
        const res = await fetch("/api/banners");
        if (res.ok) {
          const data = await res.json();
          if (data.banner) {
            setBanner(data.banner);
          }
        }
      } catch (err) {
        console.warn("Using fallback banner:", err);
      }
    }
    loadBanner();
  }, []);

  if (!banner.isActive) {
    return null;
  }

  const isDarkAurora = banner.theme === "dark-aurora" || !banner.theme;
  const isMidnightNeon = banner.theme === "midnight-neon";
  const isCosmicTitanium = banner.theme === "cosmic-titanium";

  return (
    <section className="relative overflow-hidden py-10 sm:py-16">
      <div className="container-px">
        <div
          className={`relative overflow-hidden rounded-[2.5rem] p-8 text-white sm:p-12 lg:p-16 ${
            isMidnightNeon
              ? "bg-gradient-to-br from-[#050b14] via-[#091b2c] to-[#030712] ring-1 ring-cyan-500/20"
              : isCosmicTitanium
              ? "bg-gradient-to-br from-[#121316] via-[#1a1c22] to-[#0d0e11] ring-1 ring-amber-500/20"
              : "bg-gradient-to-br from-[#0c0d12] via-[#131520] to-[#07080b] ring-1 ring-white/10"
          } shadow-2xl`}
        >
          {/* Ambient Lighting / Glow Backgrounds */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-500/20 blur-[120px]" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-purple-500/20 blur-[130px]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-72 w-72 rounded-full bg-emerald-500/10 blur-[100px]" />

          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Content Column */}
            <div className="flex flex-col items-start lg:col-span-7">
              {/* Glowing Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-1.5 text-xs font-semibold tracking-wider text-white backdrop-blur-md ring-1 ring-white/15">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="uppercase text-emerald-300 font-bold">{banner.badge || "LATEST LAUNCH • COMING SOON"}</span>
              </div>

              {/* Title & Tagline */}
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                {banner.title}
              </h2>

              <p className="mt-3 text-lg font-medium text-cyan-300 sm:text-xl">
                {banner.tagline}
              </p>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
                {banner.description}
              </p>

              {/* Feature Highlights Pill Tags */}
              <div className="mt-6 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm ring-1 ring-white/10">
                  <CheckIcon width={14} height={14} className="text-emerald-400" />
                  Priority Pre-Booking Open
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm ring-1 ring-white/10">
                  <CheckIcon width={14} height={14} className="text-blue-400" />
                  Official 1-Year Apple Warranty
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm ring-1 ring-white/10">
                  <CheckIcon width={14} height={14} className="text-purple-400" />
                  Best Exchange Value in Pune
                </span>
              </div>

              {/* Call to Actions */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href={banner.ctaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-950/40 transition hover:brightness-110 active:scale-95"
                >
                  <WhatsAppIcon width={20} height={20} className="transition group-hover:scale-110" />
                  {banner.ctaText}
                </a>

                {banner.secondaryCtaLink && banner.secondaryCtaText ? (
                  <Link
                    href={banner.secondaryCtaLink}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-md ring-1 ring-white/20 transition hover:bg-white/20"
                  >
                    {banner.secondaryCtaText}
                    <ChevronRightIcon width={16} height={16} />
                  </Link>
                ) : null}
              </div>

              <p className="mt-4 text-xs text-white/50">
                *Pre-bookings receive guaranteed earliest delivery on launch day at Jay Plaza, Pimpri.
              </p>
            </div>

            {/* Right Image Column */}
            <div className="relative flex justify-center lg:col-span-5">
              <div className="relative aspect-[16/10] w-full max-w-lg lg:aspect-[4/3]">
                {/* Glow ring under image */}
                <div className="absolute inset-0 -m-4 rounded-3xl bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-emerald-500/20 blur-2xl" />
                <Image
                  src={banner.image || "/images/iphone-18-hero-banner.jpg"}
                  alt={banner.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 500px"
                  className="relative z-10 rounded-2xl object-cover object-center transition duration-500 hover:scale-[1.02]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

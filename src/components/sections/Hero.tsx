"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRightIcon } from "@/lib/icons";
import { defaultSliderSlides, type SliderSlide } from "@/lib/slider";

export default function Hero() {
  const [slides, setSlides] = useState<SliderSlide[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = window.localStorage.getItem("jas-live-slider");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return defaultSliderSlides;
  });
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    async function fetchLiveSlides() {
      try {
        const res = await fetch(`/api/slider?t=${Date.now()}`, {
          cache: "no-store",
          headers: { Pragma: "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.slides) && data.slides.length > 0) {
            const activeOnly = data.slides.filter((s: SliderSlide) => s.isActive !== false);
            if (activeOnly.length > 0) {
              setSlides(activeOnly);
              try {
                if (typeof window !== "undefined") {
                  window.localStorage.setItem("jas-live-slider", JSON.stringify(activeOnly));
                }
              } catch {}
            }
          }
        }
      } catch (err) {
        // Fallback
      }
    }

    fetchLiveSlides();

    const handleUpdate = () => {
      fetchLiveSlides();
    };

    window.addEventListener("jas-data-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("jas-data-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const total = slides.length;

  // Auto slide interval
  useEffect(() => {
    if (total <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 6000);
    return () => clearInterval(timer);
  }, [total, isHovered]);

  function nextSlide() {
    setCurrent((prev) => (prev + 1) % total);
  }

  function prevSlide() {
    setCurrent((prev) => (prev - 1 + total) % total);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    touchStartX.current = null;
  }

  if (total === 0) return null;

  const slide = slides[current] || slides[0];

  // A slide is treated as a full-width banner if explicitly set to "banner" OR if there is no title & no subtitle & no price text
  const isFullWidthBanner =
    slide.type === "banner" || (!slide.title && !slide.subtitle && !slide.price);

  const hasOverlayContent = Boolean(
    slide.badge || slide.title || slide.subtitle || slide.price || slide.ctaText || slide.secondaryText
  );

  return (
    <section
      className="relative overflow-hidden bg-black text-white select-none w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {isFullWidthBanner ? (
        /* 🖼️ 100% FULL-WIDTH GRAPHIC BANNER POSTER MODE */
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/8] lg:aspect-[24/8] min-h-[240px] sm:min-h-[380px] lg:min-h-[500px] max-h-[640px] bg-black flex items-center justify-center overflow-hidden">
          {slide.ctaLink && !hasOverlayContent ? (
            <Link href={slide.ctaLink} className="relative block w-full h-full cursor-pointer">
              <Image
                src={slide.image}
                alt={slide.title?.trim() || "Jai Apple Store Banner"}
                fill
                priority={current === 0}
                sizes="100vw"
                className={`w-full h-full transition-transform duration-700 hover:scale-[1.01] ${
                  slide.imageFit === "contain"
                    ? "object-contain object-center"
                    : "object-cover object-center"
                }`}
              />
            </Link>
          ) : (
            <div className="relative w-full h-full">
              <Image
                src={slide.image}
                alt={slide.title?.trim() || "Jai Apple Store Banner"}
                fill
                priority={current === 0}
                sizes="100vw"
                className={`w-full h-full ${
                  slide.imageFit === "contain"
                    ? "object-contain object-center"
                    : "object-cover object-center"
                }`}
              />
            </div>
          )}

          {/* Optional Text/CTA Overlay on top of banner */}
          {hasOverlayContent && (
            <div className="absolute inset-0 z-10 flex items-center bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none">
              <div className="container-xl py-8 pointer-events-auto">
                <div className="max-w-xl space-y-3 sm:space-y-4">
                  {slide.badge && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white ring-1 ring-white/20 backdrop-blur-md">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                      </span>
                      {slide.badge}
                    </span>
                  )}

                  {slide.title && (
                    <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
                      {slide.title}
                    </h1>
                  )}

                  {slide.subtitle && (
                    <p className="text-sm sm:text-base text-gray-200 font-medium leading-relaxed drop-shadow max-w-lg">
                      {slide.subtitle}
                    </p>
                  )}

                  {slide.price && (
                    <p className="text-sm sm:text-base font-bold text-amber-300 drop-shadow">
                      {slide.price}
                    </p>
                  )}

                  {(slide.ctaText || slide.secondaryText) && (
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      {slide.ctaText && slide.ctaLink && (
                        <Link
                          href={slide.ctaLink}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0071e3] px-6 py-2.5 sm:px-7 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition hover:bg-[#0066cd] active:scale-95"
                        >
                          {slide.ctaText}
                          <ChevronRightIcon width={14} height={14} />
                        </Link>
                      )}

                      {slide.secondaryText && slide.secondaryLink && (
                        <Link
                          href={slide.secondaryLink}
                          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/20 hover:border-white/40"
                        >
                          {slide.secondaryText}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 📱 DEVICE SHOWCASE SPLIT MODE */
        <div
          className={`relative min-h-[480px] sm:min-h-[540px] lg:min-h-[580px] bg-gradient-to-r ${
            slide.bgGradient || "from-[#08090d] via-[#10121a] to-[#040507]"
          } flex items-center transition-all duration-700`}
        >
          {/* Subtle Ambient Glows */}
          <div
            className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full blur-[100px] opacity-30"
            style={{ backgroundColor: slide.accentColor || "#0071e3" }}
          />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-purple-600/20 blur-[120px]" />

          <div className="container-xl relative z-10 py-12 sm:py-16">
            <div className="grid items-center gap-8 lg:grid-cols-12">
              {/* Left Details */}
              <div className="flex flex-col items-start lg:col-span-7">
                {slide.badge && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-gray-200 ring-1 ring-white/15 backdrop-blur-md mb-4">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                    {slide.badge}
                  </span>
                )}

                {slide.title && (
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                    {slide.title}
                  </h1>
                )}

                {slide.subtitle && (
                  <p className="mt-3 text-base sm:text-lg text-gray-300 font-medium max-w-xl leading-relaxed">
                    {slide.subtitle}
                  </p>
                )}

                {slide.price && (
                  <p className="mt-2 text-sm sm:text-base font-bold text-[#0071e3]">
                    {slide.price}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  {slide.ctaText && slide.ctaLink && (
                    <Link
                      href={slide.ctaLink}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0071e3] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#0066cd] active:scale-95"
                    >
                      {slide.ctaText}
                      <ChevronRightIcon width={14} height={14} />
                    </Link>
                  )}

                  {slide.secondaryText && slide.secondaryLink && (
                    <Link
                      href={slide.secondaryLink}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/10 hover:border-white/30"
                    >
                      {slide.secondaryText}
                    </Link>
                  )}
                </div>
              </div>

              {/* Right Device Feature Render */}
              <div className="relative flex items-center justify-center lg:col-span-5">
                <div className="relative aspect-square w-full max-w-[340px] sm:max-w-[420px] transition-transform duration-700 hover:scale-105">
                  <Image
                    src={slide.image}
                    alt={slide.title?.trim() || "Apple Device Showcase"}
                    fill
                    priority={current === 0}
                    sizes="(max-width: 768px) 100vw, 450px"
                    className="object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.5)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Arrows (if > 1 slide) */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 transition-all opacity-75 hover:opacity-100 hover:scale-105 shadow-xl cursor-pointer"
          >
            &#8249;
          </button>
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-full bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/15 transition-all opacity-75 hover:opacity-100 hover:scale-105 shadow-xl cursor-pointer"
          >
            &#8250;
          </button>

          {/* Slide Indicator Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => setCurrent(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  current === idx ? "w-8 bg-[#0071e3]" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
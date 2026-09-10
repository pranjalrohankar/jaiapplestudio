"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { store, telLink } from "@/lib/store";
import { categories, products, type Product } from "@/lib/products";
import { defaultBanner, type BannerConfig } from "@/lib/banners";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { MenuIcon, CloseIcon, ChevronRightIcon } from "@/lib/icons";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMegamenu, setActiveMegamenu] = useState<string | null>(null);
  const [banner, setBanner] = useState<BannerConfig>(defaultBanner);
  const { customer, admin } = useAuth();
  const { count } = useCart();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchBanner() {
      try {
        const res = await fetch("/api/banners");
        if (res.ok) {
          const data = await res.json();
          if (data.banner) setBanner(data.banner);
        }
      } catch (err) {
        // silent fallback
      }
    }
    fetchBanner();
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const searchResults = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.tagline.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const megamenuCategories = ["iphone", "ipad", "mac", "watch", "airpods", "accessories"];

  return (
    <header className="sticky top-0 z-50 bg-black text-white select-none">
      {/* 1. TOP OFFER / ANNOUNCEMENT BAR */}
      {banner.isActive && banner.announcement ? (
        <div className="bg-[#111111] border-b border-white/10 px-4 py-2 text-center text-xs sm:text-[13px] text-gray-300">
          <div className="container-xl flex items-center justify-center gap-2">
            <span className="truncate">{banner.announcement}</span>
            <Link
              href={banner.secondaryCtaLink || "/product/iphone-18-pro"}
              className="inline-flex items-center gap-0.5 font-semibold text-[#0071e3] hover:underline"
            >
              Explore & Pre-Order <ChevronRightIcon width={12} height={12} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[#0a0a0a] border-b border-white/[0.08] px-4 py-1.5 text-center text-[12px] sm:text-[13px] text-gray-300">
          <div className="container-xl flex items-center justify-center gap-1.5 sm:gap-2">
            <span>Reach out to us at</span>
            <a
              href={`tel:${store.phoneIntl}`}
              className="font-bold text-[#0071e3] hover:underline"
            >
              {store.phoneDisplay}
            </a>
            <span className="hidden sm:inline">for latest offers & instant cashback</span>
          </div>
        </div>
      )}

      {/* 2. MAIN NAVBAR */}
      <div className="relative border-b border-white/10 bg-black/95 backdrop-blur-md">
        <div className="container-xl flex h-16 sm:h-[72px] items-center justify-between gap-3 sm:gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 transition hover:opacity-95 shrink-0 py-1"
            onClick={() => {
              setMobileOpen(false);
              setActiveMegamenu(null);
            }}
          >
            <div className="relative h-12 w-10 sm:h-14 sm:w-12 shrink-0">
              <Image
                src="/images/logo-transparent.png"
                alt="Jai Apple Store Logo"
                fill
                sizes="64px"
                className="object-contain drop-shadow-[0_2px_8px_rgba(229,169,60,0.3)]"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg lg:text-xl tracking-tight text-white leading-tight">
                Jai Apple Store
              </span>
              <span className="text-[9.5px] sm:text-[10px] tracking-wider text-white font-semibold uppercase mt-0.5">
                Your One Stop Solution
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav
            className="hidden xl:flex items-center gap-6 2xl:gap-8 text-[13.5px] font-medium text-gray-300"
            onMouseLeave={() => setActiveMegamenu(null)}
          >
            <Link
              href="/"
              className="transition hover:text-white"
              onMouseEnter={() => setActiveMegamenu(null)}
            >
              Store
            </Link>

            {categories.map((c) => (
              <div
                key={c.slug}
                className="relative py-4"
                onMouseEnter={() => setActiveMegamenu(c.slug)}
              >
                <Link
                  href={`/${c.slug}`}
                  className={`transition hover:text-white ${
                    activeMegamenu === c.slug ? "text-white font-semibold" : ""
                  }`}
                >
                  {c.name === "AirPods" ? "Audio" : c.name}
                </Link>
              </div>
            ))}

            <Link
              href="/product/iphone-17"
              className="text-rose-400 font-semibold transition hover:text-rose-300"
              onMouseEnter={() => setActiveMegamenu(null)}
            >
              Steal Deals
            </Link>

            <Link
              href="/contact"
              className="transition hover:text-white"
              onMouseEnter={() => setActiveMegamenu(null)}
            >
              Service Center
            </Link>

            <Link
              href="/cart"
              className="transition hover:text-white"
              onMouseEnter={() => setActiveMegamenu(null)}
            >
              Order Tracking
            </Link>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => {
                setSearchOpen((v) => !v);
                setActiveMegamenu(null);
              }}
              className="p-2 text-gray-300 hover:text-white transition rounded-full hover:bg-white/10"
              aria-label="Search products"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </button>

            {/* User / Account */}
            <Link
              href="/login"
              className="p-2 text-gray-300 hover:text-white transition rounded-full hover:bg-white/10 hidden sm:inline-flex"
              title={admin ? "Admin Portal" : customer ? customer.name : "Login / Account"}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </Link>

            {/* Cart / Bag Icon */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-300 hover:text-white transition rounded-full hover:bg-white/10"
              aria-label="Shopping Cart"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                />
              </svg>
              {count > 0 ? (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#0071e3] px-1 text-[10px] font-bold text-white shadow">
                  {count}
                </span>
              ) : null}
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="p-2 text-gray-300 hover:text-white transition xl:hidden rounded-lg hover:bg-white/10"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle Navigation"
            >
              {mobileOpen ? <CloseIcon width={22} /> : <MenuIcon width={22} />}
            </button>
          </div>
        </div>

        {/* 3. DESKTOP HOVER MEGAMENU */}
        {activeMegamenu && megamenuCategories.includes(activeMegamenu) ? (
          <div
            className="absolute left-0 top-full w-full bg-[#111111] border-b border-white/10 shadow-2xl py-8 z-40 transition-all"
            onMouseEnter={() => setActiveMegamenu(activeMegamenu)}
            onMouseLeave={() => setActiveMegamenu(null)}
          >
            <div className="container-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Explore All {categories.find((c) => c.slug === activeMegamenu)?.name}
                </span>
                <Link
                  href={`/${activeMegamenu}`}
                  onClick={() => setActiveMegamenu(null)}
                  className="text-xs font-semibold text-[#0071e3] hover:underline inline-flex items-center gap-1"
                >
                  View full lineup <ChevronRightIcon width={12} height={12} />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {products
                  .filter((p) => p.category === activeMegamenu)
                  .slice(0, 6)
                  .map((p) => (
                    <Link
                      key={p.slug}
                      href={`/product/${p.slug}`}
                      onClick={() => setActiveMegamenu(null)}
                      className="group flex flex-col items-center text-center p-3 rounded-xl hover:bg-white/5 transition"
                    >
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-3 flex items-center justify-center">
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt={p.name || "Apple Device"}
                            fill
                            sizes="80px"
                            className="object-contain p-1 transition-transform duration-300 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                            {p.name.slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-gray-200 group-hover:text-white transition">
                        {p.name}
                      </span>
                      <span className="text-[11px] text-gray-400 mt-0.5">
                        {p.price.startsWith("₹") ? `From ${p.price}` : p.price}
                      </span>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* 4. SEARCH OVERLAY POPUP */}
        {searchOpen ? (
          <div className="absolute left-0 top-full w-full bg-[#161617] border-b border-white/10 shadow-2xl p-4 sm:p-6 z-50">
            <div className="container-xl max-w-3xl">
              <div className="relative flex items-center">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for iPhones, MacBooks, Watches, AirPods, Accessories..."
                  className="w-full rounded-full bg-white/10 px-5 py-3 pl-12 text-sm sm:text-base text-white placeholder-gray-400 outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-[#0071e3]"
                />
                <svg
                  className="absolute left-4 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="ml-3 rounded-full bg-white/10 p-2.5 text-gray-300 hover:text-white hover:bg-white/20"
                >
                  <CloseIcon width={18} />
                </button>
              </div>

              {/* Quick Results or Suggestions */}
              {searchQuery.trim() ? (
                <div className="mt-4 divide-y divide-white/10 max-h-80 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((p) => (
                      <Link
                        key={p.slug}
                        href={`/product/${p.slug}`}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                        className="flex items-center justify-between py-3 px-2 hover:bg-white/5 rounded-lg transition"
                      >
                        <div className="flex items-center gap-3">
                          {p.image && (
                            <div className="relative w-10 h-10 shrink-0">
                              <Image
                                src={p.image}
                                alt={p.name || "Apple Device"}
                                fill
                                sizes="40px"
                                className="object-contain"
                              />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-white">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.tagline}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-[#0071e3]">{p.price}</span>
                      </Link>
                    ))
                  ) : (
                    <div className="py-6 text-center text-sm text-gray-400">
                      No products found matching &ldquo;{searchQuery}&rdquo;.
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                  <span className="font-semibold text-gray-300">Quick links:</span>
                  <Link
                    href="/product/iphone-18-pro"
                    onClick={() => setSearchOpen(false)}
                    className="rounded-full bg-white/5 px-3 py-1 hover:bg-white/10 text-gray-200"
                  >
                    iPhone 18 Pro
                  </Link>
                  <Link
                    href="/product/iphone-17-pro"
                    onClick={() => setSearchOpen(false)}
                    className="rounded-full bg-white/5 px-3 py-1 hover:bg-white/10 text-gray-200"
                  >
                    iPhone 17 Pro
                  </Link>
                  <Link
                    href="/product/macbook-air-13"
                    onClick={() => setSearchOpen(false)}
                    className="rounded-full bg-white/5 px-3 py-1 hover:bg-white/10 text-gray-200"
                  >
                    MacBook Air M3
                  </Link>
                  <Link
                    href="/product/apple-watch-series"
                    onClick={() => setSearchOpen(false)}
                    className="rounded-full bg-white/5 px-3 py-1 hover:bg-white/10 text-gray-200"
                  >
                    Apple Watch Series 11
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* 5. MOBILE DRAWER NAVIGATION */}
      {mobileOpen ? (
        <div className="fixed inset-0 top-20 z-40 bg-black/95 px-6 py-6 backdrop-blur-xl xl:hidden overflow-y-auto">
          <div className="flex flex-col gap-4 text-base font-medium">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="py-2 border-b border-white/10 text-white font-semibold"
            >
              Store Home
            </Link>

            {categories.map((c) => (
              <div key={c.slug} className="border-b border-white/10 pb-2">
                <Link
                  href={`/${c.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between py-2 text-gray-200 hover:text-white"
                >
                  <span>{c.name === "AirPods" ? "Audio (AirPods)" : c.name}</span>
                  <ChevronRightIcon width={16} height={16} className="text-gray-500" />
                </Link>
              </div>
            ))}

            <Link
              href="/product/iphone-17"
              onClick={() => setMobileOpen(false)}
              className="py-2 border-b border-white/10 text-rose-400 font-bold"
            >
              Steal Deals
            </Link>

            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="py-2 border-b border-white/10 text-gray-200 hover:text-white"
            >
              Service Center
            </Link>

            <Link
              href="/cart"
              onClick={() => setMobileOpen(false)}
              className="py-2 border-b border-white/10 text-gray-200 hover:text-white"
            >
              Order Tracking & Cart
            </Link>

            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="py-2 border-b border-white/10 text-gray-200 hover:text-white"
            >
              {admin ? "⚙️ Admin Portal" : customer ? `👤 ${customer.name}` : "Login / Sign In"}
            </Link>

            <div className="mt-4 flex flex-col gap-3 pt-2">
              <Link
                href="/cart"
                onClick={() => setMobileOpen(false)}
                className="btn-prime w-full text-center"
              >
                Go to Bag ({count})
              </Link>
              <a
                href={telLink}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 py-2.5 text-sm font-semibold text-white"
              >
                Call: {store.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
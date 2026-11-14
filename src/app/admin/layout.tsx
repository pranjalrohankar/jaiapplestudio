"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/admin",
    matchExact: true,
    additionalMatches: ["/admin/enquiries"],
    label: "Leads & Orders",
    icon: "💬",
    shortLabel: "Leads",
  },
  {
    href: "/admin/products",
    label: "Products Catalog",
    icon: "📱",
    shortLabel: "Products",
  },
  {
    href: "/admin/slider",
    label: "Hero Slider",
    icon: "🎠",
    shortLabel: "Slider",
  },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: "📁",
    shortLabel: "Categories",
  },
  {
    href: "/admin/banners",
    label: "Offer Banners",
    icon: "🎨",
    shortLabel: "Banners",
  },
  {
    href: "/admin/social",
    label: "Social Links",
    icon: "🌐",
    shortLabel: "Social",
  },
  {
    href: "/admin/database",
    label: "Database Sync",
    icon: "🗄️",
    shortLabel: "Database",
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, logoutAdmin, isHydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isHydrated && !admin && !isLoginPage) {
      router.push("/admin/login");
    }
  }, [isHydrated, admin, isLoginPage, router]);

  // Close mobile drawer when path changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        <div className="flex flex-col items-center gap-2">
          <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading admin portal...</span>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        Redirecting to administrator login...
      </div>
    );
  }

  function handleLogout() {
    logoutAdmin();
    router.push("/admin/login");
  }

  function isItemActive(item: typeof NAV_ITEMS[0]) {
    if (item.matchExact) {
      return pathname === item.href || (item.additionalMatches && item.additionalMatches.includes(pathname));
    }
    return pathname.startsWith(item.href);
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fa] text-gray-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-2xs">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="relative h-9 w-8 sm:h-11 sm:w-9 shrink-0 transition-transform group-hover:scale-105">
              <Image
                src="/images/logo-transparent.png"
                alt="Jai Apple Store Logo"
                fill
                sizes="48px"
                className="object-contain drop-shadow-[0_2px_6px_rgba(229,169,60,0.3)]"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-gray-900 leading-tight">
                Jai Apple Store
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  Admin Portal
                </span>
                <span className="inline-block sm:hidden text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                  Live
                </span>
              </div>
            </div>
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Portal</span>
          </span>
        </div>

        {/* Desktop Navigation (>= lg screens) */}
        <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2 text-xs font-semibold">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap ${
                  active
                    ? "bg-gray-900 text-white shadow-xs font-bold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="h-4 w-px bg-gray-200 mx-1" />

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 px-2.5 py-1.5 rounded-xl hover:bg-blue-50 transition font-bold"
            title="Open customer-facing store in new tab"
          >
            <span>Live Store ↗</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-xl transition font-bold cursor-pointer"
            title="Log out of administrator account"
          >
            Logout ({admin.username})
          </button>
        </nav>

        {/* Mobile Header Actions (< lg screens) */}
        <div className="flex lg:hidden items-center gap-1.5">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200/80 px-2.5 py-1.5 rounded-xl text-xs font-bold transition"
            title="Open store"
          >
            <span>Store ↗</span>
          </Link>

          {/* Hamburger Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-800 transition cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Horizontal Fast-Tab Strip (< lg screens) */}
      <div className="lg:hidden sticky top-[57px] sm:top-[61px] z-30 bg-white/95 backdrop-blur border-b border-gray-200/90 px-3 py-2 overflow-x-auto flex items-center gap-1.5 scrollbar-none shadow-2xs">
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                active
                  ? "bg-gray-900 text-white shadow-xs"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/70"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
      </div>

      {/* Mobile Slide-Down / Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Sheet */}
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2.5">
                <div className="relative h-9 w-8 shrink-0">
                  <Image
                    src="/images/logo-transparent.png"
                    alt="Jai Apple Store Logo"
                    fill
                    sizes="36px"
                    className="object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 leading-tight">Admin Menu</h3>
                  <p className="text-[11px] text-gray-500">Logged in as {admin.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm cursor-pointer"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 block mb-2">
                Store Management
              </span>
              {NAV_ITEMS.map((item) => {
                const active = isItemActive(item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-3 rounded-2xl transition text-sm font-bold ${
                      active
                        ? "bg-gray-900 text-white shadow-xs"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {active && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </Link>
                );
              })}

              <div className="pt-4 mt-4 border-t border-gray-100 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 block">
                  Quick Links
                </span>
                <Link
                  href="/"
                  target="_blank"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-3 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/80 text-sm font-bold hover:bg-blue-100 transition"
                >
                  <span className="flex items-center gap-2">
                    <span>🛍️</span>
                    <span>View Live Customer Store</span>
                  </span>
                  <span>↗</span>
                </Link>
              </div>
            </div>

            {/* Drawer Footer with Logout */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/80 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold text-sm transition cursor-pointer"
              >
                <span>🚪</span>
                <span>Sign Out ({admin.username})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}

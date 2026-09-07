"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { store, waLink } from "@/lib/store";
import { categories } from "@/lib/products";
import { defaultBanner, type BannerConfig } from "@/lib/banners";
import { useAuth } from "@/lib/auth-context";
import CartIcon from "@/components/CartIcon";
import { MenuIcon, CloseIcon, WhatsAppIcon, MailIcon, ChevronRightIcon } from "@/lib/icons";

const nav = categories.map((c) => ({ href: `/${c.slug}`, label: c.name }));

export default function Header() {
  const [open, setOpen] = useState(false);
  const [banner, setBanner] = useState<BannerConfig>(defaultBanner);
  const { customer, admin } = useAuth();

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

  return (
    <header className="sticky top-0 z-50">
      {banner.isActive && banner.announcement ? (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-950 px-4 py-2 text-center text-[13px] font-medium text-white shadow-inner">
          <div className="container-px flex items-center justify-center gap-2">
            <span className="truncate">{banner.announcement}</span>
            <Link
              href={banner.secondaryCtaLink || "/product/iphone-18-pro"}
              className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold text-white transition hover:bg-white/30"
            >
              Explore & Pre-Order <ChevronRightIcon width={12} height={12} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-ink px-4 py-2 text-center text-[13px] text-white/90">
          <span className="font-semibold">100% Genuine Apple products</span>
          <span className="mx-2 text-white/40">·</span>
          <span>No-Cost EMI</span>
          <span className="mx-2 text-white/40">·</span>
          <span>1-Year Warranty</span>
          <span className="mx-2 text-white/40">·</span>
          <span>Exchange available</span>
        </div>
      )}

      <div className="border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
        <div className="container-px flex h-14 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-sm font-bold text-white">
              J
            </span>
            <span className="text-[17px] font-semibold tracking-tight">Jai Apple Store</span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-ink/80 transition hover:text-apple"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="text-sm font-semibold text-ink/80 transition hover:text-apple"
            >
              Contact
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold text-ink/80 transition hover:text-apple"
            >
              {admin ? "⚙️ Admin" : customer ? `👤 ${customer.name.split(" ")[0]}` : "Login"}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <CartIcon />
            <Link
              href="/cart"
              className="hidden items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-bold text-white transition hover:bg-ink/85 sm:inline-flex"
            >
              Cart & Buy Now &rarr;
            </Link>
            <button
              className="grid h-10 w-10 place-items-center rounded-full text-ink lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <CloseIcon width={22} /> : <MenuIcon width={22} />}
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <nav className="absolute inset-x-0 top-full border-b border-black/[0.06] bg-white/95 px-6 py-4 backdrop-blur-xl lg:hidden">
          <div className="flex flex-col gap-4">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-lg font-semibold text-ink/90"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/contact" className="text-lg font-semibold text-ink/90" onClick={() => setOpen(false)}>
              Contact
            </Link>
            <Link href="/login" className="text-lg font-semibold text-ink/90" onClick={() => setOpen(false)}>
              {admin ? "⚙️ Admin Portal" : customer ? `👤 ${customer.name} (Account)` : "Login / Account"}
            </Link>
            <div className="mt-1 flex flex-col gap-3 border-t border-black/10 pt-4">
              <Link
                href="/cart"
                onClick={() => setOpen(false)}
                className="btn-apple"
              >
                View Cart & Buy Now
              </Link>
              <a href={`tel:${store.phoneIntl}`} className="btn-ghost">
                Call Store: {store.phoneDisplay}
              </a>
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
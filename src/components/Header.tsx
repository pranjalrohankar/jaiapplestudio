"use client";

import { useState } from "react";
import Link from "next/link";
import { store, waLink } from "@/lib/store";
import { categories } from "@/lib/products";
import CartIcon from "@/components/CartIcon";
import { MenuIcon, CloseIcon, WhatsAppIcon, MailIcon } from "@/lib/icons";

const nav = categories.map((c) => ({ href: `/${c.slug}`, label: c.name }));

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-ink px-4 py-2 text-center text-[13px] text-white/90">
        <span className="font-semibold">100% Genuine Apple products</span>
        <span className="mx-2 text-white/40">·</span>
        <span>No-Cost EMI</span>
        <span className="mx-2 text-white/40">·</span>
        <span>1-Year Warranty</span>
        <span className="mx-2 text-white/40">·</span>
        <span>Exchange available</span>
      </div>

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
          </nav>

          <div className="flex items-center gap-1.5">
            <CartIcon />
            <a
              href={waLink(`Hi ${store.name}! I'd like to know more about your products.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-full bg-wa px-4 py-2 text-sm font-semibold text-white transition hover:bg-wa-dark sm:inline-flex"
            >
              <WhatsAppIcon width={16} height={16} />
              WhatsApp
            </a>
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
            <div className="mt-1 flex flex-col gap-3 border-t border-black/10 pt-4">
              <a
                href={waLink(`Hi ${store.name}!`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-wa"
              >
                <WhatsAppIcon width={18} height={18} />
                Chat on WhatsApp
              </a>
              <a href={`mailto:${store.email}`} className="btn-ghost">
                <MailIcon width={18} height={18} />
                {store.email}
              </a>
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
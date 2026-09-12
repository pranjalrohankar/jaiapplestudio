"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { store, telLink, mailLink, waLink } from "@/lib/store";
import { categories } from "@/lib/products";
import { MapPinIcon, PhoneIcon, MailIcon, ClockIcon, WhatsAppIcon } from "@/lib/icons";
import { defaultSocialLinks, type SocialLink } from "@/lib/social";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(defaultSocialLinks);

  useEffect(() => {
    async function fetchSocial() {
      try {
        const res = await fetch(`/api/social?t=${Date.now()}`, {
          cache: "no-store",
          headers: { Pragma: "no-cache" },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.socialLinks) && data.socialLinks.length > 0) {
            setSocialLinks(data.socialLinks);
          }
        }
      } catch (err) {
        // Fallback to defaultSocialLinks
      }
    }
    fetchSocial();
  }, []);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 5000);
    }
  }

  return (
    <footer className="bg-[#111111] text-gray-300 select-none">
      {/* 1. NEWSLETTER SECTION */}
      <div className="border-b border-white/10 py-10 sm:py-12 bg-black">
        <div className="container-xl">
          <div className="grid gap-6 lg:grid-cols-12 items-center justify-between">
            <div className="lg:col-span-4">
              <Link href="/" className="inline-flex items-center gap-3.5 group">
                <div className="relative h-16 w-12 sm:h-20 sm:w-16 shrink-0">
                  <Image
                    src="/images/logo-transparent.png"
                    alt="Jai Apple Store Logo"
                    fill
                    sizes="80px"
                    className="object-contain drop-shadow-[0_4px_12px_rgba(229,169,60,0.35)] transition group-hover:scale-105"
                  />
                </div>
                <div>
                  <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white block leading-tight">
                    Jai Apple Store
                  </span>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-white block mt-1">
                    Your One Stop Solution
                  </span>
                </div>
              </Link>
              <p className="mt-2 text-xs text-gray-400">
                Pimpri-Chinchwad &amp; Pune&apos;s trusted Apple Partner
              </p>
            </div>

            <div className="lg:col-span-8 flex flex-col sm:flex-row sm:items-center justify-end gap-4">
              <div className="text-left sm:text-right">
                <p className="text-sm font-bold text-white uppercase tracking-wider">
                  Newsletter Subscription
                </p>
                <p className="text-xs text-gray-400">
                  Stay updated on pre-orders, launch events & exclusive deals
                </p>
              </div>

              <form onSubmit={handleSubscribe} className="flex max-w-md w-full gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email ID"
                  className="w-full rounded-full bg-white/10 px-4 py-2.5 text-xs sm:text-sm text-white placeholder-gray-400 outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-[#0071e3]"
                />
                <button
                  type="submit"
                  className="rounded-full bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-black hover:bg-gray-200 transition shrink-0"
                >
                  {subscribed ? "✓ Subscribed" : "Subscribe"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DIRECTORY COLUMNS */}
      <div className="py-14 sm:py-16">
        <div className="container-xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Shop Column */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
                Shop Lineup
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-gray-400">
                <li>
                  <Link href="/iphone" className="hover:text-white transition">
                    iPhone
                  </Link>
                </li>
                <li>
                  <Link href="/mac" className="hover:text-white transition">
                    MacBook & Mac
                  </Link>
                </li>
                <li>
                  <Link href="/ipad" className="hover:text-white transition">
                    iPad
                  </Link>
                </li>
                <li>
                  <Link href="/watch" className="hover:text-white transition">
                    Apple Watch
                  </Link>
                </li>
                <li>
                  <Link href="/airpods" className="hover:text-white transition">
                    AirPods & Audio
                  </Link>
                </li>
                <li>
                  <Link href="/accessories" className="hover:text-white transition">
                    Accessories & MagSafe
                  </Link>
                </li>
                <li>
                  <Link href="/product/iphone-17" className="text-rose-400 font-semibold hover:text-rose-300 transition">
                    Steal Deals
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
                Company & Services
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-gray-400">
                <li>
                  <Link href="/" className="hover:text-white transition">
                    Store Home
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition">
                    Student & Teacher Offer
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition">
                    Small Medium Business (SMB)
                  </Link>
                </li>
                <li>
                  <Link href="/cart" className="hover:text-white transition">
                    Order Tracking
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition">
                    Service & Support Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition">
                    Contact Store
                  </Link>
                </li>
              </ul>
            </div>

            {/* Policies Column */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
                Policies & Terms
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm text-gray-400">
                <li>
                  <Link href="/contact" className="hover:text-white transition">
                    Website Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition">
                    Delivery & Cancellation Policy
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition">
                    Pre-Booking Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Visit Store Column */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
                Visit Physical Store
              </h4>
              <ul className="space-y-3 text-xs sm:text-sm text-gray-400">
                <li className="flex gap-2.5">
                  <MapPinIcon width={16} className="mt-0.5 shrink-0 text-[#0071e3]" />
                  <span>{store.address}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <ClockIcon width={16} className="shrink-0 text-[#0071e3]" />
                  <span>{store.timings}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <PhoneIcon width={16} className="shrink-0 text-[#0071e3]" />
                  <a href={telLink} className="font-semibold text-white hover:text-[#0071e3]">
                    {store.phoneDisplay}
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <MailIcon width={16} className="shrink-0 text-[#0071e3]" />
                  <a href={mailLink} className="hover:text-[#0071e3] break-all">
                    {store.email}
                  </a>
                </li>
                <li className="pt-1">
                  <a
                    href={waLink(`Hi ${store.name}! I would like to check offer prices.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#25d366]/20 px-3.5 py-1.5 text-xs font-semibold text-[#25d366] hover:bg-[#25d366]/30 transition"
                  >
                    <WhatsAppIcon width={14} />
                    Chat on WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SOCIAL HANDLES & HOTLINE */}
      <div className="border-t border-white/10 py-6 bg-black">
        <div className="container-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-xs uppercase font-bold text-gray-400">Follow us:</span>
            {socialLinks
              .filter((s) => s.isActive && s.url && s.url.trim() !== "")
              .map((s) => (
                <a
                  key={s.id || s.platform}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-[#0071e3] transition font-medium text-xs sm:text-sm flex items-center gap-1.5"
                >
                  {s.platform}
                </a>
              ))}
          </div>

          <div className="text-xs sm:text-sm text-gray-300">
            <span>Know the latest Offers: </span>
            <a href={`tel:${store.phoneIntl}`} className="font-bold text-[#0071e3] hover:underline">
              {store.phoneDisplay}
            </a>
          </div>
        </div>
      </div>

      {/* 4. COPYRIGHT & DISCLAIMER */}
      <div className="border-t border-white/10 py-6 bg-[#0a0a0a] text-[11px] sm:text-xs text-gray-500">
        <div className="container-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
          <p>
            Copyright © {new Date().getFullYear()} {store.name}. All Rights Reserved.
          </p>
          <p className="max-w-xl text-left md:text-right">
            Apple, iPhone, iPad, Mac, Apple Watch and AirPods are trademarks of Apple Inc. {store.name} is an independent Apple partner and reseller in Pimpri-Chinchwad, Pune.
          </p>
        </div>
      </div>
    </footer>
  );
}
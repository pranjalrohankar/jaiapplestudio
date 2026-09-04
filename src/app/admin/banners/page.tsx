"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { type BannerConfig, defaultBanner } from "@/lib/banners";
import { WhatsAppIcon, ChevronRightIcon, CheckIcon } from "@/lib/icons";

export default function AdminBannersManager() {
  const [banner, setBanner] = useState<BannerConfig>(defaultBanner);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBanner();
  }, []);

  const fetchBanner = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/banners");
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || `Failed to fetch banner (HTTP ${res.status})`);
      }
      if (json.banner) {
        setBanner(json.banner);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load banner settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    setError(null);

    try {
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banner }),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to save banner configuration");
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading banner configuration...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Banner & Announcement Manager</h2>
          <p className="text-sm text-gray-500 mt-1">
            Customize the latest launch banner, announcement bar, and pre-booking call-to-actions.
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg transition"
        >
          Preview on Store &rarr;
        </a>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-3">
          <CheckIcon width={20} height={20} className="text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Banner updated successfully!</p>
            <p className="text-xs text-emerald-700">Changes are now live on the homepage and MongoDB/JSON storage.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
          <p className="font-semibold text-sm">Error saving banner</p>
          <p className="text-xs text-red-700 mt-0.5">{error}</p>
        </div>
      )}

      {/* Editor Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Banner Configuration</h3>
            <p className="text-xs text-gray-500">Manage visibility and content</p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <span className="text-sm font-semibold text-gray-700">
              {banner.isActive ? "Banner Visible" : "Banner Hidden"}
            </span>
            <input
              type="checkbox"
              checked={banner.isActive}
              onChange={(e) => setBanner({ ...banner, isActive: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600 relative"></div>
          </label>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Banner Headline / Title
              </label>
              <input
                type="text"
                required
                value={banner.title}
                onChange={(e) => setBanner({ ...banner, title: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. iPhone 18 Pro & iPhone 18"
              />
            </div>

            {/* Subtitle / Tagline */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tagline / Subheading
              </label>
              <input
                type="text"
                required
                value={banner.tagline}
                onChange={(e) => setBanner({ ...banner, tagline: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. The Next Era of Apple Intelligence"
              />
            </div>

            {/* Badge Text */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Badge / Tag Text
              </label>
              <input
                type="text"
                required
                value={banner.badge}
                onChange={(e) => setBanner({ ...banner, badge: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. LATEST LAUNCH • COMING SOON"
              />
            </div>

            {/* Visual Theme */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Theme / Color Style
              </label>
              <select
                value={banner.theme || "dark-aurora"}
                onChange={(e) => setBanner({ ...banner, theme: e.target.value as any })}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="dark-aurora">Dark Titanium Aurora (Recommended)</option>
                <option value="midnight-neon">Midnight Cyber Neon</option>
                <option value="cosmic-titanium">Cosmic Titanium Gold</option>
              </select>
            </div>

            {/* Announcement text */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Top Announcement Bar Text (Shown in Header)
              </label>
              <input
                type="text"
                value={banner.announcement || ""}
                onChange={(e) => setBanner({ ...banner, announcement: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. 🚀 Latest Launch: Apple iPhone 18 Series is coming soon! Pre-booking now open."
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={banner.description}
                onChange={(e) => setBanner({ ...banner, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Detailed launch description..."
              />
            </div>

            {/* Image URL & Presets */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Banner Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={banner.image}
                  onChange={(e) => setBanner({ ...banner, image: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  placeholder="e.g. /images/iphone-18-hero-banner.jpg"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => setBanner({ ...banner, image: "/images/iphone-18-hero-banner.jpg" })}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded text-gray-700 transition"
                >
                  iPhone 18 Dual Titanium Render
                </button>
                <button
                  type="button"
                  onClick={() => setBanner({ ...banner, image: "/images/iphone-18-pro.jpg" })}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded text-gray-700 transition"
                >
                  iPhone 18 Pro Studio Render
                </button>
              </div>
            </div>

            {/* Primary CTA Button */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Primary Button Label
              </label>
              <input
                type="text"
                required
                value={banner.ctaText}
                onChange={(e) => setBanner({ ...banner, ctaText: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. Pre-Book on WhatsApp"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Primary Button Link (URL or WhatsApp)
              </label>
              <input
                type="text"
                required
                value={banner.ctaLink}
                onChange={(e) => setBanner({ ...banner, ctaLink: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
                placeholder="https://wa.me/918888683101?text=..."
              />
            </div>

            {/* Secondary CTA Button */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Secondary Button Label (Optional)
              </label>
              <input
                type="text"
                value={banner.secondaryCtaText || ""}
                onChange={(e) => setBanner({ ...banner, secondaryCtaText: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. Explore iPhone 18"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Secondary Button Link (Optional)
              </label>
              <input
                type="text"
                value={banner.secondaryCtaLink || ""}
                onChange={(e) => setBanner({ ...banner, secondaryCtaLink: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
                placeholder="/product/iphone-18-pro"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={fetchBanner}
              className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
            >
              Reset Changes
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-black hover:bg-gray-800 text-white font-semibold transition text-sm disabled:opacity-50"
            >
              {saving ? "Saving Changes..." : "Save Banner Configuration"}
            </button>
          </div>
        </form>
      </div>

      {/* Live Preview Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Live Preview</h3>
          <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded-full">
            Real-time preview
          </span>
        </div>

        <div className="rounded-3xl border-2 border-dashed border-gray-300 p-4 bg-gray-100">
          <div
            className={`relative overflow-hidden rounded-[2rem] p-8 text-white ${
              banner.theme === "midnight-neon"
                ? "bg-gradient-to-br from-[#050b14] via-[#091b2c] to-[#030712] ring-1 ring-cyan-500/20"
                : banner.theme === "cosmic-titanium"
                ? "bg-gradient-to-br from-[#121316] via-[#1a1c22] to-[#0d0e11] ring-1 ring-amber-500/20"
                : "bg-gradient-to-br from-[#0c0d12] via-[#131520] to-[#07080b] ring-1 ring-white/10"
            } shadow-xl`}
          >
            <div className="relative z-10 grid items-center gap-8 lg:grid-cols-12">
              <div className="flex flex-col items-start lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3.5 py-1.5 text-xs font-semibold tracking-wider text-white backdrop-blur-md ring-1 ring-white/15">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  <span className="uppercase text-emerald-300 font-bold">{banner.badge}</span>
                </div>

                <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                  {banner.title}
                </h2>

                <p className="mt-2 text-lg font-medium text-cyan-300">
                  {banner.tagline}
                </p>

                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  {banner.description}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] px-5 py-2.5 text-sm font-bold text-white shadow-md">
                    <WhatsAppIcon width={18} height={18} />
                    {banner.ctaText}
                  </span>

                  {banner.secondaryCtaText && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md ring-1 ring-white/20">
                      {banner.secondaryCtaText}
                      <ChevronRightIcon width={14} height={14} />
                    </span>
                  )}
                </div>
              </div>

              <div className="relative flex justify-center lg:col-span-5">
                <div className="relative aspect-[16/10] w-full max-w-md">
                  <Image
                    src={banner.image || "/images/iphone-18-hero-banner.jpg"}
                    alt={banner.title}
                    fill
                    sizes="400px"
                    className="rounded-xl object-cover object-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

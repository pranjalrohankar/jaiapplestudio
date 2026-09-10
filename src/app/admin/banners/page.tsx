"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { type OfferBanner, type BannersData, defaultBannersData } from "@/lib/banners";
import { CheckIcon, TrashIcon } from "@/lib/icons";

export default function AdminBannersManager() {
  const [data, setData] = useState<BannersData>(defaultBannersData);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingBanner, setEditingBanner] = useState<OfferBanner | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBanners();
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (editingBanner) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [editingBanner]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingBanner) {
        setEditingBanner(null);
        setEditingIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingBanner]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/banners");
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || `Failed to fetch banners (HTTP ${res.status})`);
      }
      setData({
        announcement: json.announcement || defaultBannersData.announcement,
        isAnnouncementActive: json.isAnnouncementActive ?? true,
        banners: Array.isArray(json.banners) ? json.banners : defaultBannersData.banners,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load banner settings");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (res.ok && json.url) {
        if (editingBanner) {
          setEditingBanner({ ...editingBanner, image: json.url });
        }
        showToast("✓ Poster graphic uploaded!");
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result && editingBanner) {
            setEditingBanner({ ...editingBanner, image: event.target.result as string });
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && editingBanner) {
          setEditingBanner({ ...editingBanner, image: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveAll = async (updatedData: BannersData, successMsg?: string) => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to save banner configuration");
      }

      setData(updatedData);
      showToast(successMsg || "✓ Offer banners updated successfully!");
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBannerActive = (index: number) => {
    const updatedBanners = [...data.banners];
    updatedBanners[index].isActive = !updatedBanners[index].isActive;
    const updated = { ...data, banners: updatedBanners };
    setData(updated);
    handleSaveAll(updated, updatedBanners[index].isActive ? "✓ Banner enabled" : "○ Banner disabled");
  };

  const handleMoveBanner = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= data.banners.length) return;

    const updatedBanners = [...data.banners];
    const [moved] = updatedBanners.splice(index, 1);
    updatedBanners.splice(targetIndex, 0, moved);

    const updated = { ...data, banners: updatedBanners };
    setData(updated);
    handleSaveAll(updated, "✓ Banner order updated");
  };

  const handleDeleteBanner = (index: number) => {
    if (!window.confirm(`Delete banner "${data.banners[index]?.title || "Offer Banner"}"?`)) return;
    const updatedBanners = data.banners.filter((_, i) => i !== index);
    const updated = { ...data, banners: updatedBanners };
    setData(updated);
    handleSaveAll(updated, "✓ Banner deleted");
    if (editingIndex === index) {
      setEditingBanner(null);
      setEditingIndex(null);
    }
  };

  const handleStartAdd = () => {
    const newBanner: OfferBanner = {
      id: `banner-${Date.now()}`,
      isActive: true,
      title: "",
      badge: "LIMITED PERIOD OFFER",
      subtitle: "Get up to ₹10,000 extra exchange bonus + ₹5,000 instant bank cashback on all models.",
      priceTag: "Zero Down Payment No-Cost EMI Available",
      image: "/images/iphone-18-hero-banner.jpg",
      link: "/iphone",
      ctaText: "Claim Deal Now",
      layout: "full",
    };
    setEditingBanner(newBanner);
    setEditingIndex(-1);
  };

  const handleSaveBannerForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    let updatedBanners = [...data.banners];
    if (editingIndex === -1) {
      updatedBanners.push(editingBanner);
    } else if (editingIndex !== null && editingIndex >= 0) {
      updatedBanners[editingIndex] = editingBanner;
    }

    const updated = { ...data, banners: updatedBanners };
    setData(updated);
    handleSaveAll(updated, `✓ "${editingBanner.title || "Banner"}" saved successfully!`);
    setEditingBanner(null);
    setEditingIndex(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Loading offer banners configuration...</div>;
  }

  const activeBanners = data.banners.filter((b) => b.isActive);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950/90 text-emerald-100 border border-emerald-500/40 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-slideUp">
          <span className="text-emerald-400 font-bold">✔</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-md">
              Promotional Posters
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              🎨 Offer Banners &amp; Posters
            </h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Upload custom graphic offer designs, bank cashback posters, and promo cards for your store.
          </p>
        </div>
        <button
          type="button"
          onClick={handleStartAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0071e3] hover:bg-[#0066cd] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition cursor-pointer"
        >
          <span className="text-lg leading-none">+</span>
          <span>Add Offer Banner</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800">
          <p className="font-bold text-sm">Error saving banners</p>
          <p className="text-xs text-red-700 mt-0.5">{error}</p>
        </div>
      )}

      {/* 2. Top Announcement Bar Strip Manager */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900">Top Header Announcement Strip</h3>
            <p className="text-xs text-gray-500">Live offer headline shown at the very top of every store page</p>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <span className="text-xs font-semibold text-gray-700">
              {data.isAnnouncementActive ? "Active" : "Disabled"}
            </span>
            <input
              type="checkbox"
              checked={data.isAnnouncementActive}
              onChange={(e) => {
                const updated = { ...data, isAnnouncementActive: e.target.checked };
                setData(updated);
                handleSaveAll(updated, e.target.checked ? "✓ Header strip enabled" : "○ Header strip disabled");
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 relative" />
          </label>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={data.announcement}
            onChange={(e) => setData({ ...data, announcement: e.target.value })}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="e.g. 🚀 Special Offer: Get Instant ₹5,000 Bank Cashback on all iPhones"
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveAll(data, "✓ Header announcement updated!")}
            className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow transition disabled:opacity-50 cursor-pointer"
          >
            Update Strip
          </button>
        </div>
      </div>

      {/* 3. Banner List (Always in place so scroll position is preserved) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Current Offer Banners</h3>
            <p className="text-xs text-gray-500">Live promotional graphic banners displayed in the Offer Banners section</p>
          </div>
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {activeBanners.length} Active / {data.banners.length} Total
          </span>
        </div>

        {data.banners.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No offer banners created yet. Click "+ Add Offer Banner" above.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.banners.map((banner, index) => (
              <div
                key={banner.id || index}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-blue-50/20 ${
                  banner.isActive ? "bg-white" : "bg-gray-50/60 opacity-60"
                }`}
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveBanner(index, "up")}
                      className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20 text-xs font-bold"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                    <button
                      type="button"
                      disabled={index === data.banners.length - 1}
                      onClick={() => handleMoveBanner(index, "down")}
                      className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20 text-xs font-bold"
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="relative h-16 w-24 sm:h-20 sm:w-32 rounded-xl overflow-hidden bg-gray-900 shrink-0 border border-gray-200 shadow-inner">
                    <Image
                      src={banner.image}
                      alt={banner.title?.trim() || "Offer Graphic"}
                      fill
                      sizes="130px"
                      className="object-cover object-center"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        {banner.layout === "half" ? "🎴 2-Column Promo Card" : "🖼️ Full-Width Poster"}
                      </span>

                      {banner.badge && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                          {banner.badge}
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-sm sm:text-base text-gray-900 mt-1">
                      {banner.title || "Untitled Offer Poster"}
                    </h4>

                    {banner.priceTag && (
                      <p className="text-xs font-bold text-emerald-600 mt-0.5">
                        {banner.priceTag}
                      </p>
                    )}
                    
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-sm">
                      Target Link: <code className="text-gray-600 font-mono">{banner.link || "/"}</code>
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleToggleBannerActive(index)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                      banner.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {banner.isActive ? "● Live on Site" : "○ Inactive"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingBanner({ ...banner });
                      setEditingIndex(index);
                    }}
                    className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white transition shadow-2xs"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteBanner(index)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete banner"
                  >
                    <TrashIcon width={16} height={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL BANNER EDITOR (Fixed on screen — NO SCROLLING UP REQUIRED!) */}
      {/* ========================================================================= */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
                  🎨
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">
                    {editingIndex === -1 ? "Add New Offer Banner" : `Edit Banner: ${editingBanner.title || "Offer Poster"}`}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Upload graphic promotional designs and link them to products or deals.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingBanner(null);
                  setEditingIndex(null);
                }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center font-semibold text-sm transition"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBannerForm}>
              <div className="p-6 space-y-6 max-h-[calc(85vh-140px)] overflow-y-auto">
                {/* Banner Layout Format */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase text-gray-600">
                    Banner Layout Display Style
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingBanner({ ...editingBanner, layout: "full" })}
                      className={`p-4 rounded-2xl border text-left transition ${
                        editingBanner.layout !== "half"
                          ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🖼️</span>
                        <p className="font-bold text-sm text-gray-900">Full-Width Promotional Banner</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Wide edge-to-edge promotional poster (16:9 / 21:9 format) ideal for festival campaigns and mega sales.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingBanner({ ...editingBanner, layout: "half" })}
                      className={`p-4 rounded-2xl border text-left transition ${
                        editingBanner.layout === "half"
                          ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🎴</span>
                        <p className="font-bold text-sm text-gray-900">2-Column Promotional Card</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Side-by-side promo deal cards (e.g. Student discount on left, Watch combo on right).
                      </p>
                    </button>
                  </div>
                </div>

                {/* Graphic Poster Upload & URL */}
                <div className="space-y-4 bg-gray-50/80 p-4 sm:p-5 rounded-2xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase text-gray-700">
                      Offer Poster Graphic Image <span className="text-red-500">*</span>
                    </label>
                    {editingBanner.image && (
                      <span className="text-[11px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                        ✓ Image Attached
                      </span>
                    )}
                  </div>

                  {/* Aspect Ratio & Dimension Guide Card */}
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-blue-950">
                      <span>📐 Recommended Dimensions for {editingBanner.layout === "half" ? "2-Column Promo Cards" : "Full-Width Banners"}:</span>
                    </div>
                    {editingBanner.layout === "half" ? (
                      <div className="grid sm:grid-cols-2 gap-2 pt-1 text-[11px] text-blue-800">
                        <div>• <strong>Aspect Ratio:</strong> <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">16:10</code> or <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">4:3</code></div>
                        <div>• <strong>Optimal Canvas:</strong> <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">1200 x 750 px</code> (or 800 x 500 px)</div>
                        <div className="sm:col-span-2 text-blue-700">💡 <em>Tip: Great for category promos, combo discounts, or accessory deals.</em></div>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-2 pt-1 text-[11px] text-blue-800">
                        <div>• <strong>Aspect Ratio:</strong> <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">21:9</code> (Ultrawide) or <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">16:9</code></div>
                        <div>• <strong>Optimal Canvas:</strong> <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">1920 x 820 px</code> (or 1920 x 1080 px)</div>
                        <div className="sm:col-span-2 text-blue-700">💡 <em>Tip: In Canva/Photoshop, leave 60px padding on edges so text fits on mobile & desktop.</em></div>
                      </div>
                    )}
                  </div>

                  {/* Upload Dropzone & URL Input */}
                  <div className="grid sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-6">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="offer-banner-upload-modal"
                      />
                      <label
                        htmlFor="offer-banner-upload-modal"
                        className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition text-center ${
                          uploading
                            ? "border-blue-400 bg-blue-50/60 cursor-wait"
                            : "border-gray-300 hover:border-blue-500 bg-white hover:bg-blue-50/20"
                        }`}
                      >
                        <span className="text-2xl mb-1">{uploading ? "⏳" : "📁"}</span>
                        <span className="text-xs font-bold text-gray-800">
                          {uploading ? "Uploading Graphic..." : "Upload Poster from Device"}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          PNG, JPG, WebP
                        </span>
                      </label>
                    </div>

                    <div className="sm:col-span-6 space-y-1.5">
                      <span className="text-[11px] font-bold text-gray-500 uppercase">Or Image URL / Path:</span>
                      <input
                        type="text"
                        required
                        value={editingBanner.image}
                        onChange={(e) => setEditingBanner({ ...editingBanner, image: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                        placeholder="e.g. /images/festival-banner.jpg or https://..."
                      />
                    </div>
                  </div>

                  {/* Live Fit Preview in Form */}
                  {editingBanner.image && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="block text-[11px] font-bold uppercase text-gray-500 mb-1.5">
                        Live Fitting Preview ({editingBanner.layout === "half" ? "16:10 Card Format" : "21:9 Wide Poster Format"}):
                      </span>
                      <div className={`relative w-full rounded-xl overflow-hidden bg-black border border-gray-300 shadow-inner ${
                        editingBanner.layout === "half" ? "aspect-[16/10] max-h-48 max-w-sm" : "aspect-[21/9] max-h-48"
                      }`}>
                        <Image
                          src={editingBanner.image}
                          alt={editingBanner.title?.trim() || "Banner Preview"}
                          fill
                          sizes="600px"
                          className="object-cover object-center"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Offer Title <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={editingBanner.title || ""}
                      onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Mega Cashback & Exchange Festival"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Offer Badge Tag
                    </label>
                    <input
                      type="text"
                      value={editingBanner.badge || ""}
                      onChange={(e) => setEditingBanner({ ...editingBanner, badge: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. LIMITED PERIOD OFFER"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Subtitle / Offer Details
                    </label>
                    <input
                      type="text"
                      value={editingBanner.subtitle || ""}
                      onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Get up to ₹10,000 Extra Exchange Bonus + ₹5,000 Instant Bank Cashback."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Offer Price / Highlight Note
                    </label>
                    <input
                      type="text"
                      value={editingBanner.priceTag || ""}
                      onChange={(e) => setEditingBanner({ ...editingBanner, priceTag: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-blue-600"
                      placeholder="e.g. Zero Down Payment No-Cost EMI"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Button Action Label
                    </label>
                    <input
                      type="text"
                      value={editingBanner.ctaText || ""}
                      onChange={(e) => setEditingBanner({ ...editingBanner, ctaText: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Claim Offer Now"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Target Link (Product, Category, or WhatsApp URL)
                    </label>
                    <input
                      type="text"
                      value={editingBanner.link || ""}
                      onChange={(e) => setEditingBanner({ ...editingBanner, link: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
                      placeholder="e.g. /iphone or /product/iphone-17-pro"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="sticky bottom-0 z-20 bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => {
                    setEditingBanner(null);
                    setEditingIndex(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-6 py-2.5 rounded-xl bg-gray-950 hover:bg-black text-white font-semibold text-sm shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {saving && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{saving ? "Saving Banner..." : "Save Banner"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

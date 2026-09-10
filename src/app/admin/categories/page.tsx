"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { type CategoryTile, type CategoriesData, defaultCategoriesData } from "@/lib/categories";
import { CheckIcon, TrashIcon } from "@/lib/icons";

const CATEGORY_IMAGE_PRESETS = [
  {
    name: "iPhone 16 Pro",
    url: "https://www.apple.com/v/iphone/home/cd/images/overview/select/iphone_16pro__base6w621vyu_large.png",
  },
  {
    name: "MacBook Air M3",
    url: "https://www.apple.com/v/macbook-air/s/images/overview/design/design-top__dnjh93e0ycmq_large.jpg",
  },
  {
    name: "iPad Air M2",
    url: "https://www.apple.com/v/ipad-air/t/images/overview/closer-look/all-colors/slide_1B__d47g5w8dviye_large.jpg",
  },
  {
    name: "Apple Watch Series 10",
    url: "https://www.apple.com/v/apple-watch-series-10/a/images/overview/case-bands/finish_aluminum_jet_black__clm5hsq5z9au_large.png",
  },
  {
    name: "Apple Watch Ultra",
    url: "https://www.apple.com/v/apple-watch-ultra-2/e/images/overview/hero/hero_watch__bftq4prm5vzm_large.jpg",
  },
  {
    name: "AirPods 4",
    url: "https://www.apple.com/v/airpods-4/b/images/overview/hero/hero_anc__c923f7d1p16q_large.png",
  },
  {
    name: "AirPods Max",
    url: "https://www.apple.com/v/airpods-max/f/images/overview/hero__gnfk5g59t0qe_large.png",
  },
  {
    name: "MagSafe Accessories",
    url: "https://inventstore.in/wp-content/uploads/2026/06/Case-Cover.png",
  },
];

export default function AdminCategoriesManager() {
  const [data, setData] = useState<CategoriesData>(defaultCategoriesData);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingTile, setEditingTile] = useState<CategoryTile | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (editingTile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [editingTile]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingTile) {
        setEditingTile(null);
        setEditingIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingTile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || `Failed to fetch categories (HTTP ${res.status})`);
      }
      setData({
        categories: Array.isArray(json.categories) ? json.categories : defaultCategoriesData.categories,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load categories configuration");
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
        if (editingTile) {
          setEditingTile({ ...editingTile, image: json.url });
        }
        showToast("✓ Category image uploaded!");
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result && editingTile) {
            setEditingTile({ ...editingTile, image: event.target.result as string });
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && editingTile) {
          setEditingTile({ ...editingTile, image: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveAll = async (updatedData: CategoriesData, successMsg?: string) => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to save category configuration");
      }

      setData(updatedData);
      showToast(successMsg || "✓ Categories updated successfully!");
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTileActive = (index: number) => {
    const updated = [...data.categories];
    updated[index].isActive = !updated[index].isActive;
    const newData = { ...data, categories: updated };
    setData(newData);
    handleSaveAll(newData, updated[index].isActive ? "✓ Category visible" : "○ Category hidden");
  };

  const handleMoveTile = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= data.categories.length) return;

    const updated = [...data.categories];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const newData = { ...data, categories: updated };
    setData(newData);
    handleSaveAll(newData, "✓ Category order updated");
  };

  const handleDeleteTile = (index: number) => {
    if (!window.confirm(`Delete category "${data.categories[index]?.name}"?`)) return;
    const updated = data.categories.filter((_, i) => i !== index);
    const newData = { ...data, categories: updated };
    setData(newData);
    handleSaveAll(newData, "✓ Category deleted");
    if (editingIndex === index) {
      setEditingTile(null);
      setEditingIndex(null);
    }
  };

  const handleStartAdd = () => {
    const newTile: CategoryTile = {
      id: `category-${Date.now()}`,
      name: "New Category",
      slug: "new-category",
      subtitle: "Explore items",
      image: "https://www.apple.com/v/iphone/home/cd/images/overview/select/iphone_16pro__base6w621vyu_large.png",
      imageFit: "contain",
      isActive: true,
    };
    setEditingTile(newTile);
    setEditingIndex(-1);
  };

  const handleSaveTileForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTile) return;

    let updated = [...data.categories];
    if (editingIndex === -1) {
      updated.push(editingTile);
    } else if (editingIndex !== null && editingIndex >= 0) {
      updated[editingIndex] = editingTile;
    }

    const newData = { ...data, categories: updated };
    setData(newData);
    handleSaveAll(newData, `✓ "${editingTile.name}" saved successfully!`);
    setEditingTile(null);
    setEditingIndex(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Loading category tiles configuration...</div>;
  }

  const activeCategories = data.categories.filter((c) => c.isActive !== false);

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
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-md">
              Homepage Strip
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              📁 Category Section
            </h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Customize the images, titles, and links for the "Explore by Category" icon strip on your homepage.
          </p>
        </div>
        <button
          type="button"
          onClick={handleStartAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition cursor-pointer"
        >
          <span className="text-lg leading-none">+</span>
          <span>Add Category Tile</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800">
          <p className="font-bold text-sm">Error saving categories</p>
          <p className="text-xs text-red-700 mt-0.5">{error}</p>
        </div>
      )}

      {/* 2. Category Tiles List (Always in place so scroll position is preserved) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Current Homepage Category Tiles</h3>
            <p className="text-xs text-gray-500">Tiles displayed in the "Explore by Category" strip on the homepage</p>
          </div>
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {activeCategories.length} Active / {data.categories.length} Total
          </span>
        </div>

        {data.categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No category tiles found. Click "+ Add Category Tile" above.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.categories.map((tile, index) => (
              <div
                key={tile.id || tile.slug || index}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-blue-50/20 ${
                  tile.isActive !== false ? "bg-white" : "bg-gray-50/60 opacity-60"
                }`}
              >
                {/* Left: Thumbnail & Details */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveTile(index, "up")}
                      className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20 text-xs font-bold"
                      title="Move left/up"
                    >
                      ▲
                    </button>
                    <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                    <button
                      type="button"
                      disabled={index === data.categories.length - 1}
                      onClick={() => handleMoveTile(index, "down")}
                      className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20 text-xs font-bold"
                      title="Move right/down"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-gray-50 shrink-0 border border-gray-200 flex items-center justify-center p-1.5">
                    <Image
                      src={tile.image}
                      alt={tile.name || "Category Preview"}
                      fill
                      sizes="80px"
                      className="object-contain"
                    />
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-gray-900">
                      {tile.name}
                    </h4>
                    {tile.subtitle && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {tile.subtitle}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Target Link: <code className="text-blue-600 font-mono">{tile.link || `/${tile.slug}`}</code>
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleToggleTileActive(index)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                      tile.isActive !== false
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                    }`}
                  >
                    {tile.isActive !== false ? "● Visible" : "○ Hidden"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingTile({ ...tile });
                      setEditingIndex(index);
                    }}
                    className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white transition shadow-2xs"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTile(index)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete category"
                  >
                    <TrashIcon width={16} height={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Live Store Preview */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900">Explore by Category Live Store Preview</h3>
        <div className="bg-[#f8f8fa] p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm">
          <div className="text-center mb-6">
            <h4 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111111]">
              Explore by Category
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Find the perfect Apple device and accessories with genuine warranty
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {activeCategories.map((c) => (
              <div
                key={c.id || c.slug}
                className="flex flex-col items-center justify-between rounded-2xl bg-white p-4 border border-[#e6e6e6] text-center shadow-sm"
              >
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 my-1 flex items-center justify-center">
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </div>
                <div className="mt-2">
                  <h5 className="text-xs sm:text-sm font-bold text-[#111111]">{c.name}</h5>
                  {c.subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{c.subtitle}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL CATEGORY EDITOR (Fixed on screen — NO SCROLLING UP REQUIRED!) */}
      {/* ========================================================================= */}
      {editingTile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                  📁
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">
                    {editingIndex === -1 ? "Add New Category Tile" : `Edit Category: ${editingTile.name}`}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Upload image cutout, set category title, subtitle, and target page link.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingTile(null);
                  setEditingIndex(null);
                }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center font-semibold text-sm transition"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTileForm}>
              <div className="p-6 space-y-6 max-h-[calc(85vh-140px)] overflow-y-auto">
                {/* Image Upload Area */}
                <div className="space-y-4 bg-gray-50/80 p-4 sm:p-5 rounded-2xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase text-gray-700">
                      Category Product Image / Icon <span className="text-red-500">*</span>
                    </label>
                    {editingTile.image && (
                      <span className="text-[11px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                        ✓ Image Attached
                      </span>
                    )}
                  </div>

                  {/* Aspect Ratio & Dimension Guide */}
                  <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-blue-950">
                      <span>📐 Recommended Dimensions for Category Tiles:</span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 pt-1 text-[11px] text-blue-800">
                      <div>• <strong>Aspect Ratio:</strong> <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono font-bold">1:1 (Square)</code></div>
                      <div>• <strong>Optimal Canvas:</strong> <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono font-bold">400 x 400 px</code> (or 500 x 500 px)</div>
                      <div className="sm:col-span-2 text-blue-700">
                        💡 <em>Tip: Use a transparent background PNG or WebP cutout so the device sits cleanly on white cards.</em>
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-6">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="category-file-upload-modal"
                      />
                      <label
                        htmlFor="category-file-upload-modal"
                        className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition text-center ${
                          uploading
                            ? "border-blue-400 bg-blue-50/60 cursor-wait"
                            : "border-gray-300 hover:border-blue-500 bg-white hover:bg-blue-50/20"
                        }`}
                      >
                        <span className="text-2xl mb-1">{uploading ? "⏳" : "📁"}</span>
                        <span className="text-xs font-bold text-gray-800">
                          {uploading ? "Uploading Image..." : "Upload Image from Device"}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          PNG, WebP, JPG
                        </span>
                      </label>
                    </div>

                    <div className="sm:col-span-6 space-y-1.5">
                      <span className="text-[11px] font-bold text-gray-500 uppercase">Or Image URL / Path:</span>
                      <input
                        type="text"
                        required
                        value={editingTile.image}
                        onChange={(e) => setEditingTile({ ...editingTile, image: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                        placeholder="e.g. https://... or /images/..."
                      />
                    </div>
                  </div>

                  {/* Sample Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-gray-500">
                    <span className="font-semibold text-gray-600">Quick Presets:</span>
                    {CATEGORY_IMAGE_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setEditingTile({ ...editingTile, image: preset.url })}
                        className="bg-white border border-gray-200 hover:border-gray-400 px-2 py-0.5 rounded-lg text-gray-700 transition text-[11px]"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>

                  {/* Live Fit Preview in Form */}
                  {editingTile.image && (
                    <div className="pt-3 border-t border-gray-200 flex items-center gap-5">
                      <div className="relative h-20 w-20 rounded-2xl bg-white border border-gray-300 shadow-sm flex items-center justify-center p-2 shrink-0">
                        <Image
                          src={editingTile.image}
                          alt={editingTile.name || "Preview"}
                          fill
                          sizes="96px"
                          className="object-contain"
                        />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-gray-800">Live Tile Card Preview</span>
                        <p className="text-sm font-extrabold text-gray-900 mt-0.5">{editingTile.name || "Category Name"}</p>
                        <p className="text-xs text-gray-500">{editingTile.subtitle || "Subtitle"}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editingTile.name}
                      onChange={(e) => setEditingTile({ ...editingTile, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                      placeholder="e.g. iPhone, MacBook & Mac, iPad"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Subtitle / Description
                    </label>
                    <input
                      type="text"
                      value={editingTile.subtitle || ""}
                      onChange={(e) => setEditingTile({ ...editingTile, subtitle: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Explore all models, Air & Pro"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Category Slug (Route) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editingTile.slug}
                      onChange={(e) => setEditingTile({ ...editingTile, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
                      placeholder="e.g. iphone, mac, ipad, watch, airpods, accessories"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Custom Target URL <span className="text-gray-400 font-normal">(Optional, defaults to /{editingTile.slug})</span>
                    </label>
                    <input
                      type="text"
                      value={editingTile.link || ""}
                      onChange={(e) => setEditingTile({ ...editingTile, link: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
                      placeholder="e.g. /iphone or https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="sticky bottom-0 z-20 bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTile(null);
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
                  <span>{saving ? "Saving Category..." : "Save Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

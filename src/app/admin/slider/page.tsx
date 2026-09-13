"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { type SliderSlide, type SliderData, defaultSliderData } from "@/lib/slider";
import { CheckIcon, TrashIcon } from "@/lib/icons";

const GRADIENT_PRESETS = [
  { name: "Dark Titanium (Default)", value: "from-[#08090d] via-[#10121a] to-[#040507]", accent: "#0071e3" },
  { name: "Cosmic Gold / Orange", value: "from-[#0f1118] via-[#1b1e2b] to-[#0a0b10]", accent: "#f59e0b" },
  { name: "Cyber Sapphire Blue", value: "from-[#0a0f1d] via-[#111c36] to-[#050811]", accent: "#38bdf8" },
  { name: "Midnight Titanium Gray", value: "from-[#111215] via-[#1c1d22] to-[#08090a]", accent: "#f97316" },
  { name: "Royal Purple Velvet", value: "from-[#0c0d12] via-[#161822] to-[#08090c]", accent: "#a855f7" },
  { name: "Festive Emerald Green", value: "from-[#06140e] via-[#0c2419] to-[#030a07]", accent: "#10b981" },
  { name: "Ruby Red Special", value: "from-[#18080a] via-[#280c10] to-[#0d0405]", accent: "#ef4444" },
];

export default function AdminSliderManager() {
  const [data, setData] = useState<SliderData>({ slides: [] });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingSlide, setEditingSlide] = useState<SliderSlide | null>(null);
  const [previewCurrent, setPreviewCurrent] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSlider();
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (editingSlide) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [editingSlide]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingSlide) {
        setEditingSlide(null);
        setEditingIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingSlide]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const fetchSlider = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/slider?t=${Date.now()}`, {
        cache: "no-store",
        headers: { Pragma: "no-cache" },
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || `Failed to fetch slider (HTTP ${res.status})`);
      }
      setData({
        slides: Array.isArray(json.slides) ? json.slides : [],
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load slider configuration");
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
        if (editingSlide) {
          setEditingSlide({ ...editingSlide, image: json.url });
        }
        showToast("✓ Hero slide image uploaded!");
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result && editingSlide) {
            setEditingSlide({ ...editingSlide, image: event.target.result as string });
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && editingSlide) {
          setEditingSlide({ ...editingSlide, image: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveAll = async (updatedData: SliderData, successMsg?: string) => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/slider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to save slider configuration");
      }

      setData(updatedData);
      try {
        if (typeof window !== "undefined") {
          const activeOnly = updatedData.slides.filter((s) => s.isActive !== false);
          if (activeOnly.length > 0) {
            window.localStorage.setItem("jas-live-slider", JSON.stringify(activeOnly));
          } else {
            window.localStorage.removeItem("jas-live-slider");
          }
          window.dispatchEvent(new Event("jas-data-updated"));
        }
      } catch {}
      showToast(successMsg || "✓ Hero slider updated successfully!");
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSlideActive = (index: number) => {
    const updatedSlides = [...data.slides];
    updatedSlides[index].isActive = !updatedSlides[index].isActive;
    const updated = { ...data, slides: updatedSlides };
    setData(updated);
    handleSaveAll(updated, updatedSlides[index].isActive ? "✓ Slide enabled" : "○ Slide disabled");
  };

  const handleMoveSlide = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= data.slides.length) return;

    const updatedSlides = [...data.slides];
    const [moved] = updatedSlides.splice(index, 1);
    updatedSlides.splice(targetIndex, 0, moved);

    const updated = { ...data, slides: updatedSlides };
    setData(updated);
    handleSaveAll(updated, "✓ Slide order updated");
  };

  const handleDeleteSlide = (index: number) => {
    if (!window.confirm(`Delete slide "${data.slides[index]?.title || `Slide #${index + 1}`}"?`)) return;
    const updatedSlides = data.slides.filter((_, i) => i !== index);
    const updated = { ...data, slides: updatedSlides };
    setData(updated);
    handleSaveAll(updated, "✓ Slide deleted");
    if (editingIndex === index) {
      setEditingSlide(null);
      setEditingIndex(null);
    }
  };

  const handleStartAddBanner = () => {
    const newSlide: SliderSlide = {
      id: `banner-${Date.now()}`,
      isActive: true,
      type: "banner",
      imageFit: "cover",
      title: "",
      badge: "",
      subtitle: "",
      price: "",
      ctaText: "",
      ctaLink: "/",
      secondaryText: "",
      secondaryLink: "",
      image: "",
      bgGradient: "from-[#08090d] via-[#10121a] to-[#040507]",
      accentColor: "#0071e3",
    };
    setEditingSlide(newSlide);
    setEditingIndex(-1);
  };

  const handleStartAddShowcase = () => {
    const newSlide: SliderSlide = {
      id: `showcase-${Date.now()}`,
      isActive: true,
      type: "showcase",
      imageFit: "contain",
      title: "iPhone 18 Pro",
      badge: "NEW LAUNCH • PRE-BOOKINGS OPEN",
      subtitle: "Built for Apple Intelligence. Titanium powerhouse.",
      price: "Pre-orders live with zero advance fee",
      ctaText: "Pre-Order Now",
      ctaLink: "/product/iphone-18-pro",
      secondaryText: "Explore Lineup",
      secondaryLink: "/iphone",
      image: "/images/iphone-18-hero-banner.jpg",
      bgGradient: "from-[#08090d] via-[#10121a] to-[#040507]",
      accentColor: "#0071e3",
    };
    setEditingSlide(newSlide);
    setEditingIndex(-1);
  };

  const handleSaveSlideForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlide) return;

    let updatedSlides = [...data.slides];
    if (editingIndex === -1) {
      updatedSlides.push(editingSlide);
    } else if (editingIndex !== null && editingIndex >= 0) {
      updatedSlides[editingIndex] = editingSlide;
    }

    const updated = { ...data, slides: updatedSlides };
    setData(updated);
    handleSaveAll(updated, `✓ Slide "${editingSlide.title || "Hero Banner"}" saved successfully!`);
    setEditingSlide(null);
    setEditingIndex(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Loading hero slider configuration...</div>;
  }

  const activeSlides = data.slides.filter((s) => s.isActive);
  const previewSlide = activeSlides[previewCurrent] || data.slides[0];

  const isEditingBanner = editingSlide
    ? editingSlide.type === "banner" || (!editingSlide.title && !editingSlide.subtitle && !editingSlide.price)
    : false;

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
            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-0.5 rounded-md">
              Top of Homepage
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              🎠 Top Hero Slider
            </h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Manage the full-width promotional posters and device showcases displayed at the top of your homepage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleStartAddBanner}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            🖼️ + Add Full Banner
          </button>
          <button
            type="button"
            onClick={handleStartAddShowcase}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-gray-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            📱 + Add Showcase
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800">
          <p className="font-bold text-sm">Error saving slider</p>
          <p className="text-xs text-red-700 mt-0.5">{error}</p>
        </div>
      )}

      {/* 2. Slide List Table (Always in place so scroll position is preserved) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Current Hero Slides</h3>
            <p className="text-xs text-gray-500">Active slides will automatically rotate at the top of your homepage</p>
          </div>
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {activeSlides.length} Active / {data.slides.length} Total
          </span>
        </div>

        {data.slides.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No slides created yet. Click "+ Add Full Banner" or "+ Add Showcase" above.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.slides.map((slide, index) => {
              const isBanner = slide.type === "banner" || (!slide.title && !slide.subtitle && !slide.price);
              return (
                <div
                  key={slide.id || index}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-blue-50/20 ${
                    slide.isActive ? "bg-white" : "bg-gray-50/60 opacity-60"
                  }`}
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveSlide(index, "up")}
                        className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20 text-xs font-bold"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                      <button
                        type="button"
                        disabled={index === data.slides.length - 1}
                        onClick={() => handleMoveSlide(index, "down")}
                        className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20 text-xs font-bold"
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>

                    <div className={`relative ${isBanner ? "h-16 w-32 sm:h-20 sm:w-40" : "h-16 w-24 sm:h-20 sm:w-28"} rounded-xl overflow-hidden bg-gray-950 shrink-0 border border-gray-200 flex items-center justify-center p-1`}>
                      <Image
                        src={slide.image}
                        alt={slide.title?.trim() || "Slide Preview"}
                        fill
                        sizes="160px"
                        className={isBanner ? "object-cover" : "object-contain"}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        {isBanner ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                            🖼️ Full Banner
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                            📱 Device Showcase
                          </span>
                        )}

                        {slide.badge && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                            {slide.badge}
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-sm sm:text-base text-gray-900 mt-1">
                        {slide.title || (isBanner ? "Full-Width Graphic Banner" : "Untitled Showcase Slide")}
                      </h4>

                      {slide.price && (
                        <p className="text-xs font-bold text-[#0071e3] mt-0.5">
                          {slide.price}
                        </p>
                      )}
                      
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-sm">
                        Link: <code className="text-gray-600 font-mono">{slide.ctaLink || "/"}</code>
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleToggleSlideActive(index)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                        slide.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      {slide.isActive ? "● Live on Site" : "○ Inactive"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingSlide({ ...slide });
                        setEditingIndex(index);
                      }}
                      className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white transition shadow-2xs"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete slide"
                    >
                      <TrashIcon width={16} height={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL SLIDE EDITOR (Fixed on screen — NO SCROLLING UP REQUIRED!) */}
      {/* ========================================================================= */}
      {editingSlide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg">
                  🎠
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">
                    {editingIndex === -1
                      ? isEditingBanner
                        ? "Add New Full-Width Banner"
                        : "Add New Device Showcase"
                      : `Edit Slide: ${editingSlide.title || "Graphic Banner"}`}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Configure hero graphics, banner layouts, links, and text overlays.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingSlide(null);
                  setEditingIndex(null);
                }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center font-semibold text-sm transition"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSlideForm}>
              <div className="p-6 space-y-6 max-h-[calc(85vh-140px)] overflow-y-auto">
                {/* Layout Mode Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase text-gray-700">
                    Slide Layout Style <span className="text-red-500">*</span>
                  </label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingSlide({ ...editingSlide, type: "banner", imageFit: "cover" })}
                      className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3.5 ${
                        editingSlide.type === "banner" || (!editingSlide.type && !editingSlide.title && !editingSlide.subtitle)
                          ? "border-blue-600 bg-blue-50/50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <span className="text-3xl">🖼️</span>
                      <div>
                        <span className="block text-sm font-extrabold text-gray-900">
                          Full-Width Graphic Banner
                        </span>
                        <span className="block text-xs text-gray-500 mt-0.5">
                          Ready-made widescreen poster. Spans 100% full width edge-to-edge.
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingSlide({ ...editingSlide, type: "showcase", imageFit: "contain" })}
                      className={`p-4 rounded-2xl border-2 text-left transition flex items-start gap-3.5 ${
                        editingSlide.type === "showcase"
                          ? "border-blue-600 bg-blue-50/50 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <span className="text-3xl">📱</span>
                      <div>
                        <span className="block text-sm font-extrabold text-gray-900">
                          Split Device Showcase
                        </span>
                        <span className="block text-xs text-gray-500 mt-0.5">
                          Left side text, price & buy button; right side transparent device cutout.
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Image / Graphic Upload */}
                <div className="space-y-4 bg-gray-50/80 p-4 sm:p-5 rounded-2xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase text-gray-700">
                      {isEditingBanner ? "Graphic Banner Image" : "Device Showcase Render Image"} <span className="text-red-500">*</span>
                    </label>
                    {editingSlide.image && (
                      <span className="text-[11px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                        ✓ Image Attached
                      </span>
                    )}
                  </div>

                  {/* Dynamic Aspect Ratio Guide */}
                  {isEditingBanner ? (
                    <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-blue-950">
                        <span>📐 Recommended Dimensions for Full-Width Banner:</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2 pt-1 text-[11px] text-blue-800">
                        <div>• <strong>Aspect Ratio:</strong> <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono font-bold">21:9</code> or <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono font-bold">24:9</code></div>
                        <div>• <strong>Optimal Canvas:</strong> <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono font-bold">1920 x 700 px</code> or <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono font-bold">2400 x 900 px</code></div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 text-xs text-purple-900 space-y-1.5">
                      <div className="flex items-center gap-2 font-bold text-purple-950">
                        <span>📐 Recommended Dimensions for Device Showcase:</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2 pt-1 text-[11px] text-purple-800">
                        <div>• <strong>Aspect Ratio:</strong> <code className="bg-purple-100 px-1 py-0.5 rounded font-mono">1:1 (Square)</code> or <code className="bg-purple-100 px-1 py-0.5 rounded font-mono">4:3</code></div>
                        <div>• <strong>Optimal Canvas:</strong> <code className="bg-purple-100 px-1 py-0.5 rounded font-mono">800 x 800 px</code></div>
                      </div>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-6">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="slider-file-upload-modal"
                      />
                      <label
                        htmlFor="slider-file-upload-modal"
                        className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition text-center ${
                          uploading
                            ? "border-blue-400 bg-blue-50/60 cursor-wait"
                            : "border-gray-300 hover:border-blue-500 bg-white hover:bg-blue-50/20"
                        }`}
                      >
                        <span className="text-2xl mb-1">{uploading ? "⏳" : "📁"}</span>
                        <span className="text-xs font-bold text-gray-800">
                          {uploading ? "Uploading Banner..." : "Upload Image from Device"}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5">
                          WEBP, JPG, PNG
                        </span>
                      </label>
                    </div>

                    <div className="sm:col-span-6 space-y-1.5">
                      <span className="text-[11px] font-bold text-gray-500 uppercase">Or Image URL / Path:</span>
                      <input
                        type="text"
                        required
                        value={editingSlide.image}
                        onChange={(e) => setEditingSlide({ ...editingSlide, image: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                        placeholder="e.g. https://... or /images/..."
                      />
                    </div>
                  </div>

                  {/* Image Fit Option */}
                  <div className="flex items-center gap-4 pt-1">
                    <span className="text-xs font-bold text-gray-700 uppercase">Image Fitting:</span>
                    <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="imageFitModal"
                        checked={editingSlide.imageFit !== "contain"}
                        onChange={() => setEditingSlide({ ...editingSlide, imageFit: "cover" })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span><strong>Cover (Full-Bleed 100% Fit)</strong></span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="imageFitModal"
                        checked={editingSlide.imageFit === "contain"}
                        onChange={() => setEditingSlide({ ...editingSlide, imageFit: "contain" })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span><strong>Contain (Entire Image Visible)</strong></span>
                    </label>
                  </div>

                  {/* Live Fit Preview in Form */}
                  {editingSlide.image && (
                    <div className="pt-3 border-t border-gray-200">
                      <span className="block text-xs font-bold text-gray-800 mb-2">Live Slide Preview:</span>
                      {isEditingBanner ? (
                        <div className="relative w-full aspect-[21/8] max-h-48 rounded-xl overflow-hidden bg-black border border-gray-300 shadow-inner">
                          <Image
                            src={editingSlide.image}
                            alt="Banner Preview"
                            fill
                            sizes="100vw"
                            className={editingSlide.imageFit === "contain" ? "object-contain object-center" : "object-cover object-center"}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className={`relative h-28 w-28 rounded-2xl p-2 bg-gradient-to-r ${editingSlide.bgGradient || "from-[#08090d] to-[#040507]"} border border-gray-300 shadow-inner flex items-center justify-center shrink-0`}>
                            <Image
                              src={editingSlide.image}
                              alt={editingSlide.title?.trim() || "Device Preview"}
                              fill
                              sizes="120px"
                              className="object-contain drop-shadow-lg"
                            />
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-gray-800">Device Render Preview</span>
                            <p className="text-[11px] text-gray-500 mt-0.5">Device cutout will auto-center with ambient depth lighting.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Slide Title <span className="text-gray-400 font-normal">(Optional for Graphic Banners)</span>
                    </label>
                    <input
                      type="text"
                      value={editingSlide.title || ""}
                      onChange={(e) => setEditingSlide({ ...editingSlide, title: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Mac for Students (or leave blank)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Badge Tag <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={editingSlide.badge || ""}
                      onChange={(e) => setEditingSlide({ ...editingSlide, badge: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. SPECIAL OFFER"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Subtitle / Description <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={editingSlide.subtitle || ""}
                      onChange={(e) => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Get up to ₹10,000 off + Free AirPods"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Price / Offer Highlight <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={editingSlide.price || ""}
                      onChange={(e) => setEditingSlide({ ...editingSlide, price: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-blue-600"
                      placeholder="e.g. Starting from ₹89,900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Theme / Gradient Background
                    </label>
                    <select
                      value={editingSlide.bgGradient || GRADIENT_PRESETS[0].value}
                      onChange={(e) => {
                        const preset = GRADIENT_PRESETS.find((p) => p.value === e.target.value);
                        setEditingSlide({
                          ...editingSlide,
                          bgGradient: e.target.value,
                          accentColor: preset?.accent || "#0071e3",
                        });
                      }}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {GRADIENT_PRESETS.map((p) => (
                        <option key={p.name} value={p.value}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Banner Click / Button Link (URL)
                    </label>
                    <input
                      type="text"
                      value={editingSlide.ctaLink || ""}
                      onChange={(e) => setEditingSlide({ ...editingSlide, ctaLink: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-xs"
                      placeholder="e.g. /iphone or https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Button Label <span className="text-gray-400 font-normal">(Leave blank if whole banner is clickable)</span>
                    </label>
                    <input
                      type="text"
                      value={editingSlide.ctaText || ""}
                      onChange={(e) => setEditingSlide({ ...editingSlide, ctaText: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="e.g. Shop Now (or leave blank)"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="sticky bottom-0 z-20 bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSlide(null);
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
                  <span>{saving ? "Saving Slide..." : "Save Slide"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

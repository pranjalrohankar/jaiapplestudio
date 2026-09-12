"use client";

import { useEffect, useState, useRef } from "react";
import {
  productsToCSV,
  csvToProducts,
  generateSampleCSV,
  triggerCSVDownload,
  type CSVImportResult,
} from "@/lib/csv-helper";

interface Color {
  name: string;
  hex: string;
  image?: string;
}

interface Product {
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  category: string;
  price: string;
  oldPrice?: string;
  badge?: string;
  image?: string;
  colors?: Color[];
  highlights?: string[];
  [key: string]: any;
}

export default function ProductsManager() {
  const [data, setData] = useState<{ products: Product[]; categories: any[] } | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pinToTop, setPinToTop] = useState(false);

  // Bulk CSV Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<CSVImportResult | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (editing || showImportModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [editing, showImportModal]);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editing) setEditing(null);
        if (showImportModal) setShowImportModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editing, showImportModal]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleExportCSV = (onlyFiltered = false) => {
    if (!data?.products || data.products.length === 0) {
      alert("No products available to export.");
      return;
    }
    const targetList = onlyFiltered ? filteredProducts : data.products;
    if (targetList.length === 0) {
      alert("No matching products found to export.");
      return;
    }
    const csvText = productsToCSV(targetList as any);
    const dateStr = new Date().toISOString().split("T")[0];
    const filename = onlyFiltered
      ? `jai_apple_store_filtered_${dateStr}.csv`
      : `jai_apple_store_products_${dateStr}.csv`;
    triggerCSVDownload(filename, csvText);
    showToast(`✓ Exported ${targetList.length} products to CSV!`);
  };

  const handleDownloadTemplate = () => {
    const templateCsv = generateSampleCSV();
    triggerCSVDownload("apple_store_products_template.csv", templateCsv);
    showToast("✓ Downloaded sample CSV template");
  };

  const handleCSVFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processCSVFile(file);
  };

  const processCSVFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Please upload a valid .csv file.");
      return;
    }
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text || !text.trim()) {
        alert("The selected CSV file is empty.");
        return;
      }
      const result = csvToProducts(text, (data?.products || []) as any);
      setImportResult(result);
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleExecuteImport = async () => {
    if (!data || !importResult || importResult.products.length === 0) return;
    if (importResult.errors.length > 0) {
      alert("Please fix CSV format errors before importing.");
      return;
    }
    if (importMode === "replace" && !confirmReplace) {
      alert("Please check the confirmation box to confirm replacing the entire product catalog.");
      return;
    }

    setImporting(true);
    try {
      let finalProducts: Product[] = [];

      if (importMode === "replace") {
        finalProducts = importResult.products;
      } else {
        // Merge: Update existing matching by slug, append new
        const incomingMap = new Map(
          importResult.products.map((p) => [p.slug.toLowerCase(), p])
        );
        const updatedExisting = (data.products || []).map((existing) => {
          const match = incomingMap.get(existing.slug.toLowerCase());
          if (match) {
            incomingMap.delete(existing.slug.toLowerCase());
            return match;
          }
          return existing;
        });
        const brandNew = Array.from(incomingMap.values());
        finalProducts = [...brandNew, ...updatedExisting];
      }

      const newData = { ...data, products: finalProducts };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      });

      const resJson = await res.json();
      if (!res.ok || resJson.error) {
        throw new Error(resJson.error || "Failed to import products");
      }

      setData(newData);
      setShowImportModal(false);
      setImportFile(null);
      setImportResult(null);
      setConfirmReplace(false);

      showToast(
        `✓ Successfully imported ${importResult.products.length} products! (${importResult.newCount} new, ${importResult.updateCount} updated)`
      );
    } catch (err: any) {
      alert("Import failed: " + (err?.message || "Unknown error"));
    } finally {
      setImporting(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products?t=${Date.now()}`, {
        cache: "no-store",
        headers: { Pragma: "no-cache" },
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || `Failed to fetch products (HTTP ${res.status})`);
      }
      setData({
        products: Array.isArray(json.products) ? json.products : [],
        categories: Array.isArray(json.categories) ? json.categories : [],
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error || "Failed to upload image");
      }

      setEditing({ ...editing, image: resData.url });
      showToast("✓ Image uploaded successfully!");
    } catch (err: any) {
      alert("Image upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleQuickStatusChange = async (productSlug: string, newBadge: string) => {
    if (!data) return;

    const products = data.products || [];
    const target = products.find((p) => p.slug === productSlug);
    if (!target) return;

    const updatedProduct = {
      ...target,
      badge: newBadge,
      // If setting to Coming Soon and price was empty, set Coming Soon
      price: newBadge.toLowerCase().includes("coming soon") && (!target.price || target.price === "₹") ? "Coming Soon" : target.price,
    };

    const newProducts = products.map((p) => (p.slug === productSlug ? updatedProduct : p));
    const newData = { ...data, products: newProducts };
    setData(newData);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      });
      if (res.ok) {
        showToast(`✓ "${target.name}" status updated to ${newBadge || "In-Stock"}`);
      }
    } catch (err) {
      console.error("Quick status update error:", err);
    }
  };

  const handleMoveProduct = async (slug: string, direction: "top" | "up" | "down") => {
    if (!data) return;
    const products = [...(data.products || [])];
    const index = products.findIndex((p) => p.slug === slug);
    if (index === -1) return;

    const targetItem = products[index];

    if (direction === "top") {
      if (index === 0) {
        showToast(`"${targetItem.name}" is already at #1 Top position!`);
        return;
      }
      products.splice(index, 1);
      products.unshift(targetItem);
    } else if (direction === "up") {
      if (index === 0) {
        showToast(`"${targetItem.name}" is already at the top!`);
        return;
      }
      let swapIndex = index - 1;
      // If a category is filtered, swap with previous item in same category if available
      if (selectedCategory !== "all") {
        for (let i = index - 1; i >= 0; i--) {
          if (products[i].category?.toLowerCase() === selectedCategory.toLowerCase()) {
            swapIndex = i;
            break;
          }
        }
      }
      const temp = products[index];
      products[index] = products[swapIndex];
      products[swapIndex] = temp;
    } else if (direction === "down") {
      if (index === products.length - 1) {
        showToast(`"${targetItem.name}" is already at the bottom!`);
        return;
      }
      let swapIndex = index + 1;
      // If a category is filtered, swap with next item in same category if available
      if (selectedCategory !== "all") {
        for (let i = index + 1; i < products.length; i++) {
          if (products[i].category?.toLowerCase() === selectedCategory.toLowerCase()) {
            swapIndex = i;
            break;
          }
        }
      }
      const temp = products[index];
      products[index] = products[swapIndex];
      products[swapIndex] = temp;
    }

    const newData = { ...data, products };
    setData(newData);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      });
      if (res.ok) {
        showToast(
          direction === "top"
            ? `🔝 Moved "${targetItem.name}" to Top (#1 Priority)!`
            : `✓ Reordered "${targetItem.name}"`
        );
      }
    } catch (err) {
      console.error("Reorder failed:", err);
    }
  };

  const handleSave = async (e?: React.FormEvent, forcePinToTop = false) => {
    if (e) e.preventDefault();
    if (!data || !editing) return;

    setSaving(true);
    try {
      const cleanSlug = (editing.slug || editing.name || "")
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_]+/g, "-");

      const productToSave: Product = {
        ...editing,
        slug: cleanSlug || editing.slug,
        colors: Array.isArray(editing.colors) ? editing.colors : [],
        highlights: Array.isArray(editing.highlights) ? editing.highlights.filter((h) => h.trim() !== "") : [],
      };

      const products = data.products || [];
      let newProducts = [...products];
      const existingIndex = products.findIndex(
        (p) => p.slug === editing.slug || p.slug === cleanSlug
      );

      const shouldPin = forcePinToTop || pinToTop;

      if (existingIndex >= 0) {
        if (shouldPin) {
          newProducts.splice(existingIndex, 1);
          newProducts.unshift(productToSave);
        } else {
          newProducts[existingIndex] = productToSave;
        }
      } else {
        newProducts.unshift(productToSave);
      }

      const newData = { ...data, products: newProducts };

      // Fast local-first API save (< 15ms)
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      });

      const resJson = await res.json();
      if (!res.ok || resJson.error) {
        throw new Error(resJson.error || "Failed to save product");
      }

      setData(newData);
      setEditing(null);
      setPinToTop(false);
      showToast(
        shouldPin
          ? `✓ "${productToSave.name}" saved & placed at Top (#1 Priority)!`
          : `✓ "${productToSave.name}" saved successfully!`
      );
    } catch (err: any) {
      alert("Error saving: " + (err?.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!data) return;
    const target = data.products.find((p) => p.slug === slug);
    if (!confirm(`Are you sure you want to delete "${target?.name || slug}"?`)) return;

    try {
      const products = data.products || [];
      const newProducts = products.filter((p) => p.slug !== slug);
      const newData = { ...data, products: newProducts };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      });
      const resJson = await res.json();
      if (!res.ok || resJson.error) {
        throw new Error(resJson.error || "Failed to delete product");
      }

      setData(newData);
      showToast("✓ Product deleted");
    } catch (err: any) {
      alert("Error deleting: " + (err?.message || "Unknown error"));
    }
  };

  const handleDuplicate = (p: Product) => {
    const copy: Product = {
      ...p,
      name: `${p.name} (Copy)`,
      slug: `${p.slug}-copy`,
      badge: p.badge || "New",
    };
    setEditing(copy);
  };

  // Counts for status chips
  const totalCount = data?.products.length || 0;
  const comingSoonCount = (data?.products || []).filter(
    (p) =>
      p.badge?.toLowerCase().includes("coming soon") ||
      p.price?.toLowerCase().includes("coming soon")
  ).length;
  const preOrderCount = (data?.products || []).filter(
    (p) =>
      p.badge?.toLowerCase().includes("pre-order") ||
      p.badge?.toLowerCase().includes("preorder")
  ).length;
  const newLaunchCount = (data?.products || []).filter(
    (p) =>
      p.badge?.toLowerCase().includes("new") &&
      !p.badge?.toLowerCase().includes("coming soon") &&
      !p.badge?.toLowerCase().includes("pre-order")
  ).length;
  const inStockCount = (data?.products || []).filter(
    (p) =>
      !p.badge ||
      (!p.badge.toLowerCase().includes("coming soon") &&
        !p.badge.toLowerCase().includes("pre-order") &&
        !p.price?.toLowerCase().includes("coming soon"))
  ).length;

  // Filtered products list
  const filteredProducts = (data?.products || []).filter((p) => {
    const matchesCategory =
      selectedCategory === "all" ||
      p.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      !searchQuery.trim() ||
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.badge?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const b = (p.badge || "").toLowerCase();
    const pr = (p.price || "").toLowerCase();
    const isCS = b.includes("coming soon") || pr.includes("coming soon");
    const isPO = b.includes("pre-order") || b.includes("preorder");
    const isNL = b.includes("new") && !isCS && !isPO;
    const isStock = !isCS && !isPO;

    let matchesStatus = true;
    if (statusFilter === "coming-soon") matchesStatus = isCS;
    else if (statusFilter === "pre-order") matchesStatus = isPO;
    else if (statusFilter === "new") matchesStatus = isNL;
    else if (statusFilter === "in-stock") matchesStatus = isStock;

    return matchesCategory && matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 flex flex-col items-center justify-center text-gray-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-medium text-sm">Loading product catalog...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-red-50 border border-red-200 rounded-2xl shadow-sm">
        <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
          <span>⚠️</span> Unable to load products
        </h3>
        <p className="text-sm text-red-600 mt-2">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 bg-red-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-red-700 transition text-sm shadow-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950/90 text-emerald-100 border border-emerald-500/40 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-slideUp">
          <span className="text-emerald-400 font-bold">✔</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Products Catalog
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your store devices, pricing, images, Coming Soon alerts, and Pre-Order bookings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export CSV Button */}
          <button
            type="button"
            onClick={() => handleExportCSV(false)}
            className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 text-sm cursor-pointer"
            title={`Export all ${data.products.length} products to CSV`}
          >
            <span className="text-base">📥</span>
            <span>Export CSV</span>
            <span className="text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md font-mono">
              {data.products.length}
            </span>
          </button>

          {/* Import CSV Button */}
          <button
            type="button"
            onClick={() => {
              setImportFile(null);
              setImportResult(null);
              setImportMode("merge");
              setConfirmReplace(false);
              setShowImportModal(true);
            }}
            className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 font-semibold px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 text-sm cursor-pointer"
            title="Import or bulk update products from a CSV file"
          >
            <span className="text-base">📤</span>
            <span>Import CSV</span>
          </button>

          {/* Add Product Button */}
          <button
            onClick={() => {
              setPinToTop(true);
              setEditing({
                slug: "",
                name: "",
                category: selectedCategory !== "all" ? selectedCategory : data.categories?.[0]?.slug || "iphone",
                price: "₹",
                description: "",
                tagline: "",
                badge: "Pre-Order",
                highlights: [],
                colors: [],
              });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition flex items-center justify-center gap-2 shrink-0 cursor-pointer text-sm"
          >
            <span className="text-lg leading-none">+</span>
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3.5">
        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-1">Status:</span>
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
              statusFilter === "all"
                ? "bg-gray-900 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>All Devices</span>
            <span className="opacity-70 font-normal">({totalCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter("coming-soon")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
              statusFilter === "coming-soon"
                ? "bg-purple-700 text-white shadow-sm"
                : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60"
            }`}
          >
            <span>🟣 Coming Soon</span>
            <span className="opacity-80 font-semibold">({comingSoonCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter("pre-order")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
              statusFilter === "pre-order"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60"
            }`}
          >
            <span>🔵 Pre-Order</span>
            <span className="opacity-80 font-semibold">({preOrderCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter("new")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
              statusFilter === "new"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60"
            }`}
          >
            <span>⭐ New Launch</span>
            <span className="opacity-80 font-semibold">({newLaunchCount})</span>
          </button>

          <button
            onClick={() => setStatusFilter("in-stock")}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ${
              statusFilter === "in-stock"
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60"
            }`}
          >
            <span>🟢 In-Stock</span>
            <span className="opacity-80 font-semibold">({inStockCount})</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search products by name, slug, or badge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 hover:bg-white transition"
            />
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Product Count Pill */}
          <div className="text-xs text-gray-500 font-medium px-2 shrink-0 flex items-center gap-1">
            <span>Showing</span>
            <strong className="text-gray-900">{filteredProducts.length}</strong>
            <span>of {data.products.length} products</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 ${
              selectedCategory === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Categories
          </button>
          {data.categories.map((c) => {
            const count = data.products.filter(
              (p) => p.category?.toLowerCase() === c.slug?.toLowerCase()
            ).length;
            return (
              <button
                key={c.slug}
                onClick={() => setSelectedCategory(c.slug)}
                className={`px-3 py-1.5 rounded-lg font-medium transition shrink-0 capitalize ${
                  selectedCategory === c.slug
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Table (Always in place so scroll position is never lost) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500">
                <th className="py-3.5 px-3 text-center w-28">Order / Rank</th>
                <th className="py-3.5 px-4">Device</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Availability / Badge</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    No products match your criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const b = (p.badge || "").toLowerCase();
                  const isComingSoon = b.includes("coming soon") || p.price?.toLowerCase().includes("coming soon");
                  const isPreOrder = b.includes("pre-order") || b.includes("preorder");
                  const isNew = b.includes("new");

                  return (
                    <tr
                      key={p.slug}
                      className="hover:bg-blue-50/40 transition-colors group"
                    >
                      {/* Order / Reorder Priority Buttons */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200/90 rounded-xl p-1 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleMoveProduct(p.slug, "top")}
                            title="Move to Top (#1 Priority on Site)"
                            className="px-2 py-1 text-[11px] font-bold text-blue-600 bg-white hover:bg-blue-600 hover:text-white border border-blue-200/80 rounded-lg transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <span>🔝</span>
                            <span className="text-[10px] font-semibold">Top</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveProduct(p.slug, "up")}
                            title="Move Up in List"
                            className="p-1.5 text-xs text-gray-700 bg-white hover:bg-gray-200 border border-gray-200 rounded-lg transition cursor-pointer"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveProduct(p.slug, "down")}
                            title="Move Down in List"
                            className="p-1.5 text-xs text-gray-700 bg-white hover:bg-gray-200 border border-gray-200 rounded-lg transition cursor-pointer"
                          >
                            ▼
                          </button>
                        </div>
                      </td>

                      {/* Device Thumbnail + Name + Live link */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                className="object-contain max-h-full max-w-full"
                              />
                            ) : (
                              <span className="text-xl opacity-30">📱</span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {p.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-mono text-gray-400">
                                /{p.slug}
                              </span>
                              <a
                                href={`/product/${encodeURIComponent(p.slug)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded hover:bg-blue-100 transition inline-flex items-center gap-0.5"
                                title="Open live product page in new tab"
                              >
                                Live Page ↗
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-gray-600 capitalize font-medium">
                        <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-md">
                          {p.category}
                        </span>
                      </td>

                      {/* Badge & Quick Status Selector */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={
                              isComingSoon
                                ? "coming-soon"
                                : isPreOrder
                                ? "pre-order"
                                : isNew
                                ? "new"
                                : p.badge
                                ? "custom"
                                : "in-stock"
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "coming-soon") handleQuickStatusChange(p.slug, "Coming Soon");
                              else if (val === "pre-order") handleQuickStatusChange(p.slug, "Pre-Order");
                              else if (val === "new") handleQuickStatusChange(p.slug, "New");
                              else if (val === "in-stock") handleQuickStatusChange(p.slug, "");
                            }}
                            className={`rounded-full px-2.5 py-1 text-xs font-bold border cursor-pointer transition shadow-2xs outline-none ${
                              isComingSoon
                                ? "bg-purple-100 text-purple-800 border-purple-300"
                                : isPreOrder
                                ? "bg-blue-100 text-blue-800 border-blue-300"
                                : isNew
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : p.badge
                                ? "bg-gray-100 text-gray-800 border-gray-300"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            <option value="in-stock">🟢 In Stock</option>
                            <option value="coming-soon">🟣 Coming Soon</option>
                            <option value="pre-order">🔵 Pre-Order</option>
                            <option value="new">⭐ New Launch</option>
                            {p.badge && !isComingSoon && !isPreOrder && !isNew && (
                              <option value="custom">🏷️ {p.badge}</option>
                            )}
                          </select>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        <span
                          className={
                            isComingSoon
                              ? "text-purple-700 font-bold"
                              : isPreOrder
                              ? "text-blue-700 font-bold"
                              : "text-gray-900"
                          }
                        >
                          {p.price}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setPinToTop(false);
                              setEditing(p);
                            }}
                            className="bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-all shadow-2xs cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDuplicate(p)}
                            title="Duplicate this product"
                            className="text-gray-500 hover:text-gray-900 text-xs px-2 py-1 rounded hover:bg-gray-100 transition cursor-pointer"
                          >
                            Clone
                          </button>
                          <button
                            onClick={() => handleDelete(p.slug)}
                            className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL PRODUCT EDITOR (Fixed on screen — NO SCROLLING UP REQUIRED!) */}
      {/* ========================================================================= */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
          {/* Modal Container */}
          <div
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-100 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                  {editing.name ? "✏️" : "✨"}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">
                    {editing.name ? `Edit "${editing.name}"` : "Create New Product"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Product changes update in real-time across your live storefront.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditing(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center font-semibold text-sm transition cursor-pointer"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave}>
              <div className="p-6 space-y-6 max-h-[calc(85vh-140px)] overflow-y-auto">
                {/* 0. PIN TO TOP / STOREFRONT PRIORITY BANNER */}
                <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/90 rounded-2xl p-4 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔝</span>
                    <div>
                      <span className="text-xs font-bold text-blue-950 block">Pin / Feature at Top of Catalog (#1 Priority)</span>
                      <p className="text-[11px] text-blue-700">Display this product at the top of its category &amp; storefront lineup.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pinToTop}
                      onChange={(e) => setPinToTop(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* 1. AVAILABILITY & LAUNCH STATUS (Coming Soon / Pre-Order / In-Stock) */}
                <div className="space-y-3 bg-gradient-to-r from-purple-50/50 via-blue-50/50 to-emerald-50/50 p-4 sm:p-5 rounded-2xl border border-blue-100">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-800">
                      🚀 Product Availability &amp; Launch Status
                    </label>
                    <span className="text-[11px] text-gray-500">
                      Select how this device is marketed to customers
                    </span>
                  </div>

                  {/* 4 Status Choice Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* Coming Soon Card */}
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          badge: "Coming Soon",
                          price: !editing.price || editing.price === "₹" ? "Coming Soon" : editing.price,
                        })
                      }
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                        editing.badge?.toLowerCase().includes("coming soon")
                          ? "border-purple-600 bg-purple-100/60 ring-2 ring-purple-400 shadow-sm"
                          : "border-gray-200 bg-white hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">🟣</span>
                        <span className="font-extrabold text-xs text-purple-900">Coming Soon</span>
                      </div>
                      <p className="text-[10px] text-purple-700 mt-1">
                        Pulsing alert · Pre-Booking inquiry
                      </p>
                    </button>

                    {/* Pre-Order Card */}
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          badge: "Pre-Order",
                        })
                      }
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                        editing.badge?.toLowerCase().includes("pre-order") || editing.badge?.toLowerCase().includes("preorder")
                          ? "border-blue-600 bg-blue-100/60 ring-2 ring-blue-400 shadow-sm"
                          : "border-gray-200 bg-white hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">🔵</span>
                        <span className="font-extrabold text-xs text-blue-900">Pre-Order</span>
                      </div>
                      <p className="text-[10px] text-blue-700 mt-1">
                        Pre-Order checkout · Reserve device
                      </p>
                    </button>

                    {/* New Launch Card */}
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          badge: "New",
                        })
                      }
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                        editing.badge?.toLowerCase() === "new" || editing.badge?.toLowerCase().includes("new launch")
                          ? "border-amber-500 bg-amber-100/60 ring-2 ring-amber-400 shadow-sm"
                          : "border-gray-200 bg-white hover:border-amber-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">⭐</span>
                        <span className="font-extrabold text-xs text-amber-900">New Launch</span>
                      </div>
                      <p className="text-[10px] text-amber-700 mt-1">
                        Gold badge · Latest release
                      </p>
                    </button>

                    {/* In Stock Card */}
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          badge: "",
                        })
                      }
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                        !editing.badge
                          ? "border-emerald-600 bg-emerald-100/60 ring-2 ring-emerald-400 shadow-sm"
                          : "border-gray-200 bg-white hover:border-emerald-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">🟢</span>
                        <span className="font-extrabold text-xs text-emerald-900">In-Stock</span>
                      </div>
                      <p className="text-[10px] text-emerald-700 mt-1">
                        Regular Buy Now &amp; Cart flow
                      </p>
                    </button>
                  </div>

                  {/* Quick Preset Buttons Strip */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                    <span className="text-gray-500 font-semibold text-[11px]">Quick Badge Tags:</span>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, badge: "Coming Soon" })}
                      className="bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 px-2 py-0.5 rounded-lg text-[11px] font-bold"
                    >
                      🟣 Coming Soon
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, badge: "Pre-Order" })}
                      className="bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 px-2 py-0.5 rounded-lg text-[11px] font-bold"
                    >
                      🔵 Pre-Order
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, badge: "Pre-Bookings Open" })}
                      className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-2 py-0.5 rounded-lg text-[11px] font-bold"
                    >
                      🚀 Pre-Bookings Open
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, badge: "New" })}
                      className="bg-white border border-amber-200 text-amber-800 hover:bg-amber-50 px-2 py-0.5 rounded-lg text-[11px] font-bold"
                    >
                      ⭐ New
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, badge: "Popular" })}
                      className="bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded-lg text-[11px] font-bold"
                    >
                      🔥 Popular
                    </button>
                    {editing.badge && (
                      <button
                        type="button"
                        onClick={() => setEditing({ ...editing, badge: "" })}
                        className="text-gray-400 hover:text-red-500 text-[11px] px-1.5 py-0.5"
                      >
                        ✕ Clear Badge
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. Basic Details */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Product Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      value={editing.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        const autoSlug = newName
                          .trim()
                          .toLowerCase()
                          .replace(/[^\w\s-]/g, "")
                          .replace(/[\s_]+/g, "-");
                        setEditing({
                          ...editing,
                          name: newName,
                          slug:
                            !editing.slug || editing.slug === editing._prevAutoSlug
                              ? autoSlug
                              : editing.slug,
                          _prevAutoSlug: autoSlug,
                        });
                      }}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                      placeholder="e.g. iPhone 18 Pro Max"
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      URL Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      value={editing.slug}
                      onChange={(e) =>
                        setEditing({ ...editing, slug: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none bg-gray-50/50"
                      placeholder="e.g. iphone-18-pro-max"
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      Live link:{" "}
                      <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                        /product/{editing.slug || "your-slug"}
                      </code>
                    </p>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={editing.category}
                      onChange={(e) =>
                        setEditing({ ...editing, category: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none capitalize bg-white"
                    >
                      {data.categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name} ({c.slug})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Badge Text Input */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Custom Badge Text <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      value={editing.badge || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, badge: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                      placeholder="e.g. Coming Soon, Pre-Order, New"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      value={editing.price}
                      onChange={(e) =>
                        setEditing({ ...editing, price: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                      placeholder="e.g. ₹1,44,900 or Coming Soon"
                    />
                  </div>

                  {/* Old Price */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Original / Strike-through Price <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      value={editing.oldPrice || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, oldPrice: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                      placeholder="e.g. ₹1,59,900"
                    />
                  </div>

                  {/* Tagline */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Tagline / Subheading
                    </label>
                    <input
                      value={editing.tagline || ""}
                      onChange={(e) =>
                        setEditing({ ...editing, tagline: e.target.value })
                      }
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                      placeholder="e.g. The future of Apple Intelligence."
                    />
                  </div>
                </div>

                {/* 3. Image Manager & Aspect Ratio Guide */}
                <div className="space-y-3 bg-gray-50/80 p-4 sm:p-5 rounded-2xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-800">
                      Product Image / Cutout
                    </label>
                    {editing.image && (
                      <span className="text-[11px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-md">
                        ✓ Image Attached
                      </span>
                    )}
                  </div>

                  {/* Dimension Guide */}
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
                    <div className="font-bold text-blue-950 flex items-center gap-1.5">
                      <span>📐</span> Recommended Dimensions for Products:
                    </div>
                    <div className="grid sm:grid-cols-2 gap-1 text-[11px] text-blue-800">
                      <div>
                        • <strong>Aspect Ratio:</strong>{" "}
                        <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">1:1 (Square)</code>
                      </div>
                      <div>
                        • <strong>Canvas Size:</strong>{" "}
                        <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">600 x 600 px</code> or{" "}
                        <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">800 x 800 px</code>
                      </div>
                    </div>
                    <p className="text-[11px] text-blue-700">
                      💡 Transparent background PNG or clean white studio background looks best.
                    </p>
                  </div>

                  {/* Upload + URL input */}
                  <div className="grid sm:grid-cols-12 gap-3 items-center pt-1">
                    <div className="sm:col-span-7 space-y-2">
                      <div className="flex gap-2">
                        <input
                          value={editing.image || ""}
                          onChange={(e) =>
                            setEditing({ ...editing, image: e.target.value })
                          }
                          className="flex-1 border border-gray-300 rounded-xl px-3 py-2 font-mono text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          placeholder="/images/iphone-18-pro.png or https://..."
                        />
                        {editing.image && (
                          <button
                            type="button"
                            onClick={() => setEditing({ ...editing, image: "" })}
                            className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Remove image"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Upload Button */}
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="product-image-upload"
                        />
                        <label
                          htmlFor="product-image-upload"
                          className={`text-xs font-semibold px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer transition flex items-center gap-1.5 ${
                            uploadingImage ? "opacity-50 pointer-events-none" : ""
                          }`}
                        >
                          <span>📁</span>
                          <span>{uploadingImage ? "Uploading..." : "Upload from Device"}</span>
                        </label>
                        <span className="text-[11px] text-gray-400">PNG, JPG, WebP supported</span>
                      </div>
                    </div>

                    {/* Image Preview */}
                    <div className="sm:col-span-5 flex items-center gap-3">
                      <div className="relative h-20 w-20 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                        {editing.image ? (
                          <img
                            src={editing.image}
                            alt="Preview"
                            className="object-contain max-h-full max-w-full"
                          />
                        ) : (
                          <span className="text-2xl opacity-20">🖼️</span>
                        )}
                      </div>
                      <div className="text-xs">
                        <span className="font-bold text-gray-800 block">1:1 Preview Box</span>
                        <p className="text-[11px] text-gray-500">
                          {editing.image ? "Scales cleanly in catalog cards" : "No image attached yet"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Color Finishes & Swatches Manager */}
                <div className="space-y-3 bg-gray-50/70 p-4 sm:p-5 rounded-2xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-800">
                        Color Finishes & Swatches
                      </label>
                      <p className="text-[11px] text-gray-500">
                        Configure finishes and optional color-specific transparent cutout images.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          colors: [
                            ...(editing.colors || []),
                            { name: "New Finish", hex: "#111111", image: "" },
                          ],
                        })
                      }
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      + Add Finish
                    </button>
                  </div>

                  {(!editing.colors || editing.colors.length === 0) ? (
                    <p className="text-xs text-gray-400 italic">No color finishes configured.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {editing.colors.map((c: Color, idx: number) => (
                        <div
                          key={idx}
                          className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-white p-2.5 rounded-xl border border-gray-200 shadow-xs"
                        >
                          {/* Color Picker & Hex */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="color"
                              value={c.hex.startsWith("#") && c.hex.length === 7 ? c.hex : "#000000"}
                              onChange={(e) => {
                                const next = [...(editing.colors || [])];
                                next[idx] = { ...next[idx], hex: e.target.value };
                                setEditing({ ...editing, colors: next });
                              }}
                              className="h-7 w-7 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                            />
                            <input
                              type="text"
                              value={c.hex}
                              onChange={(e) => {
                                const next = [...(editing.colors || [])];
                                next[idx] = { ...next[idx], hex: e.target.value };
                                setEditing({ ...editing, colors: next });
                              }}
                              className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-xs font-mono"
                              placeholder="#111111"
                            />
                          </div>

                          {/* Color Name */}
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => {
                              const next = [...(editing.colors || [])];
                              next[idx] = { ...next[idx], name: e.target.value };
                              setEditing({ ...editing, colors: next });
                            }}
                            className="w-32 border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-medium"
                            placeholder="Finish name"
                          />

                          {/* Color-specific Image URL */}
                          <input
                            type="text"
                            value={c.image || ""}
                            onChange={(e) => {
                              const next = [...(editing.colors || [])];
                              next[idx] = { ...next[idx], image: e.target.value };
                              setEditing({ ...editing, colors: next });
                            }}
                            className="flex-1 border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-mono"
                            placeholder="Color cutout image URL (optional)"
                          />

                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...(editing.colors || [])];
                              next.splice(idx, 1);
                              setEditing({ ...editing, colors: next });
                            }}
                            className="text-red-500 hover:text-red-700 text-xs px-2 py-1 cursor-pointer"
                            title="Remove color"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Highlights & Key Features */}
                <div className="space-y-2 bg-gray-50/50 p-4 rounded-2xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Key Highlights & Specs
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditing({
                          ...editing,
                          highlights: [...(editing.highlights || []), ""],
                        })
                      }
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      + Add Bullet
                    </button>
                  </div>
                  {(!editing.highlights || editing.highlights.length === 0) ? (
                    <p className="text-xs text-gray-400 italic">No highlights added yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {editing.highlights.map((h: string, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="text-xs text-gray-400 font-mono">#{idx + 1}</span>
                          <input
                            value={h}
                            onChange={(e) => {
                              const next = [...(editing.highlights || [])];
                              next[idx] = e.target.value;
                              setEditing({ ...editing, highlights: next });
                            }}
                            className="flex-1 border border-gray-300 rounded-xl px-3 py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="e.g. Next-generation A20 Pro Bionic processor"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const next = [...(editing.highlights || [])];
                              next.splice(idx, 1);
                              setEditing({ ...editing, highlights: next });
                            }}
                            className="text-red-500 hover:text-red-700 text-xs px-2 cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Description */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={editing.description || ""}
                    onChange={(e) =>
                      setEditing({ ...editing, description: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none leading-relaxed"
                    rows={3}
                    placeholder="Provide a detailed overview of the product for the product detail page..."
                  />
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="sticky bottom-0 z-20 bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSave(undefined, true)}
                    className="px-4 py-2.5 rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Save changes and immediately pin to #1 Top position"
                  >
                    <span>🔝</span>
                    <span>Save &amp; Move to Top</span>
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gray-950 hover:bg-black text-white font-semibold text-sm shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {saving && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{saving ? "Saving Changes..." : "Save Product"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK CSV IMPORT MODAL */}
      {showImportModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-fadeIn"
          onClick={() => {
            if (!importing) setShowImportModal(false);
          }}
        >
          <div
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-950 px-6 sm:px-8 py-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span>📤</span> Bulk Products Import (CSV)
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  Upload a standard CSV file to batch create or update multiple Apple devices in seconds.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                disabled={importing}
                className="text-gray-400 hover:text-white text-2xl font-light w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
              {/* Template & Guidelines Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1 text-xs text-blue-900">
                  <div className="font-bold text-blue-950 flex items-center gap-1.5 text-sm">
                    <span>💡</span> Need the CSV Format?
                  </div>
                  <p className="text-blue-800">
                    Download our sample template with pre-filled columns for slug, name, category, price, finishes, highlights, and status.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition shadow-xs shrink-0 cursor-pointer"
                >
                  <span>📥</span>
                  <span>Download Sample Template</span>
                </button>
              </div>

              {/* File Dropzone / Selector */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) processCSVFile(file);
                }}
                className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
                  dragOver
                    ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
                    : importFile
                    ? "border-emerald-400 bg-emerald-50/30"
                    : "border-gray-300 hover:border-gray-400 bg-gray-50/50"
                }`}
              >
                <input
                  type="file"
                  ref={csvFileInputRef}
                  accept=".csv,text/csv"
                  onChange={handleCSVFileSelect}
                  className="hidden"
                  id="csv-file-upload"
                />

                {importFile ? (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 text-xl font-bold mx-auto flex items-center justify-center">
                      ✓
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{importFile.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(importFile.size / 1024).toFixed(1)} KB · CSV File
                      </p>
                    </div>
                    <label
                      htmlFor="csv-file-upload"
                      className="inline-block text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                    >
                      Choose a different file
                    </label>
                  </div>
                ) : (
                  <label htmlFor="csv-file-upload" className="cursor-pointer block space-y-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 text-2xl mx-auto flex items-center justify-center">
                      📄
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Click to upload or drag and drop your CSV file
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Supports standard UTF-8 CSV exports from Excel, Numbers, and Google Sheets
                      </p>
                    </div>
                    <span className="inline-block px-4 py-2 rounded-xl bg-gray-900 text-white font-semibold text-xs hover:bg-black transition shadow-xs">
                      Browse File
                    </span>
                  </label>
                )}
              </div>

              {/* Errors Display if any */}
              {importResult && importResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-900 space-y-2">
                  <div className="font-bold text-red-950 flex items-center gap-1.5">
                    <span>⚠️</span> CSV Format Errors
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Parsed Summary & Options */}
              {importResult && importResult.products.length > 0 && (
                <div className="space-y-5">
                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-center">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
                        Total Parsed
                      </span>
                      <span className="text-2xl font-extrabold text-gray-900">
                        {importResult.products.length}
                      </span>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-center">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
                        New Products
                      </span>
                      <span className="text-2xl font-extrabold text-emerald-800">
                        +{importResult.newCount}
                      </span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-center">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 block">
                        To Update
                      </span>
                      <span className="text-2xl font-extrabold text-blue-800">
                        {importResult.updateCount}
                      </span>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-center">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
                        Warnings
                      </span>
                      <span className="text-2xl font-extrabold text-amber-800">
                        {importResult.warnings.length}
                      </span>
                    </div>
                  </div>

                  {/* Import Mode Selector */}
                  <div className="bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-200 space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-800">
                      Import Strategy
                    </label>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                          importMode === "merge"
                            ? "bg-white border-blue-600 ring-2 ring-blue-500/20 shadow-xs"
                            : "bg-white/60 border-gray-200 hover:bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          value="merge"
                          checked={importMode === "merge"}
                          onChange={() => setImportMode("merge")}
                          className="mt-1 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-gray-900 block">
                            Merge & Update (Recommended)
                          </span>
                          <span className="text-gray-500">
                            Updates existing matching products by slug and appends new ones. Other catalog items are preserved.
                          </span>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                          importMode === "replace"
                            ? "bg-red-50/50 border-red-500 ring-2 ring-red-500/20 shadow-xs"
                            : "bg-white/60 border-gray-200 hover:bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === "replace"}
                          onChange={() => setImportMode("replace")}
                          className="mt-1 text-red-600 focus:ring-red-500"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-red-900 block">
                            Replace Entire Catalog
                          </span>
                          <span className="text-gray-500">
                            Overwrites your full products list with the contents of this CSV. Use with caution.
                          </span>
                        </div>
                      </label>
                    </div>

                    {importMode === "replace" && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-900">
                        <input
                          type="checkbox"
                          id="confirm-replace"
                          checked={confirmReplace}
                          onChange={(e) => setConfirmReplace(e.target.checked)}
                          className="mt-0.5 rounded border-red-300 text-red-600 focus:ring-red-500 cursor-pointer"
                        />
                        <label htmlFor="confirm-replace" className="font-medium cursor-pointer">
                          I understand that this will replace all existing products in the store with the rows from this CSV file.
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Preview Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                        Preview Parsed Rows ({importResult.products.length})
                      </span>
                    </div>

                    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs max-h-64 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 border-b border-gray-200 z-10">
                          <tr>
                            <th className="px-3 py-2.5">Status</th>
                            <th className="px-3 py-2.5">Name</th>
                            <th className="px-3 py-2.5">Category</th>
                            <th className="px-3 py-2.5">Price</th>
                            <th className="px-3 py-2.5">Badge</th>
                            <th className="px-3 py-2.5">Colors</th>
                            <th className="px-3 py-2.5">Highlights</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {importResult.products.slice(0, 50).map((p, idx) => {
                            const isExisting = (data.products || []).some(
                              (ep) => ep.slug === p.slug
                            );
                            return (
                              <tr key={idx} className="hover:bg-gray-50/70">
                                <td className="px-3 py-2">
                                  {isExisting ? (
                                    <span className="inline-block px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                                      UPDATE
                                    </span>
                                  ) : (
                                    <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                      NEW
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 font-medium text-gray-900">
                                  <div>{p.name}</div>
                                  <div className="text-[10px] text-gray-400 font-mono">{p.slug}</div>
                                </td>
                                <td className="px-3 py-2 capitalize text-gray-600">{p.category}</td>
                                <td className="px-3 py-2 font-bold text-gray-900">{p.price}</td>
                                <td className="px-3 py-2">
                                  {p.badge ? (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700 font-semibold">
                                      {p.badge}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {p.colors && p.colors.length > 0 ? (
                                    <div className="flex items-center gap-1">
                                      {p.colors.slice(0, 4).map((c, i) => (
                                        <span
                                          key={i}
                                          title={c.name}
                                          className="h-2.5 w-2.5 rounded-full ring-1 ring-black/20"
                                          style={{ backgroundColor: c.hex }}
                                        />
                                      ))}
                                      {p.colors.length > 4 && (
                                        <span className="text-[10px] text-gray-400">
                                          +{p.colors.length - 4}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-300">0</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-gray-500">
                                  {p.highlights?.length || 0} bullets
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 sm:px-8 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
              <div className="text-xs text-gray-500">
                {importResult && (
                  <span>
                    Ready to import <strong>{importResult.products.length}</strong> items into Jai Apple Store.
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  disabled={importing}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={
                    importing ||
                    !importResult ||
                    importResult.products.length === 0 ||
                    importResult.errors.length > 0 ||
                    (importMode === "replace" && !confirmReplace)
                  }
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {importing && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>
                    {importing
                      ? "Importing Products..."
                      : `Confirm & Import ${importResult ? `(${importResult.products.length})` : ""}`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

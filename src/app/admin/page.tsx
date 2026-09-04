"use client";

import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [data, setData] = useState<{ products?: any[]; categories?: any[]; error?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/products");
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || `Failed to fetch products (HTTP ${res.status})`);
      }
      setData(json);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-red-50 border border-red-200 rounded-xl">
        <h3 className="text-lg font-bold text-red-700">Unable to load dashboard</h3>
        <p className="text-sm text-red-600 mt-1">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  const productsCount = data?.products?.length ?? 0;
  const categoriesCount = data?.categories?.length ?? 0;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-8">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Products</h3>
          <p className="text-5xl font-bold text-blue-600">{productsCount}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Categories</h3>
          <p className="text-5xl font-bold text-purple-600">{categoriesCount}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Launch Banner</h3>
          <p className="text-lg font-bold text-emerald-600 flex items-center gap-2 mt-4">
            <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
            iPhone 18 Active
          </p>
        </div>
      </div>

      <div className="mt-10 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <a href="/admin/products" className="bg-black text-white px-5 py-2.5 rounded-full font-medium hover:bg-gray-800 transition">
            Manage Products
          </a>
          <a href="/admin/banners" className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-blue-700 transition">
            Manage Banners & Announcement
          </a>
          <a href="/" target="_blank" className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-full font-medium hover:bg-gray-50 transition">
            View Live Store &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [data, setData] = useState<{ products: any[]; categories: any[] } | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  if (!data) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-8">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Products</h3>
          <p className="text-5xl font-bold text-blue-600">{data.products.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Categories</h3>
          <p className="text-5xl font-bold text-purple-600">{data.categories.length}</p>
        </div>
      </div>

      <div className="mt-10 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        <div className="flex gap-4">
          <a href="/admin/products" className="bg-black text-white px-5 py-2.5 rounded-full font-medium hover:bg-gray-800 transition">
            Manage Products
          </a>
        </div>
      </div>
    </div>
  );
}

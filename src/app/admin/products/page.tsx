"use client";

import { useEffect, useState } from "react";

type Product = any; // We'll keep it loose for this prototype

export default function ProductsManager() {
  const [data, setData] = useState<{ products: Product[]; categories: any[] } | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      setData({
        products: Array.isArray(json.products) ? json.products : [],
        categories: Array.isArray(json.categories) ? json.categories : []
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !editing) return;

    setSaving(true);
    try {
      const products = data.products || [];
      let newProducts = [...products];
      const isNew = !products.find((p: any) => p.slug === editing.slug);
      
      if (isNew) {
        newProducts.push(editing);
      } else {
        newProducts = newProducts.map((p: any) => p.slug === editing.slug ? editing : p);
      }

      const newData = { ...data, products: newProducts };
      
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData)
      });
      const resJson = await res.json();
      if (!res.ok || resJson.error) {
        throw new Error(resJson.error || "Failed to save product");
      }

      setData(newData);
      setEditing(null);
    } catch (err: any) {
      alert("Error saving: " + (err?.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!data || !confirm("Are you sure?")) return;
    
    try {
      const products = data.products || [];
      const newProducts = products.filter((p: any) => p.slug !== slug);
      const newData = { ...data, products: newProducts };
      
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData)
      });
      const resJson = await res.json();
      if (!res.ok || resJson.error) {
        throw new Error(resJson.error || "Failed to delete product");
      }

      setData(newData);
    } catch (err: any) {
      alert("Error deleting: " + (err?.message || "Unknown error"));
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading products...</div>;

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-red-50 border border-red-200 rounded-xl">
        <h3 className="text-lg font-bold text-red-700">Unable to load products</h3>
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

  if (!data) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Products Manager</h2>
        <button 
          onClick={() => setEditing({ slug: "", name: "", category: "iphone", price: "", description: "", tagline: "", highlights: [], colors: [] })}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + Add Product
        </button>
      </div>

      {editing ? (
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100 mb-8">
          <h3 className="text-xl font-bold mb-4">{editing.name ? "Edit Product" : "New Product"}</h3>
          <form onSubmit={handleSave} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input required value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} className="w-full border p-2 rounded" placeholder="e.g. iPhone 18 Pro" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug (URL)</label>
              <input required value={editing.slug} onChange={e => setEditing({...editing, slug: e.target.value})} className="w-full border p-2 rounded" placeholder="e.g. iphone-18-pro" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select required value={editing.category} onChange={e => setEditing({...editing, category: e.target.value})} className="w-full border p-2 rounded">
                {data.categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price (e.g. ₹79,900 or Coming Soon)</label>
              <input required value={editing.price} onChange={e => setEditing({...editing, price: e.target.value})} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Badge (e.g. Coming Soon, New, Popular)</label>
              <input value={editing.badge || ""} onChange={e => setEditing({...editing, badge: e.target.value})} className="w-full border p-2 rounded" placeholder="Coming Soon" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tagline</label>
              <input value={editing.tagline || ""} onChange={e => setEditing({...editing, tagline: e.target.value})} className="w-full border p-2 rounded" placeholder="The future of Apple Intelligence." />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <input value={editing.image || ""} onChange={e => setEditing({...editing, image: e.target.value})} className="w-full border p-2 rounded font-mono text-xs" placeholder="/images/iphone-18-pro.jpg" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={editing.description} onChange={e => setEditing({...editing, description: e.target.value})} className="w-full border p-2 rounded" rows={3} />
            </div>
            <div className="col-span-2 flex gap-4 mt-4">
              <button type="submit" disabled={saving} className="bg-black text-white px-6 py-2 rounded font-medium disabled:opacity-50">
                {saving ? "Saving..." : "Save Product"}
              </button>
              <button type="button" onClick={() => setEditing(null)} className="text-gray-600 px-6 py-2 rounded border border-gray-300">Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600">Name</th>
                <th className="p-4 font-semibold text-gray-600">Category</th>
                <th className="p-4 font-semibold text-gray-600">Badge</th>
                <th className="p-4 font-semibold text-gray-600">Price</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map(p => (
                <tr key={p.slug} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4 text-gray-500 capitalize">{p.category}</td>
                  <td className="p-4">
                    {p.badge ? (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        p.badge.toLowerCase().includes("coming soon")
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {p.badge}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="p-4 font-medium">{p.price}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => setEditing(p)} className="text-blue-600 hover:underline mr-4">Edit</button>
                    <button onClick={() => handleDelete(p.slug)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

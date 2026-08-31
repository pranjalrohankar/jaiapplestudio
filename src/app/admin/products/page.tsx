"use client";

import { useEffect, useState } from "react";

type Product = any; // We'll keep it loose for this prototype

export default function ProductsManager() {
  const [data, setData] = useState<{ products: Product[]; categories: any[] } | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const res = await fetch("/api/products");
    const json = await res.json();
    setData(json);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data || !editing) return;

    let newProducts = [...data.products];
    const isNew = !data.products.find(p => p.slug === editing.slug);
    
    if (isNew) {
      newProducts.push(editing);
    } else {
      newProducts = newProducts.map(p => p.slug === editing.slug ? editing : p);
    }

    const newData = { ...data, products: newProducts };
    
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newData)
    });

    setData(newData);
    setEditing(null);
  };

  const handleDelete = async (slug: string) => {
    if (!data || !confirm("Are you sure?")) return;
    
    const newProducts = data.products.filter(p => p.slug !== slug);
    const newData = { ...data, products: newProducts };
    
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newData)
    });

    setData(newData);
  };

  if (!data) return <div className="p-8">Loading products...</div>;

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
              <input required value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug (URL)</label>
              <input required value={editing.slug} onChange={e => setEditing({...editing, slug: e.target.value})} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select required value={editing.category} onChange={e => setEditing({...editing, category: e.target.value})} className="w-full border p-2 rounded">
                {data.categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price (e.g. ₹79,900)</label>
              <input required value={editing.price} onChange={e => setEditing({...editing, price: e.target.value})} className="w-full border p-2 rounded" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Image URL</label>
              <input value={editing.image || ""} onChange={e => setEditing({...editing, image: e.target.value})} className="w-full border p-2 rounded" placeholder="https://example.com/image.jpg" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={editing.description} onChange={e => setEditing({...editing, description: e.target.value})} className="w-full border p-2 rounded" />
            </div>
            <div className="col-span-2 flex gap-4 mt-4">
              <button type="submit" className="bg-black text-white px-6 py-2 rounded font-medium">Save Product</button>
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
                <th className="p-4 font-semibold text-gray-600">Price</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map(p => (
                <tr key={p.slug} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4 text-gray-500 capitalize">{p.category}</td>
                  <td className="p-4">{p.price}</td>
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

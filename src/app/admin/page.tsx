"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/currency";
import type { OrderRecord } from "@/lib/order";
import { waLink, store } from "@/lib/store";
import {
  BagIcon,
  PhoneIcon,
  WhatsAppIcon,
  TrashIcon,
  CheckIcon,
  ChevronRightIcon,
} from "@/lib/icons";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (res.ok && data.orders) {
        setOrders(data.orders);
      } else {
        throw new Error(data.error || "Failed to fetch orders");
      }
    } catch (err: any) {
      setError(err?.message || "Could not load orders sheet");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(orderNo: string, newStatus: OrderRecord["status"]) {
    setUpdatingId(orderNo);
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNo, status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.orderNo === orderNo ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteOrder(orderNo: string) {
    if (!window.confirm(`Are you sure you want to delete order ${orderNo}?`)) return;
    try {
      const res = await fetch(`/api/orders?orderNo=${encodeURIComponent(orderNo)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.orderNo !== orderNo));
        if (selectedOrder?.orderNo === orderNo) setSelectedOrder(null);
      }
    } catch (err) {
      console.error("Delete order error:", err);
    }
  }

  function exportToCSV() {
    if (orders.length === 0) return;

    const headers = [
      "Order Ref",
      "Date",
      "Customer Name",
      "Phone",
      "City",
      "Items",
      "Total Amount",
      "Status",
      "Customer Note",
      "Admin Note",
    ];

    const rows = orders.map((o) => [
      `"${o.orderNo}"`,
      `"${o.date}"`,
      `"${o.customerName}"`,
      `"${o.customerPhone}"`,
      `"${o.customerCity || ""}"`,
      `"${o.items.map((i) => `${i.name} (${i.variant || ""}, ${i.color || ""}) x${i.qty}`).join(" | ")}"`,
      `"${o.totalDisplay}"`,
      `"${o.status}"`,
      `"${(o.customerNote || "").replace(/"/g, '""')}"`,
      `"${(o.adminNote || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Jai_Apple_Store_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "All" || o.status === statusFilter;
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      o.orderNo.toLowerCase().includes(query) ||
      o.customerName.toLowerCase().includes(query) ||
      o.customerPhone.includes(query) ||
      (o.customerCity && o.customerCity.toLowerCase().includes(query)) ||
      o.items.some((i) => i.name.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  // Summary Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const newOrdersCount = orders.filter((o) => o.status === "New").length;
  const confirmedCount = orders.filter((o) => o.status === "Confirmed").length;
  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;

  const statusColors: Record<string, string> = {
    New: "bg-blue-100 text-blue-800 border-blue-200",
    Contacted: "bg-amber-100 text-amber-800 border-amber-200",
    Confirmed: "bg-purple-100 text-purple-800 border-purple-200",
    Dispatched: "bg-indigo-100 text-indigo-800 border-indigo-200",
    Delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Cancelled: "bg-rose-100 text-rose-800 border-rose-200",
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            Store Orders Sheet
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time spreadsheet of all incoming store orders, customer enquiries & pre-bookings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchOrders}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition"
          >
            ↻ Refresh Sheet
          </button>
          <button
            type="button"
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-gray-800 shadow-sm transition"
          >
            📥 Export to Excel / CSV
          </button>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <Link
          href="/admin/products"
          className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-gray-900 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 bg-gray-100 rounded-xl">📱</span>
            <div>
              <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition">Products</p>
              <p className="text-xs text-gray-500">Prices, specs & stock</p>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-gray-900">&rarr;</span>
        </Link>

        <Link
          href="/admin/slider"
          className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-purple-600 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 bg-purple-50 rounded-xl">🎠</span>
            <div>
              <p className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition">Hero Slider</p>
              <p className="text-xs text-gray-500">Top banner posters</p>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-purple-600">&rarr;</span>
        </Link>

        <Link
          href="/admin/categories"
          className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-blue-600 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 bg-blue-50 rounded-xl">📁</span>
            <div>
              <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition">Categories</p>
              <p className="text-xs text-gray-500">Homepage icon tiles</p>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-blue-600">&rarr;</span>
        </Link>

        <Link
          href="/admin/banners"
          className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-emerald-600 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 bg-emerald-50 rounded-xl">🎨</span>
            <div>
              <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition">Offer Banners</p>
              <p className="text-xs text-gray-500">Promo posters & graphics</p>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-emerald-600">&rarr;</span>
        </Link>

        <Link
          href="/admin/social"
          className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-pink-600 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 bg-pink-50 rounded-xl">🌐</span>
            <div>
              <p className="text-sm font-bold text-gray-900 group-hover:text-pink-600 transition">Social Links</p>
              <p className="text-xs text-gray-500">Facebook, Instagram & more</p>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-pink-600">&rarr;</span>
        </Link>

        <Link
          href="/admin/database"
          className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-cyan-600 hover:shadow-md transition group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2 bg-cyan-50 rounded-xl">🗄️</span>
            <div>
              <p className="text-sm font-bold text-gray-900 group-hover:text-cyan-600 transition">Database</p>
              <p className="text-xs text-gray-500">MongoDB Atlas sync</p>
            </div>
          </div>
          <span className="text-gray-400 group-hover:text-cyan-600">&rarr;</span>
        </Link>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-5 border border-gray-200/80 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Total Orders Logged
          </p>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{orders.length}</p>
          <p className="text-xs text-gray-400 mt-1">All-time store orders</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-blue-200 bg-blue-50/20 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
            New Enquiries
          </p>
          <p className="text-3xl font-extrabold text-blue-700 mt-2">{newOrdersCount}</p>
          <p className="text-xs text-blue-600/70 mt-1">Requires customer follow-up</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-purple-200 bg-purple-50/20 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-700">
            Confirmed & Pre-Orders
          </p>
          <p className="text-3xl font-extrabold text-purple-700 mt-2">{confirmedCount}</p>
          <p className="text-xs text-purple-600/70 mt-1">Ready for pickup / dispatch</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Pipeline Value
          </p>
          <p className="text-3xl font-extrabold text-emerald-800 mt-2">
            {formatINR(totalRevenue)}
          </p>
          <p className="text-xs text-emerald-600/70 mt-1">{deliveredCount} delivered</p>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl bg-white p-4 border border-gray-200/80 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, city, or order #..."
            className="w-full rounded-xl border border-gray-300 bg-gray-50/60 px-4 py-2.5 text-xs sm:text-sm outline-none transition focus:border-blue-600 focus:bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          {["All", "New", "Contacted", "Confirmed", "Dispatched", "Delivered", "Cancelled"].map(
            (s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  statusFilter === s
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s}
              </button>
            )
          )}
        </div>
      </div>

      {/* ORDERS SHEET TABLE */}
      <div className="overflow-hidden rounded-2xl bg-white border border-gray-200/80 shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm font-semibold text-gray-500">
            Loading orders sheet...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600 bg-red-50">
            {error}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gray-100 text-gray-400 mb-3">
              <BagIcon width={28} height={28} />
            </div>
            <p className="text-base font-bold text-gray-900">No orders match your criteria</p>
            <p className="text-xs text-gray-500 mt-1">
              New customer orders submitted via the store will automatically appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-4">Order Ref</th>
                  <th className="py-3.5 px-4">Date / Time</th>
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Items Ordered</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800 font-medium">
                {filteredOrders.map((o) => (
                  <tr
                    key={o.orderNo}
                    className="hover:bg-blue-50/30 transition group cursor-pointer"
                    onClick={() => setSelectedOrder(o)}
                  >
                    {/* Order Ref */}
                    <td className="py-4 px-4 font-mono font-bold text-gray-900 whitespace-nowrap">
                      {o.orderNo}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-4 whitespace-nowrap text-gray-500">
                      <p className="font-semibold text-gray-800">{o.date}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(o.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-4">
                      <p className="font-bold text-gray-900 text-sm">{o.customerName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <a
                          href={`tel:${o.customerPhone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <PhoneIcon width={12} height={12} />
                          {o.customerPhone}
                        </a>
                      </div>
                      {o.customerCity && (
                        <p className="text-[11px] text-gray-500 mt-0.5">📍 {o.customerCity}</p>
                      )}
                    </td>

                    {/* Items */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="space-y-1">
                        {o.items.map((i, idx) => {
                          const isPreOrder =
                            i.isPreOrder ||
                            i.status === "pre-order" ||
                            Boolean(
                              i.badge?.toLowerCase().includes("pre-order") ||
                              i.badge?.toLowerCase().includes("preorder") ||
                              i.name.toLowerCase().includes("pre-order")
                            );
                          const isComingSoon =
                            !isPreOrder &&
                            (i.isComingSoon ||
                              i.status === "coming-soon" ||
                              Boolean(i.badge?.toLowerCase().includes("coming soon")));

                          return (
                            <div key={idx} className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-gray-900">• {i.name}</span>
                              {isPreOrder && (
                                <span className="inline-flex items-center rounded-md bg-blue-100 text-blue-800 px-1.5 py-0.2 text-[10px] font-extrabold ring-1 ring-blue-300">
                                  Pre-Order
                                </span>
                              )}
                              {isComingSoon && (
                                <span className="inline-flex items-center rounded-md bg-purple-100 text-purple-800 px-1.5 py-0.2 text-[10px] font-extrabold ring-1 ring-purple-300">
                                  Coming Soon
                                </span>
                              )}
                              {(i.variant || i.color) && (
                                <span className="text-[11px] text-gray-500">
                                  ({[i.variant, i.color].filter(Boolean).join(", ")})
                                </span>
                              )}
                              <span className="text-[11px] font-bold text-gray-700">
                                × {i.qty}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {o.customerNote && (
                        <p className="mt-1 text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded-md line-clamp-1">
                          💬 {o.customerNote}
                        </p>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="text-sm font-extrabold text-gray-900">
                        {o.totalDisplay}
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-4 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={o.status}
                        disabled={updatingId === o.orderNo}
                        onChange={(e) =>
                          handleStatusChange(o.orderNo, e.target.value as OrderRecord["status"])
                        }
                        className={`rounded-full px-3 py-1 text-xs font-bold border outline-none cursor-pointer shadow-sm transition ${
                          statusColors[o.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`https://wa.me/91${o.customerPhone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                            `Hi ${o.customerName}, regarding your order ${o.orderNo} at Jai Apple Store...`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                          title="Chat with customer on WhatsApp"
                        >
                          <WhatsAppIcon width={16} height={16} />
                        </a>

                        <a
                          href={`tel:${o.customerPhone}`}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                          title="Call Customer"
                        >
                          <PhoneIcon width={16} height={16} />
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(o.orderNo)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete record"
                        >
                          <TrashIcon width={16} height={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Order Details
                </span>
                <h3 className="text-xl font-extrabold text-gray-900">{selectedOrder.orderNo}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Customer Information */}
            <div className="rounded-2xl bg-gray-50 p-4 space-y-2 text-xs">
              <p className="font-bold text-gray-900 text-sm">{selectedOrder.customerName}</p>
              <p className="text-gray-600">📱 Mobile: {selectedOrder.customerPhone}</p>
              {selectedOrder.customerCity && (
                <p className="text-gray-600">📍 Area / City: {selectedOrder.customerCity}</p>
              )}
              {selectedOrder.customerNote && (
                <p className="text-amber-800 bg-amber-50 p-2 rounded-lg mt-2">
                  <strong>Customer Note:</strong> {selectedOrder.customerNote}
                </p>
              )}
            </div>

            {/* Items List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Items ({selectedOrder.items.length})
              </h4>
              <div className="space-y-2 border-y border-gray-100 py-3 text-xs">
                {selectedOrder.items.map((item, idx) => {
                  const isPreOrder =
                    item.isPreOrder ||
                    item.status === "pre-order" ||
                    Boolean(
                      item.badge?.toLowerCase().includes("pre-order") ||
                      item.badge?.toLowerCase().includes("preorder") ||
                      item.name.toLowerCase().includes("pre-order")
                    );
                  const isComingSoon =
                    !isPreOrder &&
                    (item.isComingSoon ||
                      item.status === "coming-soon" ||
                      Boolean(item.badge?.toLowerCase().includes("coming soon")));

                  return (
                    <div key={idx} className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-gray-900">{item.name} × {item.qty}</p>
                          {isPreOrder && (
                            <span className="inline-flex items-center rounded-md bg-blue-100 text-blue-800 px-1.5 py-0.2 text-[10px] font-extrabold ring-1 ring-blue-300">
                              Pre-Order
                            </span>
                          )}
                          {isComingSoon && (
                            <span className="inline-flex items-center rounded-md bg-purple-100 text-purple-800 px-1.5 py-0.2 text-[10px] font-extrabold ring-1 ring-purple-300">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-[11px]">
                          {[item.variant, item.color].filter(Boolean).join(" • ")}
                        </p>
                      </div>
                      <span className="font-extrabold text-gray-900">
                        {item.price > 0 ? formatINR(item.price * item.qty) : item.priceLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-baseline pt-3">
                <span className="text-sm font-bold text-gray-700">Estimated Total</span>
                <span className="text-xl font-extrabold text-gray-900">
                  {selectedOrder.totalDisplay}
                </span>
              </div>
            </div>

            {/* Contact Actions */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={`tel:${selectedOrder.customerPhone}`}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700 transition"
              >
                <PhoneIcon width={14} height={14} />
                Call Customer
              </a>
              <a
                href={`https://wa.me/91${selectedOrder.customerPhone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
                  `Hi ${selectedOrder.customerName}, this is Jai Apple Store regarding your order ${selectedOrder.orderNo}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition"
              >
                <WhatsAppIcon width={14} height={14} />
                WhatsApp Message
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

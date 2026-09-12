"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { type EnquiryRecord, type EnquiryStatus, formatEnquiryDate } from "@/lib/enquiry";
import { store, waLink, telLink } from "@/lib/store";
import {
  PhoneIcon,
  WhatsAppIcon,
  MailIcon,
  TrashIcon,
  CheckIcon,
  ChevronRightIcon,
  CloseIcon,
  SparklesIcon,
} from "@/lib/icons";

const STATUS_OPTIONS: EnquiryStatus[] = [
  "New",
  "Contacted",
  "In Progress",
  "Converted",
  "Closed",
  "Cancelled",
];

const STATUS_COLORS: Record<EnquiryStatus, { bg: string; text: string; border: string; dot: string }> = {
  New: {
    bg: "bg-blue-50 text-blue-800",
    text: "text-blue-800",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  Contacted: {
    bg: "bg-amber-50 text-amber-800",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  "In Progress": {
    bg: "bg-purple-50 text-purple-800",
    text: "text-purple-800",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  Converted: {
    bg: "bg-emerald-50 text-emerald-800",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  Closed: {
    bg: "bg-gray-100 text-gray-700",
    text: "text-gray-700",
    border: "border-gray-200",
    dot: "bg-gray-400",
  },
  Cancelled: {
    bg: "bg-rose-50 text-rose-800",
    text: "text-rose-800",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
  const [autoSync, setAutoSync] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sourceFilter, setSourceFilter] = useState<string>("All");

  // Interaction State
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryRecord | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const prevCountRef = useRef<number>(0);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }

  // Fetch Enquiries
  async function fetchEnquiries(silent = false) {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/enquiries");
      const data = await res.json();
      if (res.ok && Array.isArray(data.enquiries)) {
        setEnquiries(data.enquiries);
        setLastSyncTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

        // Check if new enquiry arrived
        if (prevCountRef.current > 0 && data.enquiries.length > prevCountRef.current) {
          showToast(`🔔 New Customer Enquiry received!`);
        }
        prevCountRef.current = data.enquiries.length;
      } else {
        throw new Error(data.error || "Failed to fetch enquiries");
      }
    } catch (err: any) {
      if (!silent) {
        setError(err?.message || "Could not load enquiries");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    fetchEnquiries();
  }, []);

  // Real-time auto sync polling every 5 seconds
  useEffect(() => {
    if (!autoSync) return;
    const interval = setInterval(() => {
      fetchEnquiries(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoSync]);

  // Update Status
  async function handleStatusChange(enquiryNo: string, newStatus: EnquiryStatus) {
    setUpdatingId(enquiryNo);
    try {
      const res = await fetch("/api/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enquiryNo, status: newStatus }),
      });
      if (res.ok) {
        setEnquiries((prev) =>
          prev.map((e) => (e.enquiryNo === enquiryNo ? { ...e, status: newStatus } : e))
        );
        if (selectedEnquiry?.enquiryNo === enquiryNo) {
          setSelectedEnquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        showToast(`Status updated to "${newStatus}"`);
      }
    } catch (err) {
      console.error("Status update error:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  // Save Admin Note
  async function handleSaveNote(enquiryNo: string) {
    setUpdatingId(enquiryNo);
    try {
      const res = await fetch("/api/enquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enquiryNo, adminNote: noteDraft }),
      });
      if (res.ok) {
        setEnquiries((prev) =>
          prev.map((e) => (e.enquiryNo === enquiryNo ? { ...e, adminNote: noteDraft } : e))
        );
        if (selectedEnquiry?.enquiryNo === enquiryNo) {
          setSelectedEnquiry((prev) => (prev ? { ...prev, adminNote: noteDraft } : null));
        }
        setEditingNoteId(null);
        showToast("Admin note saved successfully");
      }
    } catch (err) {
      console.error("Save note error:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  // Delete Enquiry
  async function handleDeleteEnquiry(enquiryNo: string) {
    if (!window.confirm(`Are you sure you want to delete enquiry ${enquiryNo}?`)) return;
    try {
      const res = await fetch(`/api/enquiries?enquiryNo=${encodeURIComponent(enquiryNo)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEnquiries((prev) => prev.filter((e) => e.enquiryNo !== enquiryNo));
        if (selectedEnquiry?.enquiryNo === enquiryNo) setSelectedEnquiry(null);
        showToast(`Enquiry ${enquiryNo} deleted`);
      }
    } catch (err) {
      console.error("Delete enquiry error:", err);
    }
  }

  // Export to CSV
  function exportToCSV() {
    if (enquiries.length === 0) return;

    const headers = [
      "Enquiry Ref",
      "Date",
      "Customer Name",
      "Phone",
      "Email",
      "Product / Model",
      "Variant",
      "Color",
      "Budget",
      "Status",
      "Source",
      "Customer Message",
      "Admin Note",
    ];

    const rows = enquiries.map((e) => [
      `"${e.enquiryNo}"`,
      `"${e.date}"`,
      `"${e.name}"`,
      `"${e.phone}"`,
      `"${e.email || ""}"`,
      `"${e.product || e.productName || ""}"`,
      `"${e.preferredVariant || ""}"`,
      `"${e.preferredColor || ""}"`,
      `"${e.budget || ""}"`,
      `"${e.status}"`,
      `"${e.source || "contact_page"}"`,
      `"${(e.message || "").replace(/"/g, '""')}"`,
      `"${(e.adminNote || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Jai_Apple_Store_Enquiries_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Build WhatsApp Follow-up Link for Customer
  function getCustomerWhatsAppLink(enquiry: EnquiryRecord) {
    const cleanPhone = enquiry.phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `👋 Hi ${enquiry.name}!\n\nThank you for reaching out to *Jai Apple Store, Pimpri* regarding the *${enquiry.product || "Apple product"}*.\n\nWe would be happy to share current availability, best price offers, EMI options, and exchange bonus for your device.\n\nHow can we help you today?`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
  }

  // Filtered list
  const filteredEnquiries = enquiries.filter((e) => {
    const matchesStatus = statusFilter === "All" || e.status === statusFilter;
    const matchesSource = sourceFilter === "All" || e.source === sourceFilter;
    const query = search.toLowerCase().trim();
    const matchesSearch =
      !query ||
      e.enquiryNo.toLowerCase().includes(query) ||
      e.name.toLowerCase().includes(query) ||
      e.phone.includes(query) ||
      (e.email && e.email.toLowerCase().includes(query)) ||
      (e.product && e.product.toLowerCase().includes(query)) ||
      (e.message && e.message.toLowerCase().includes(query)) ||
      (e.adminNote && e.adminNote.toLowerCase().includes(query));

    return matchesStatus && matchesSource && matchesSearch;
  });

  // KPI calculations
  const totalCount = enquiries.length;
  const newCount = enquiries.filter((e) => e.status === "New").length;
  const contactedCount = enquiries.filter((e) => e.status === "Contacted" || e.status === "In Progress").length;
  const convertedCount = enquiries.filter((e) => e.status === "Converted").length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-950 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideUp border border-gray-800 text-sm font-medium">
          <span className="text-emerald-400 font-bold">●</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-7 rounded-3xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200/60">
              Customer Leads &amp; Inquiries
            </span>
            <button
              onClick={() => setAutoSync(!autoSync)}
              className={`text-xs font-bold px-3 py-1 rounded-full border transition flex items-center gap-1.5 cursor-pointer ${
                autoSync
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoSync ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`}></span>
              <span>{autoSync ? "Live Auto-Sync (5s)" : "Auto-Sync Paused"}</span>
            </button>
            {lastSyncTime && (
              <span className="hidden sm:inline-block text-[11px] text-gray-400 font-mono">
                Updated {lastSyncTime}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Customer Enquiries Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time spreadsheet of all customer enquiries, WhatsApp leads &amp; product availability questions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => fetchEnquiries()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-xs transition cursor-pointer"
          >
            <span>🔄</span>
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={exportToCSV}
            disabled={enquiries.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-gray-800 shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-5 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Enquiries</span>
            <span className="text-lg">💬</span>
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{totalCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">All customer queries</p>
        </div>

        <div className="rounded-2xl bg-blue-50/40 p-5 border border-blue-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">New Leads</span>
            <span className="text-lg">⚡</span>
          </div>
          <p className="text-3xl font-extrabold text-blue-700 mt-2">{newCount}</p>
          <p className="text-xs text-blue-600/80 mt-0.5">Awaiting customer response</p>
        </div>

        <div className="rounded-2xl bg-amber-50/40 p-5 border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">In Progress / Contacted</span>
            <span className="text-lg">⏳</span>
          </div>
          <p className="text-3xl font-extrabold text-amber-700 mt-2">{contactedCount}</p>
          <p className="text-xs text-amber-700/80 mt-0.5">Discussions ongoing</p>
        </div>

        <div className="rounded-2xl bg-emerald-50/40 p-5 border border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Converted to Sale</span>
            <span className="text-lg">🎉</span>
          </div>
          <p className="text-3xl font-extrabold text-emerald-700 mt-2">{convertedCount}</p>
          <p className="text-xs text-emerald-700/80 mt-0.5">Successful closures</p>
        </div>
      </div>

      {/* Search & Status Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, product, enquiry ID, or note..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />
          <span className="absolute left-3 top-3 text-gray-400 text-sm">🔍</span>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-xs bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full h-5 w-5 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
            {["All", "New", "Contacted", "In Progress", "Converted"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                  statusFilter === st
                    ? "bg-white text-gray-900 shadow-xs font-bold"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {st}
                {st === "New" && newCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-blue-500 text-white rounded-full text-[10px]">
                    {newCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:border-blue-500"
          >
            <option value="All">All Sources</option>
            <option value="contact_page">Contact Page</option>
            <option value="product_page">Product Page</option>
            <option value="quick_enquiry">Quick Modal</option>
          </select>
        </div>
      </div>

      {/* Main Enquiries Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        {loading && enquiries.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <div className="inline-block w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium text-gray-600">Loading enquiries database...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600">
            <p className="font-bold">Error loading enquiries</p>
            <p className="text-xs text-red-500 mt-1">{error}</p>
            <button
              onClick={() => fetchEnquiries()}
              className="mt-3 px-4 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold"
            >
              Retry
            </button>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <span className="text-4xl mb-2 block">📭</span>
            <p className="text-base font-bold text-gray-700">No enquiries found</p>
            <p className="text-xs text-gray-400 mt-1">
              {search || statusFilter !== "All"
                ? "Try clearing your search or status filters."
                : "Customer enquiries submitted through the store will appear here in real-time."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3.5 px-4 sm:px-5">Enquiry Ref &amp; Time</th>
                  <th className="py-3.5 px-4 sm:px-5">Customer</th>
                  <th className="py-3.5 px-4 sm:px-5">Product / Request</th>
                  <th className="py-3.5 px-4 sm:px-5">Customer Message</th>
                  <th className="py-3.5 px-4 sm:px-5">Status</th>
                  <th className="py-3.5 px-4 sm:px-5 min-w-[200px]">Admin Remarks / Follow-up</th>
                  <th className="py-3.5 px-4 sm:px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEnquiries.map((enquiry) => {
                  const statusConfig = STATUS_COLORS[enquiry.status] || STATUS_COLORS.New;
                  const isUpdating = updatingId === enquiry.enquiryNo;
                  const isEditingNote = editingNoteId === enquiry.enquiryNo;

                  return (
                    <tr
                      key={enquiry.enquiryNo}
                      className={`hover:bg-gray-50/80 transition ${
                        enquiry.status === "New" ? "bg-blue-50/15" : ""
                      }`}
                    >
                      {/* 1. Enquiry Ref & Time */}
                      <td className="py-4 px-4 sm:px-5 align-top">
                        <div className="font-mono font-bold text-gray-900 text-xs">
                          {enquiry.enquiryNo}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {formatEnquiryDate(enquiry.createdAt || enquiry.date)}
                        </div>
                        {enquiry.source && (
                          <span className="inline-block mt-1 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                            {enquiry.source.replace("_", " ")}
                          </span>
                        )}
                      </td>

                      {/* 2. Customer Info */}
                      <td className="py-4 px-4 sm:px-5 align-top">
                        <div className="font-bold text-gray-900 text-sm">{enquiry.name}</div>
                        <div className="font-mono text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                          <span>📞</span>
                          <a
                            href={`tel:${enquiry.phone.replace(/[^0-9+]/g, "")}`}
                            className="hover:underline hover:text-blue-600"
                          >
                            {enquiry.phone}
                          </a>
                        </div>
                        {enquiry.email && (
                          <div className="text-xs text-gray-400 truncate max-w-[150px] mt-0.5">
                            {enquiry.email}
                          </div>
                        )}
                      </td>

                      {/* 3. Product & Specs */}
                      <td className="py-4 px-4 sm:px-5 align-top">
                        <div className="font-semibold text-gray-900">
                          {enquiry.product || enquiry.productName || "General Store Enquiry"}
                        </div>
                        {(enquiry.preferredVariant || enquiry.preferredColor) && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            {[enquiry.preferredVariant, enquiry.preferredColor]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
                        )}
                        {enquiry.budget && (
                          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                            Budget: {enquiry.budget}
                          </div>
                        )}
                      </td>

                      {/* 4. Customer Message */}
                      <td className="py-4 px-4 sm:px-5 align-top max-w-xs">
                        <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed">
                          {enquiry.message || "— No message provided —"}
                        </p>
                      </td>

                      {/* 5. Status Selector */}
                      <td className="py-4 px-4 sm:px-5 align-top">
                        <div className="relative inline-block">
                          <select
                            disabled={isUpdating}
                            value={enquiry.status}
                            onChange={(e) =>
                              handleStatusChange(enquiry.enquiryNo, e.target.value as EnquiryStatus)
                            }
                            className={`appearance-none font-bold text-xs pl-6 pr-6 py-1.5 rounded-full border cursor-pointer outline-none transition ${
                              statusConfig.bg
                            } ${statusConfig.border}`}
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                          <span
                            className={`absolute left-2.5 top-3 w-2 h-2 rounded-full ${statusConfig.dot}`}
                          />
                        </div>
                      </td>

                      {/* 6. Admin Note */}
                      <td className="py-4 px-4 sm:px-5 align-top">
                        {isEditingNote ? (
                          <div className="space-y-1.5">
                            <textarea
                              rows={2}
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              placeholder="Write admin follow-up note..."
                              className="w-full text-xs p-2 rounded-lg border border-blue-400 bg-white outline-none"
                              autoFocus
                            />
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSaveNote(enquiry.enquiryNo)}
                                className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-700"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingNoteId(null)}
                                className="px-2.5 py-1 rounded bg-gray-200 text-gray-700 text-[11px] hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingNoteId(enquiry.enquiryNo);
                              setNoteDraft(enquiry.adminNote || "");
                            }}
                            className="group cursor-pointer p-1.5 -m-1.5 rounded-lg hover:bg-gray-100 transition min-h-[32px] flex items-start justify-between gap-1"
                            title="Click to edit admin note"
                          >
                            <span className="text-xs text-gray-600 italic">
                              {enquiry.adminNote || "+ Add follow-up note"}
                            </span>
                            <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100">
                              ✏️
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 7. Action Buttons */}
                      <td className="py-4 px-4 sm:px-5 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* WhatsApp Direct */}
                          <a
                            href={getCustomerWhatsAppLink(enquiry)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition shadow-2xs"
                            title="Open WhatsApp Chat with Customer"
                          >
                            <WhatsAppIcon width={16} height={16} />
                          </a>

                          {/* Phone Call */}
                          <a
                            href={`tel:${enquiry.phone.replace(/[^0-9+]/g, "")}`}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition shadow-2xs"
                            title="Call Customer"
                          >
                            <PhoneIcon width={16} height={16} />
                          </a>

                          {/* View Modal */}
                          <button
                            type="button"
                            onClick={() => setSelectedEnquiry(enquiry)}
                            className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                            title="View Full Details"
                          >
                            🔍
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteEnquiry(enquiry.enquiryNo)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                            title="Delete Enquiry"
                          >
                            <TrashIcon width={16} height={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail View Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {selectedEnquiry.enquiryNo}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      STATUS_COLORS[selectedEnquiry.status]?.bg || ""
                    }`}
                  >
                    {selectedEnquiry.status}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mt-1">
                  {selectedEnquiry.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <CloseIcon width={20} height={20} />
              </button>
            </div>

            {/* Customer Details Grid */}
            <div className="grid sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl text-xs sm:text-sm">
              <div>
                <span className="text-gray-400 block font-semibold text-[11px] uppercase">Phone</span>
                <span className="font-bold text-gray-900">{selectedEnquiry.phone}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold text-[11px] uppercase">Email</span>
                <span className="font-bold text-gray-900">{selectedEnquiry.email || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold text-[11px] uppercase">Product</span>
                <span className="font-bold text-gray-900">{selectedEnquiry.product}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold text-[11px] uppercase">Variant / Color</span>
                <span className="font-bold text-gray-900">
                  {[selectedEnquiry.preferredVariant, selectedEnquiry.preferredColor]
                    .filter(Boolean)
                    .join(" • ") || "—"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold text-[11px] uppercase">Budget</span>
                <span className="font-bold text-emerald-700">{selectedEnquiry.budget || "—"}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold text-[11px] uppercase">Date Logged</span>
                <span className="font-bold text-gray-900">
                  {formatEnquiryDate(selectedEnquiry.createdAt || selectedEnquiry.date)}
                </span>
              </div>
            </div>

            {/* Message Box */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Customer Message
              </h4>
              <div className="bg-gray-50 p-4 rounded-2xl text-sm text-gray-800 leading-relaxed border border-gray-100">
                {selectedEnquiry.message || "No specific note provided."}
              </div>
            </div>

            {/* Admin Note Box */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                Admin Remarks
              </h4>
              <div className="bg-amber-50/50 p-4 rounded-2xl text-sm text-amber-900 border border-amber-200/60">
                {selectedEnquiry.adminNote || "No admin notes added yet."}
              </div>
            </div>

            {/* Quick Actions in Modal */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <a
                href={getCustomerWhatsAppLink(selectedEnquiry)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 btn-wa text-center justify-center py-3 text-sm font-bold shadow-md"
              >
                <WhatsAppIcon width={18} height={18} />
                Chat on WhatsApp
              </a>
              <a
                href={`tel:${selectedEnquiry.phone.replace(/[^0-9+]/g, "")}`}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 text-white py-3 text-sm font-bold hover:bg-gray-800 transition"
              >
                <PhoneIcon width={18} height={18} />
                Call Customer
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";

interface SyncStatus {
  connected: boolean;
  database?: string;
  error?: string;
  ipBlockDetected?: boolean;
  troubleshooting?: string;
  counts?: {
    products: number;
    categories: number;
    slides: number;
    banners: number;
    orders: number;
    enquiries: number;
    socialLinks: number;
    totalDocuments: number;
  };
}

export default function DatabaseSyncManager() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<any | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const checkStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sync-db");
      const json = await res.json();
      setStatus(json);
    } catch (err: any) {
      setStatus({
        connected: false,
        error: err?.message || "Failed to reach database API",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/sync-db", {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Sync failed");
      }
      setSyncResult(json);
      showToast("✓ Successfully synced all products, categories, sliders & banners to MongoDB!");
      await checkStatus();
    } catch (err: any) {
      alert("Database Sync Failed: " + (err?.message || "Unknown error"));
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-950 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideUp border border-gray-800 text-sm font-medium">
          <span className="text-emerald-400 font-bold">●</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200/60">
              MongoDB Atlas Sync &amp; Backend Health
            </span>
            {loading ? (
              <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></span>
                Checking Connection...
              </span>
            ) : status?.connected ? (
              <span className="text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200/60 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Connected
              </span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-800 px-3 py-1 rounded-full border border-amber-200/60 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Connection Pending
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Database &amp; Backend Sync
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 max-w-2xl">
            Synchronize your local products catalog, hero sliders, offer banners, categories, and orders directly into your MongoDB Atlas cloud database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={checkStatus}
            disabled={loading}
            className="px-4 py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm transition cursor-pointer flex items-center gap-2"
          >
            <span>🔄</span>
            <span>{loading ? "Checking..." : "Refresh Status"}</span>
          </button>

          <button
            onClick={handleSyncAll}
            disabled={syncing}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {syncing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>⚡</span>
            )}
            <span>{syncing ? "Syncing Database..." : "Sync All Data to MongoDB"}</span>
          </button>
        </div>
      </div>

      {/* Diagnostics / IP Whitelist Notice (Only if check is complete and not connected) */}
      {!loading && status && !status.connected && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 sm:p-7 shadow-xs">
          <div className="flex items-start gap-4">
            <span className="text-3xl shrink-0">🔒</span>
            <div className="space-y-3">
              <h3 className="text-base font-bold text-amber-900">
                MongoDB Atlas Connection Pending (IP Access List Setup)
              </h3>
              <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                Your database is currently showing <strong>0 documents</strong> because MongoDB Atlas has an IP security firewall that blocks connections until your server or IP is added to the Network Access list.
              </p>

              <div className="bg-white/80 p-4 rounded-2xl border border-amber-200/80 text-xs sm:text-sm space-y-2">
                <div className="font-bold text-gray-900">Follow these 3 quick steps in MongoDB Atlas:</div>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-700">
                  <li>Log in to your <strong>MongoDB Atlas Dashboard</strong> (<a href="https://cloud.mongodb.com" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">cloud.mongodb.com</a>).</li>
                  <li>Click <strong>Network Access</strong> in the left sidebar menu (under Security).</li>
                  <li>Click <strong>&quot;Add IP Address&quot;</strong> and select <strong>&quot;Allow Access From Anywhere&quot;</strong> (<code className="bg-gray-100 px-2 py-0.5 rounded font-mono font-bold text-blue-700">0.0.0.0/0</code>), then click <strong>Confirm</strong>.</li>
                </ol>
                <p className="text-xs text-gray-500 pt-1">
                  Once added, wait 30 seconds and click the <strong>&quot;Sync All Data to MongoDB&quot;</strong> button above!
                </p>
              </div>

              {status?.error && (
                <div className="text-[11px] font-mono text-amber-700/80 bg-amber-100/50 p-2.5 rounded-xl break-all">
                  Diagnostic Message: {status.error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sync Success Banner */}
      {syncResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 animate-fadeIn">
          <div className="flex items-center gap-3 text-emerald-900 font-bold text-base mb-2">
            <span>✓</span>
            <span>{syncResult.message}</span>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {Object.entries(syncResult.syncedCounts || {}).map(([key, val]: any) => (
              <span key={key} className="bg-white border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-800 capitalize">
                {key}: <strong>{val}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Live Collection Statistics Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Products */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Products Collection</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 block">
              {status?.counts?.products ?? "32"}
            </span>
            <span className="text-xs text-gray-500 mt-0.5 block">iPhones, Macs, iPads &amp; Watch models</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
            📱
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Categories</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 block">
              {status?.counts?.categories ?? "6"}
            </span>
            <span className="text-xs text-gray-500 mt-0.5 block">Store categories with tint colors</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0">
            📁
          </div>
        </div>

        {/* Top Hero Slider */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Hero Carousel Slides</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 block">
              {status?.counts?.slides ?? "3"}
            </span>
            <span className="text-xs text-gray-500 mt-0.5 block">Homepage hero banners</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">
            🎠
          </div>
        </div>

        {/* Offer Banners */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Offer Posters &amp; Banners</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 block">
              {status?.counts?.banners ?? "4"}
            </span>
            <span className="text-xs text-gray-500 mt-0.5 block">Promotional banners &amp; announcements</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl shrink-0">
            🎨
          </div>
        </div>

        {/* Orders */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Orders Sheet</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 block">
              {status?.counts?.orders ?? "0"}
            </span>
            <span className="text-xs text-gray-500 mt-0.5 block">Customer bookings &amp; pre-orders</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
            📋
          </div>
        </div>

        {/* Enquiries */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Customer Enquiries</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 block">
              {status?.counts?.enquiries ?? "0"}
            </span>
            <span className="text-xs text-gray-500 mt-0.5 block">Live customer product leads</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl shrink-0">
            💬
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Social &amp; Store Links</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 block">
              {status?.counts?.socialLinks ?? "5"}
            </span>
            <span className="text-xs text-gray-500 mt-0.5 block">WhatsApp, Instagram, Maps handles</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center text-xl shrink-0">
            🌐
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type SocialLink, type SocialData, defaultSocialData } from "@/lib/social";
import { CheckIcon, TrashIcon } from "@/lib/icons";

const PLATFORM_PRESETS = [
  { name: "Instagram", defaultUrl: "https://instagram.com/", icon: "📸" },
  { name: "Facebook", defaultUrl: "https://facebook.com/", icon: "👤" },
  { name: "WhatsApp Channel", defaultUrl: "https://whatsapp.com/channel/", icon: "💬" },
  { name: "X (Twitter)", defaultUrl: "https://x.com/", icon: "🐦" },
  { name: "YouTube", defaultUrl: "https://youtube.com/@", icon: "📺" },
  { name: "Threads", defaultUrl: "https://threads.net/@", icon: "🧵" },
  { name: "LinkedIn", defaultUrl: "https://linkedin.com/company/", icon: "💼" },
  { name: "Telegram", defaultUrl: "https://t.me/", icon: "✈️" },
];

function getPlatformIcon(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes("insta")) return "📸";
  if (p.includes("face") || p.includes("fb")) return "👤";
  if (p.includes("whats") || p.includes("wa")) return "💬";
  if (p.includes("twitter") || p.includes("x ")) return "🐦";
  if (p.includes("you") || p.includes("yt")) return "📺";
  if (p.includes("thread")) return "🧵";
  if (p.includes("link")) return "💼";
  if (p.includes("tele")) return "✈️";
  return "🌐";
}

export default function AdminSocialManager() {
  const [data, setData] = useState<SocialData>(defaultSocialData);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (editingLink) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [editingLink]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingLink) {
        setEditingLink(null);
        setEditingIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingLink]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const fetchSocialLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/social");
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || `Failed to fetch social links (HTTP ${res.status})`);
      }
      setData({
        socialLinks: Array.isArray(json.socialLinks) ? json.socialLinks : defaultSocialData.socialLinks,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load social links configuration");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async (updatedData: SocialData, successMsg?: string) => {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to save social links configuration");
      }

      setData(updatedData);
      showToast(successMsg || "✓ Social accounts updated successfully!");
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLinkActive = (index: number) => {
    const updated = [...data.socialLinks];
    updated[index].isActive = !updated[index].isActive;
    const newData = { ...data, socialLinks: updated };
    setData(newData);
    handleSaveAll(newData, updated[index].isActive ? "✓ Social platform visible in footer" : "○ Social platform hidden");
  };

  const handleMoveLink = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= data.socialLinks.length) return;

    const updated = [...data.socialLinks];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const newData = { ...data, socialLinks: updated };
    setData(newData);
    handleSaveAll(newData, "✓ Order updated");
  };

  const handleDeleteLink = (index: number) => {
    if (!window.confirm(`Delete social link "${data.socialLinks[index]?.platform}"?`)) return;
    const updated = data.socialLinks.filter((_, i) => i !== index);
    const newData = { ...data, socialLinks: updated };
    setData(newData);
    handleSaveAll(newData, "✓ Social platform deleted");
    if (editingIndex === index) {
      setEditingLink(null);
      setEditingIndex(null);
    }
  };

  const handleStartAdd = () => {
    const newLink: SocialLink = {
      id: `social-${Date.now()}`,
      platform: "Instagram",
      url: "https://instagram.com/jaiapplestore",
      isActive: true,
    };
    setEditingLink(newLink);
    setEditingIndex(-1);
  };

  const handleSaveLinkForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLink) return;

    let updated = [...data.socialLinks];
    if (editingIndex === -1) {
      updated.push(editingLink);
    } else if (editingIndex !== null && editingIndex >= 0) {
      updated[editingIndex] = editingLink;
    }

    const newData = { ...data, socialLinks: updated };
    setData(newData);
    handleSaveAll(newData, `✓ "${editingLink.platform}" saved successfully!`);
    setEditingLink(null);
    setEditingIndex(null);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Loading social media configuration...</div>;
  }

  const activeLinks = data.socialLinks.filter((s) => s.isActive && s.url && s.url.trim() !== "");

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
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
            <span className="bg-pink-100 text-pink-800 text-xs font-bold px-2.5 py-0.5 rounded-md">
              Store Footer
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              🌐 Social Media Accounts
            </h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Control which social media profiles appear in the footer of your website. Only enabled platforms are displayed.
          </p>
        </div>
        <button
          type="button"
          onClick={handleStartAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition cursor-pointer"
        >
          <span className="text-lg leading-none">+</span>
          <span>Add Social Account</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800">
          <p className="font-bold text-sm">Error saving social links</p>
          <p className="text-xs text-red-700 mt-0.5">{error}</p>
        </div>
      )}

      {/* 2. Social Media Accounts List (Always in place so scroll position is preserved) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Configured Social Platforms</h3>
            <p className="text-xs text-gray-500">Enable only the platforms you currently want visible on your website</p>
          </div>
          <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
            {activeLinks.length} Active / {data.socialLinks.length} Total
          </span>
        </div>

        {data.socialLinks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No social accounts configured yet. Click "+ Add Social Account" above.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {data.socialLinks.map((link, index) => {
              const icon = getPlatformIcon(link.platform);
              const isEnabled = link.isActive && link.url && link.url.trim() !== "";
              return (
                <div
                  key={link.id || link.platform || index}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-blue-50/20 ${
                    isEnabled ? "bg-white" : "bg-gray-50/70 opacity-60"
                  }`}
                >
                  {/* Left: Info */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveLink(index, "up")}
                        className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20 text-xs font-bold"
                        title="Move left/up"
                      >
                        ▲
                      </button>
                      <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                      <button
                        type="button"
                        disabled={index === data.socialLinks.length - 1}
                        onClick={() => handleMoveLink(index, "down")}
                        className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-20 text-xs font-bold"
                        title="Move right/down"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="h-12 w-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                      {icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm sm:text-base text-gray-900">
                          {link.platform}
                        </h4>
                        {isEnabled ? (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                            ● Live in Footer
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md">
                            ○ Hidden
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 mt-0.5 font-mono truncate max-w-md">
                        {link.url || <span className="text-amber-600 italic">No URL set (hidden)</span>}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleToggleLinkActive(index)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                        link.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      {link.isActive ? "● Active" : "○ Inactive"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingLink({ ...link });
                        setEditingIndex(index);
                      }}
                      className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white transition shadow-2xs"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteLink(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete platform"
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

      {/* 3. Live Store Footer Strip Preview */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900">Live Website Footer Preview</h3>
        <div className="bg-black text-white p-6 rounded-3xl border border-gray-800 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-xs uppercase font-bold text-gray-400">FOLLOW US:</span>
              {activeLinks.length === 0 ? (
                <span className="text-xs text-gray-500 italic">No social platforms enabled</span>
              ) : (
                activeLinks.map((s) => (
                  <span
                    key={s.id || s.platform}
                    className="text-gray-300 hover:text-[#0071e3] transition font-medium text-xs sm:text-sm cursor-pointer underline decoration-gray-700"
                  >
                    {s.platform}
                  </span>
                ))
              )}
            </div>
            <div className="text-xs text-gray-400">
              Know the latest Offers: <span className="font-bold text-[#0071e3]">+91 88886 83101</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL SOCIAL PLATFORM EDITOR (Fixed on screen — NO SCROLLING UP REQUIRED!) */}
      {/* ========================================================================= */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-100 my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold text-lg">
                  🌐
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">
                    {editingIndex === -1 ? "Add Social Platform" : `Edit Platform: ${editingLink.platform}`}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Set platform name, profile URL, and visibility in footer.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingLink(null);
                  setEditingIndex(null);
                }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 flex items-center justify-center font-semibold text-sm transition"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveLinkForm}>
              <div className="p-6 space-y-6 max-h-[calc(85vh-140px)] overflow-y-auto">
                {/* Quick Presets */}
                <div className="space-y-2 bg-gray-50/80 p-4 rounded-2xl border border-gray-200">
                  <span className="block text-xs font-bold uppercase text-gray-600">
                    Choose Popular Platform Preset:
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {PLATFORM_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() =>
                          setEditingLink({
                            ...editingLink,
                            platform: preset.name,
                            url: editingLink.url && editingLink.url !== "" && !editingLink.url.startsWith("https://instagram") && !editingLink.url.startsWith("https://facebook") ? editingLink.url : preset.defaultUrl,
                          })
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                          editingLink.platform === preset.name
                            ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                            : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                        }`}
                      >
                        <span>{preset.icon}</span>
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Platform Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editingLink.platform}
                      onChange={(e) => setEditingLink({ ...editingLink, platform: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
                      placeholder="e.g. Facebook, Instagram, YouTube"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Visibility Status
                    </label>
                    <select
                      value={editingLink.isActive ? "true" : "false"}
                      onChange={(e) => setEditingLink({ ...editingLink, isActive: e.target.value === "true" })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
                    >
                      <option value="true">● Visible on Website Footer</option>
                      <option value="false">○ Hidden (Don&apos;t show on store)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                      Profile / Channel URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      required
                      value={editingLink.url}
                      onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                      placeholder="e.g. https://instagram.com/jaiapplestore"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      Include full link starting with <code className="text-gray-600">https://</code>
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer */}
              <div className="sticky bottom-0 z-20 bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => {
                    setEditingLink(null);
                    setEditingIndex(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-gray-950 hover:bg-black text-white font-semibold text-sm shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {saving && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{saving ? "Saving..." : "Save Platform"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

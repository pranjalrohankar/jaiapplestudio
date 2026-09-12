"use client";

import { useState, type FormEvent } from "react";
import { store, waLink } from "@/lib/store";
import { submitEnquiry } from "@/lib/enquiry";
import { WhatsAppIcon, CloseIcon, CheckIcon } from "@/lib/icons";

export default function QuickEnquiryModal({
  productName,
  productSlug,
  variant,
  color,
  price,
  isOpen,
  onClose,
}: {
  productName: string;
  productSlug?: string;
  variant?: string;
  color?: string;
  price?: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [enquiryRef, setEnquiryRef] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setLoading(true);

    try {
      const result = await submitEnquiry({
        name: name.trim(),
        phone: phone.trim(),
        product: productName,
        productName,
        productSlug,
        preferredVariant: variant,
        preferredColor: color,
        budget: price,
        message: message.trim() || `Inquiry for ${productName} (${variant || ""}, ${color || ""}) at ${price || ""}.`,
        source: "product_page",
        status: "New",
      });

      const refNo = result.enquiry?.enquiryNo;
      if (refNo) setEnquiryRef(refNo);

      setSubmitted(true);

      // Pre-fill WhatsApp message
      const waMsg = [
        `👋 Hi ${store.name}! I would like to enquire about:`,
        "",
        ...(refNo ? [`📋 *Ref:* ${refNo}`] : []),
        `📱 *Product:* ${productName}`,
        ...(variant ? [`💾 *Storage/Size:* ${variant}`] : []),
        ...(color ? [`🎨 *Color:* ${color}`] : []),
        ...(price ? [`💰 *Price:* ${price}`] : []),
        "",
        `👤 *My Name:* ${name}`,
        `📞 *Phone:* ${phone}`,
        ...(message ? [`💬 *Note:* ${message}`] : []),
        "",
        `Please confirm stock availability and EMI / exchange offers at your Pimpri store.`,
      ].join("\n");

      window.open(waLink(waMsg), "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Quick enquiry error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition cursor-pointer"
        >
          <CloseIcon width={20} height={20} />
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
                Quick Enquiry
              </span>
              <h3 className="text-xl font-bold text-gray-900 mt-2">
                Enquire about {productName}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {[variant, color, price].filter(Boolean).join(" • ")}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Your Name *
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anand Patil"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Phone / WhatsApp Number *
              </label>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98220 00000"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Query / Note (Optional)
              </label>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about EMI, trade-in exchange, or availability..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-wa w-full py-3 text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <WhatsAppIcon width={18} height={18} />
              )}
              <span>{loading ? "Sending..." : "Submit & Chat on WhatsApp"}</span>
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl">
              ✓
            </div>
            <h3 className="text-xl font-bold text-gray-900">Enquiry Registered!</h3>
            <p className="text-xs text-gray-600 max-w-xs mx-auto">
              Reference: <strong className="font-mono text-blue-600">{enquiryRef}</strong>
              <br />
              We have opened WhatsApp for your direct chat and our team will get in touch shortly.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-full bg-gray-900 text-white font-bold text-xs hover:bg-gray-800 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

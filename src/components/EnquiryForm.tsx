"use client";

import { useState, type FormEvent } from "react";
import { store, waLink } from "@/lib/store";
import { products, productBySlug } from "@/lib/products";
import { submitEnquiry } from "@/lib/enquiry";
import { WhatsAppIcon } from "@/lib/icons";

const OPTIONS = [
  { value: "", label: "What product are you looking for?" },
  ...products.map((p) => ({ value: p.slug, label: p.name })),
];

export default function EnquiryForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [product, setProduct] = useState("");
  const [budget, setBudget] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [enquiryRef, setEnquiryRef] = useState<string | null>(null);

  const selectedProductObj = product ? productBySlug(product) : null;
  const productName = selectedProductObj?.name || (product ? product : "General Enquiry");

  function buildWhatsAppText(refNo?: string): string {
    const lines = [
      `👋 Hi ${store.name}! I'd like to make a product enquiry.`,
      "",
      ...(refNo ? [`📋 *Ref No:* ${refNo}`] : []),
      `👤 *Name:* ${name || "-"}`,
      `📞 *Phone:* ${phone || "-"}`,
      ...(email ? [`✉️ *Email:* ${email}`] : []),
      `📱 *Product Interested:* ${productName}`,
      ...(budget ? [`💰 *Budget / Preference:* ${budget}`] : []),
      `💬 *Message:* ${message || "Please share current availability, pricing offers & EMI options."}`,
      "",
      `Thank you! Looking forward to your response.`,
    ];
    return lines.join("\n");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setLoading(true);

    try {
      // 1. Submit enquiry to our database API in real-time
      const result = await submitEnquiry({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        product: productName,
        productName: productName,
        productSlug: product,
        budget: budget.trim(),
        message: message.trim(),
        source: "contact_page",
        status: "New",
      });

      const refNo = result.enquiry?.enquiryNo;
      if (refNo) setEnquiryRef(refNo);

      // 2. Also send to Formspree if configured
      if (store.formspreeEndpoint) {
        try {
          await fetch(store.formspreeEndpoint, {
            method: "POST",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({
              enquiryNo: refNo,
              name,
              phone,
              email,
              product: productName,
              budget,
              message,
            }),
          });
        } catch {
          // ignore formspree error
        }
      }

      setSent(true);

      // 3. Open WhatsApp with pre-filled enquiry message
      const waUrl = waLink(buildWhatsAppText(refNo));
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Enquiry submission error:", err);
      // Fallback direct to WhatsApp even if API call had an issue
      window.open(waLink(buildWhatsAppText()), "_blank", "noopener,noreferrer");
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/[0.05] sm:p-8 space-y-4"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
            Fast Response
          </span>
          <span className="text-[11px] font-semibold text-gray-500">
            Store pickup &amp; Pune Delivery
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
          Send a Product Enquiry
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-ink/65">
          Submit your query to get instant quotes, EMI options, and stock confirmation directly from our store team.
        </p>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 pt-2">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Your Full Name *
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            className="w-full rounded-xl border border-black/10 bg-cloud px-4 py-3 text-sm outline-none transition focus:border-apple focus:bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Phone / WhatsApp Number *
          </label>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 98230 12345"
            type="tel"
            className="w-full rounded-xl border border-black/10 bg-cloud px-4 py-3 text-sm outline-none transition focus:border-apple focus:bg-white"
          />
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Email Address (Optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-xl border border-black/10 bg-cloud px-4 py-3 text-sm outline-none transition focus:border-apple focus:bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Product Interested In
          </label>
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-cloud px-4 py-3 text-sm outline-none transition focus:border-apple focus:bg-white"
          >
            {OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Budget / Payment Mode
          </label>
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. No-Cost EMI / Exchange / Cash"
            className="w-full rounded-xl border border-black/10 bg-cloud px-4 py-3 text-sm outline-none transition focus:border-apple focus:bg-white"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Specific Requirements / Notes
          </label>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. 256GB Desert Titanium, Student discount..."
            className="w-full rounded-xl border border-black/10 bg-cloud px-4 py-3 text-sm outline-none transition focus:border-apple focus:bg-white"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-wa mt-2 w-full py-3.5 text-base font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <WhatsAppIcon width={20} height={20} />
        )}
        <span>{loading ? "Recording Enquiry..." : "Submit Enquiry & Connect on WhatsApp"}</span>
      </button>

      {sent && (
        <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 animate-fadeIn">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <span>✓</span>
            <span>Enquiry Logged Successfully! {enquiryRef ? `(Ref: ${enquiryRef})` : ""}</span>
          </div>
          <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
            Your enquiry has been registered in our system. A store representative will contact you shortly, and WhatsApp has been opened for instant chat.
          </p>
        </div>
      )}
    </form>
  );
}
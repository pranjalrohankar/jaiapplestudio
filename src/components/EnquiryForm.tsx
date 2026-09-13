"use client";

import { useState, useRef, type FormEvent } from "react";
import { store, waLink } from "@/lib/store";
import { products, productBySlug } from "@/lib/products";
import { submitEnquiry, nextEnquiryNumber } from "@/lib/enquiry";
import { WhatsAppIcon } from "@/lib/icons";

const OPTIONS = [
  { value: "", label: "What product are you looking for?" },
  ...products.map((p) => ({ value: p.slug, label: p.name })),
];

function validatePhone(phone: string): boolean {
  const clean = phone.replace(/[^0-9]/g, "");
  if (clean.length === 10 && /^[6-9]\d{9}$/.test(clean)) return true;
  if (clean.length === 12 && clean.startsWith("91") && /^[6-9]\d{9}$/.test(clean.slice(2))) return true;
  return false;
}

function validateEmail(email: string): boolean {
  if (!email.trim()) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

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

  // Validation State
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const selectedProductObj = product ? productBySlug(product) : null;
  const productName = selectedProductObj?.name || (product ? product : "General Enquiry");

  function validate(): boolean {
    const newErrors: { name?: string; phone?: string; email?: string } = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = "Please enter your full name (at least 2 letters).";
    }

    if (!phone.trim()) {
      newErrors.phone = "Please enter your mobile phone number.";
    } else if (!validatePhone(phone)) {
      newErrors.phone = "Please enter a valid 10-digit mobile number (e.g. 98230 12345).";
    }

    if (email.trim() && !validateEmail(email)) {
      newErrors.email = "Please enter a valid email address (e.g. name@example.com).";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      if (newErrors.name) nameInputRef.current?.focus();
      else if (newErrors.phone) phoneInputRef.current?.focus();
      else if (newErrors.email) emailInputRef.current?.focus();
      setFormError("Please correct the highlighted fields before submitting.");
      return false;
    }

    setFormError(null);
    return true;
  }

  function buildWhatsAppText(refNo?: string): string {
    const lines = [
      `👋 Hi ${store.name}! I'd like to make a product enquiry.`,
      "",
      ...(refNo ? [`📋 *Ref No:* ${refNo}`] : []),
      `👤 *Name:* ${name.trim() || "-"}`,
      `📞 *Phone:* ${phone.trim() || "-"}`,
      ...(email.trim() ? [`✉️ *Email:* ${email.trim()}`] : []),
      `📱 *Product Interested:* ${productName}`,
      ...(budget.trim() ? [`💰 *Budget / Preference:* ${budget.trim()}`] : []),
      `💬 *Message:* ${message.trim() || "Please share current availability, pricing offers & EMI options."}`,
      "",
      `Thank you! Looking forward to your response.`,
    ];
    return lines.join("\n");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
      const generatedEnquiryNo = nextEnquiryNumber();
      setEnquiryRef(generatedEnquiryNo);

      // 1. Submit enquiry to our database API in real-time
      const result = await submitEnquiry({
        enquiryNo: generatedEnquiryNo,
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

      const refNo = result.enquiry?.enquiryNo || generatedEnquiryNo;
      if (refNo) setEnquiryRef(refNo);

      // 2. Also send to Formspree if configured
      if (store.formspreeEndpoint) {
        try {
          await fetch(store.formspreeEndpoint, {
            method: "POST",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            body: JSON.stringify({
              enquiryNo: refNo,
              name: name.trim(),
              phone: phone.trim(),
              email: email.trim(),
              product: productName,
              budget: budget.trim(),
              message: message.trim(),
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
      window.open(waLink(buildWhatsAppText()), "_blank", "noopener,noreferrer");
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
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

      {formError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 animate-fadeIn flex items-center gap-2">
          <span>⚠️</span>
          <span>{formError}</span>
        </div>
      )}

      <div className="grid gap-3.5 sm:grid-cols-2 pt-2">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Your Full Name *
          </label>
          <input
            ref={nameInputRef}
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="e.g. Rahul Sharma"
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
              errors.name
                ? "border-red-500 bg-red-50/30 focus:border-red-600 focus:bg-white"
                : "border-black/10 bg-cloud focus:border-apple focus:bg-white"
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-[11px] font-semibold text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Phone / WhatsApp Number *
          </label>
          <input
            ref={phoneInputRef}
            required
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
            }}
            placeholder="e.g. 98230 12345"
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
              errors.phone
                ? "border-red-500 bg-red-50/30 focus:border-red-600 focus:bg-white"
                : "border-black/10 bg-cloud focus:border-apple focus:bg-white"
            }`}
          />
          {errors.phone && (
            <p className="mt-1 text-[11px] font-semibold text-red-600">{errors.phone}</p>
          )}
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Email Address (Optional)
          </label>
          <input
            ref={emailInputRef}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="name@example.com"
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
              errors.email
                ? "border-red-500 bg-red-50/30 focus:border-red-600 focus:bg-white"
                : "border-black/10 bg-cloud focus:border-apple focus:bg-white"
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-[11px] font-semibold text-red-600">{errors.email}</p>
          )}
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
"use client";

import { useState, type FormEvent } from "react";
import { store, waLink } from "@/lib/store";
import { products, productBySlug } from "@/lib/products";

const OPTIONS = [
  { value: "", label: "What are you looking for?" },
  ...products.map((p) => ({ value: p.slug, label: p.name })),
];

export default function EnquiryForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [product, setProduct] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function buildText(): string {
    const lines = [
      `Hi ${store.name}! I'd like to make an enquiry.`,
      "",
      `Name: ${name || "-"}`,
      `Phone: ${phone || "-"}`,
      `Product: ${product ? productBySlug(product)?.name ?? product : "-"}`,
      `Message: ${message || "-"}`,
    ];
    return lines.join("\n");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (store.formspreeEndpoint) {
      try {
        await fetch(store.formspreeEndpoint, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, product, message }),
        });
        setSent(true);
        return;
      } catch {
        // fall through to WhatsApp
      }
    }

    window.open(waLink(buildText()), "_blank", "noopener,noreferrer");
    setSent(true);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/[0.05] sm:p-8">
      <h3 className="text-xl font-semibold tracking-tight">Send an enquiry</h3>
      <p className="mt-1 text-sm text-ink/60">
        Fill this in and it opens WhatsApp with your message ready to send.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-xl border border-black/10 bg-cloud px-4 py-3 text-[15px] outline-none transition focus:border-apple"
        />
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Your phone number"
          type="tel"
          className="w-full rounded-xl border border-black/10 bg-cloud px-4 py-3 text-[15px] outline-none transition focus:border-apple"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <select
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-cloud px-4 py-3 text-[15px] outline-none transition focus:border-apple"
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Any message (budget, variant…)"
          className="w-full rounded-xl border border-black/10 bg-cloud px-4 py-3 text-[15px] outline-none transition focus:border-apple"
        />
      </div>

      <button type="submit" className="btn-wa mt-6 w-full">
        Send enquiry
      </button>

      {sent ? (
        <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700">
          Opened in WhatsApp — just press send. We&apos;ll get back to you quickly!
        </p>
      ) : null}
    </form>
  );
}
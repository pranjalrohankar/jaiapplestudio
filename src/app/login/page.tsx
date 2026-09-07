"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { CheckIcon, BagIcon, ChevronRightIcon } from "@/lib/icons";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  const { customer, loginCustomer, logoutCustomer } = useAuth();

  // Customer Form State
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  const [customerSaved, setCustomerSaved] = useState(false);

  useEffect(() => {
    if (customer) {
      setCustomerName(customer.name);
      setCustomerPhone(customer.phone);
      setCustomerCity(customer.city || "");
    }
  }, [customer]);

  function handleCustomerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) return;

    loginCustomer({
      name: customerName.trim(),
      phone: customerPhone.trim(),
      city: customerCity.trim() || undefined,
    });

    setCustomerSaved(true);
    setTimeout(() => {
      router.push(redirectPath === "/login" ? "/" : redirectPath);
    }, 600);
  }

  return (
    <div className="rounded-[2.5rem] bg-white p-8 shadow-2xl shadow-black/[0.08] ring-1 ring-black/[0.06] sm:p-10">
      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-lg font-bold text-white shadow-md">
            J
          </span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
          Customer Account
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-ink/60">
          Save your contact details for 1-click checkout and seamless order management
        </p>
      </div>

      {/* Active Customer Profile Box */}
      {customer && !customerSaved ? (
        <div className="mb-6 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Logged In Customer
              </p>
              <p className="text-base font-bold text-emerald-950 mt-0.5">
                {customer.name}
              </p>
              <p className="text-xs text-emerald-800">{customer.phone}</p>
              {customer.city && (
                <p className="text-xs text-emerald-700">{customer.city}</p>
              )}
            </div>
            <button
              type="button"
              onClick={logoutCustomer}
              className="text-xs font-semibold text-red-600 hover:underline bg-white px-3 py-1.5 rounded-lg shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : null}

      {customerSaved ? (
        <div className="rounded-2xl bg-emerald-50 p-6 text-center text-emerald-800 animate-fadeIn">
          <CheckIcon width={36} height={36} className="mx-auto text-emerald-600 mb-2" />
          <p className="text-lg font-bold">Profile Saved Successfully!</p>
          <p className="text-xs text-emerald-700 mt-1">Taking you to store checkout...</p>
        </div>
      ) : (
        <form onSubmit={handleCustomerSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/60 mb-1.5">
              Full Name *
            </label>
            <input
              required
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full rounded-xl border border-black/15 bg-cloud/50 px-4 py-3 text-[15px] outline-none transition focus:border-apple focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/60 mb-1.5">
              Mobile Phone Number *
            </label>
            <input
              required
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full rounded-xl border border-black/15 bg-cloud/50 px-4 py-3 text-[15px] outline-none transition focus:border-apple focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink/60 mb-1.5">
              City / Delivery Area (Optional)
            </label>
            <input
              type="text"
              value={customerCity}
              onChange={(e) => setCustomerCity(e.target.value)}
              placeholder="e.g. Pimpri-Chinchwad, Pune"
              className="w-full rounded-xl border border-black/15 bg-cloud/50 px-4 py-3 text-[15px] outline-none transition focus:border-apple focus:bg-white"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-6 flex items-center justify-center gap-2 rounded-full bg-ink py-4 text-base font-bold text-white shadow-xl shadow-black/10 transition hover:bg-zinc-800 active:scale-[0.99]"
          >
            <BagIcon width={18} height={18} />
            {customer ? "Update Profile & Continue" : "Save & Continue to Store"}
          </button>
        </form>
      )}

      {/* Footer Links */}
      <div className="mt-8 border-t border-black/10 pt-4 flex items-center justify-between text-xs font-semibold">
        <Link href="/" className="text-ink/60 hover:text-apple">
          &larr; Back to Store
        </Link>
        <Link href="/admin/login" className="text-ink/40 hover:text-ink">
          Store Admin Portal &rarr;
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-cloud to-white py-12 sm:py-20 flex items-center justify-center">
      <div className="container-px max-w-md w-full">
        <Suspense fallback={<div className="p-8 text-center text-ink/60">Loading customer portal...</div>}>
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}

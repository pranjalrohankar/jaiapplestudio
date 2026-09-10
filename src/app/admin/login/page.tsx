"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/admin";

  const { admin, loginAdmin, logoutAdmin } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const success = loginAdmin(username, password);
    if (success) {
      router.push(redirectPath);
    } else {
      setError("Invalid administrator username or password.");
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-[#16171b] via-[#121316] to-[#0d0e11] p-8 sm:p-12 text-white shadow-2xl ring-1 ring-white/10">
      {/* Ambient background blur */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center mb-4 group">
            <div className="relative h-24 w-20 sm:h-28 sm:w-24 shrink-0 transition group-hover:scale-105">
              <Image
                src="/images/logo-transparent.png"
                alt="Jai Apple Store Logo"
                fill
                sizes="112px"
                className="object-contain drop-shadow-[0_4px_20px_rgba(229,169,60,0.4)]"
                priority
              />
            </div>
          </Link>
          <div className="block">
            <div className="inline-block rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400 ring-1 ring-blue-500/30 mb-2">
              RESTRICTED ACCESS
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Jai Apple Store Admin
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-white/80">
            Sign in with store administrator credentials to manage orders, products &amp; banners
          </p>
        </div>

        {admin ? (
          <div className="rounded-2xl bg-white/5 p-6 text-center backdrop-blur-md ring-1 ring-white/10 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Active Administrator Session
            </p>
            <p className="text-lg font-bold">Logged in as {admin.username}</p>
            <div className="flex flex-col gap-2.5 pt-2">
              <Link
                href="/admin"
                className="w-full rounded-full bg-white py-3.5 text-sm font-bold text-ink hover:bg-slate-100 transition shadow-lg"
              >
                Go to Admin Dashboard &rarr;
              </Link>
              <button
                type="button"
                onClick={logoutAdmin}
                className="text-xs text-white/50 hover:text-white py-1 transition"
              >
                Log Out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-500/15 border border-red-500/30 p-3.5 text-xs font-semibold text-red-300 animate-fadeIn">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                Admin Username
              </label>
              <input
                required
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-blue-500 focus:bg-white/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                Admin Password
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition focus:border-blue-500 focus:bg-white/10"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 rounded-full bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Access Admin Portal"}
            </button>
          </form>
        )}

        <div className="mt-8 border-t border-white/10 pt-4 text-center">
          <Link href="/" className="text-xs font-semibold text-white/50 hover:text-white transition">
            &larr; Return to Customer Store
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#07080a] py-12 sm:py-20 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Suspense fallback={<div className="p-8 text-center text-white/60">Loading admin portal...</div>}>
          <AdminLoginContent />
        </Suspense>
      </div>
    </div>
  );
}

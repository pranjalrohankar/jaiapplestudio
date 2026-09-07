"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, logoutAdmin, isHydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isHydrated && !admin && !isLoginPage) {
      router.push("/admin/login");
    }
  }, [isHydrated, admin, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        Loading admin portal...
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">
        Redirecting to administrator login...
      </div>
    );
  }

  function handleLogout() {
    logoutAdmin();
    router.push("/admin/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fa] text-gray-900">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-black text-xs font-bold text-white">
              J
            </span>
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-gray-900">
              Jai Apple Store Admin
            </span>
          </Link>
          <span className="hidden sm:inline-block text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
            ● Live Portal
          </span>
        </div>

        <nav className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm font-semibold">
          <Link
            href="/admin"
            className={`px-3 py-1.5 rounded-lg transition ${
              pathname === "/admin"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            📋 Orders Sheet
          </Link>
          <Link
            href="/admin/products"
            className={`px-3 py-1.5 rounded-lg transition ${
              pathname === "/admin/products"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            📱 Products
          </Link>
          <Link
            href="/admin/banners"
            className={`px-3 py-1.5 rounded-lg transition ${
              pathname === "/admin/banners"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            🚀 Banners
          </Link>
          <Link
            href="/"
            target="_blank"
            className="hidden md:inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 px-2 py-1"
          >
            Live Store &rarr;
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition font-bold"
          >
            Logout ({admin.username})
          </button>
        </nav>
      </header>
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}

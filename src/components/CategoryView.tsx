import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { getCategoryBySlug, getProductsByCategory } from "@/lib/server-products";
import { ChevronRightIcon } from "@/lib/icons";

export default async function CategoryView({ slug }: { slug: string }) {
  const category = await getCategoryBySlug(slug);
  if (!category) return null;

  const products = await getProductsByCategory(slug);

  return (
    <div className="bg-[#f8f8fa] min-h-screen">
      {/* 1. Category Header & Breadcrumb */}
      <section className="bg-white border-b border-[#e6e6e6] pt-6 pb-8">
        <div className="container-xl">
          {/* Breadcrumb matching iNvent */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-6">
            <Link href="/" className="hover:text-black transition">Home</Link>
            <ChevronRightIcon width={12} height={12} />
            <span className="font-semibold text-black">{category.name}</span>
          </div>

          {/* iNvent Top Model Quick Strip */}
          {products.length > 0 && (
            <div className="mb-6 pb-4 border-b border-gray-100 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-4 sm:gap-6 min-w-max">
                {products.slice(0, 8).map((p) => (
                  <Link
                    key={p.slug}
                    href={`/product/${p.slug}`}
                    className="group flex flex-col items-center text-center p-2 rounded-xl transition hover:bg-[#f8f8fa]"
                  >
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 mb-2 flex items-center justify-center rounded-xl bg-[#f8f8fa] group-hover:bg-white p-1 border border-gray-200/60 transition shadow-2xs">
                      {p.image ? (
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          sizes="64px"
                          className="object-contain p-1 transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <span className="text-xs font-bold text-gray-400">
                          {p.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-800 group-hover:text-[#0071e3] transition line-clamp-1 max-w-[90px]">
                      {p.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Category Banner Title & Summary */}
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#111111]">
                  {category.name}
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm text-gray-500 max-w-xl">
                  Shop Apple {category.name} at lowest prices with Instant Bank Cashback & 1-Year Official Warranty.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/cart" className="btn-outline-dark text-xs sm:text-sm">
                  View Bag & Orders
                </Link>
                <a href="#category-products" className="btn-prime text-xs sm:text-sm">
                  Browse {products.length} Models
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. Product Catalog Grid (matching iNvent .listing-page-products) */}
      <section id="category-products" className="py-10 sm:py-14">
        <div className="container-xl">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200/80">
            <p className="text-xs sm:text-sm font-semibold text-gray-600">
              Showing <span className="font-bold text-black">{products.length}</span> {category.name} models available
            </p>
            <span className="text-xs text-[#0a8848] font-semibold bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full">
              ✓ Instant Cashback Applied
            </span>
          </div>

          {products.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-2xl border border-gray-200 p-8">
              <p className="text-gray-500 text-base font-medium">No products in this category currently.</p>
              <Link href="/contact" className="mt-3 inline-block font-semibold text-[#0071e3] hover:underline">
                Contact store for live stock updates &rarr;
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {products.map((p, i) => (
                <Reveal key={p.slug} delay={(i % 4) * 40}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Bottom Assurance Bar (matching Apple Authorized Reseller) */}
      <section className="bg-white py-12 border-t border-[#e6e6e6]">
        <div className="container-xl">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div className="p-4 rounded-xl bg-[#f8f8fa] border border-gray-200/80">
              <span className="text-xl">🛡️</span>
              <h4 className="text-sm font-bold text-black mt-2">1-Year Official Warranty</h4>
              <p className="text-xs text-gray-500 mt-1">Valid at all Apple Authorized Service Centers pan India</p>
            </div>
            <div className="p-4 rounded-xl bg-[#f8f8fa] border border-gray-200/80">
              <span className="text-xl">💳</span>
              <h4 className="text-sm font-bold text-black mt-2">No-Cost EMI Options</h4>
              <p className="text-xs text-gray-500 mt-1">Available across leading banks with zero down payment</p>
            </div>
            <div className="p-4 rounded-xl bg-[#f8f8fa] border border-gray-200/80">
              <span className="text-xl">🚚</span>
              <h4 className="text-sm font-bold text-black mt-2">Fast Delivery / In-Store Pickup</h4>
              <p className="text-xs text-gray-500 mt-1">Free same-day delivery in Pune or instant pickup at Jay Plaza</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
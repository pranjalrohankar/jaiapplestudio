import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductImage from "@/components/ProductImage";
import ProductCard from "@/components/ProductCard";
import AddToCartButton from "@/components/AddToCartButton";
import { WhatsAppButton, CallButton } from "@/components/EnquiryButtons";
import Reveal from "@/components/Reveal";
import { productBySlug, products, productsByCategory, categoryBySlug } from "@/lib/products";
import { CheckIcon, ChevronRightIcon } from "@/lib/icons";

type Params = Promise<{ slug: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: `${product.name} — ${product.price}`,
    description: `${product.tagline} ${product.description} Now at ${product.price}. Buy genuinly at Jai Apple Store, Pimpri-Chinchwad with No-Cost EMI and exchange offers.`,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();

  const category = categoryBySlug(product.category);
  const related = productsByCategory(product.category).filter((p) => p.slug !== slug).slice(0, 3);

  const isComingSoon =
    product.badge?.toLowerCase().includes("coming soon") ||
    product.price?.toLowerCase().includes("coming soon");

  return (
    <>
      <nav className="border-b border-black/[0.05] bg-cloud/60">
        <div className="container-px flex items-center gap-1.5 py-3 text-sm text-ink/55">
          <Link href="/" className="hover:text-apple">
            Home
          </Link>
          <ChevronRightIcon width={14} height={14} />
          <Link href={`/${product.category}`} className="hover:text-apple">
            {category?.name}
          </Link>
          <ChevronRightIcon width={14} height={14} />
          <span className="text-ink/80">{product.name}</span>
        </div>
      </nav>

      <section className="py-12 sm:py-16">
        <div className="container-px grid items-start gap-10 lg:grid-cols-2">
          <Reveal>
            <ProductImage product={product} className="aspect-square w-full rounded-[2rem]" priority />
          </Reveal>

          <Reveal delay={80}>
            {product.badge ? (
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold tracking-wider text-white mb-4 ${
                  isComingSoon
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md ring-1 ring-purple-400/40"
                    : "bg-apple"
                }`}
              >
                {isComingSoon ? (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                  </span>
                ) : null}
                {product.badge}
              </span>
            ) : null}
            <h1 className="text-display-md">{product.name}</h1>
            <p className="mt-2 text-xl text-ink/70">{product.tagline}</p>

            {isComingSoon ? (
              <div className="mt-5 rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-5 ring-1 ring-purple-200/80">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold tracking-tight text-purple-900">
                    Coming Soon
                  </span>
                  <span className="rounded-full bg-purple-200/80 px-3 py-1 text-xs font-bold text-purple-900 uppercase">
                    Official Launch
                  </span>
                </div>
                <p className="mt-2 text-sm text-purple-950/80">
                  Pre-bookings are now open! Reserve your device early to guarantee delivery on launch day with official 1-year Apple India warranty.
                </p>
              </div>
            ) : (
              <div className="mt-5 flex items-baseline gap-3">
                <span className="text-3xl font-semibold tracking-tight">{product.price}</span>
                {product.oldPrice ? (
                  <>
                    <span className="text-lg text-ink/40 line-through">{product.oldPrice}</span>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                      Save{" "}
                      {(() => {
                        const diff =
                          Number(product.price.replace(/[^\d]/g, "")) -
                          Number(product.oldPrice.replace(/[^\d]/g, ""));
                        return diff ? `₹${diff.toLocaleString("en-IN")}` : "";
                      })()}
                    </span>
                  </>
                ) : null}
              </div>
            )}
            <p className="mt-1 text-xs text-ink/50">
              {isComingSoon
                ? "*Official prices will be confirmed on release. Pre-book now for priority allocation."
                : "*Indicative price. Confirm today's best price with the store."}
            </p>

            <p className="mt-5 text-[17px] leading-relaxed text-ink/75">{product.description}</p>

            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-ink/50">Finishes</h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {product.colors.map((c) => (
                  <span key={c.name} className="flex items-center gap-2 rounded-full bg-cloud px-4 py-2 text-sm font-medium">
                    <span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c.hex }} />
                    {c.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {isComingSoon ? (
                <WhatsAppButton
                  productName={`${product.name} (Pre-Book Priority)`}
                  label="Pre-Book on WhatsApp"
                  className="btn-wa px-7 py-3.5 text-base font-bold shadow-lg shadow-emerald-950/20"
                />
              ) : (
                <AddToCartButton product={product} />
              )}
              <WhatsAppButton productName={product.name} label="Enquire" />
              <CallButton />
            </div>

            <div className="mt-8 rounded-2xl bg-cloud p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-ink/50">Highlights</h3>
              <ul className="mt-3 space-y-2.5">
                {product.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2.5 text-[15px] text-ink/80">
                    <CheckIcon width={18} height={18} className="mt-0.5 shrink-0 text-apple" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {related.length > 0 ? (
        <section className="bg-cloud py-16">
          <div className="container-px">
            <Link
              href={`/${product.category}`}
              className="text-2xl font-semibold tracking-tight hover:text-apple"
            >
              More {category?.name} →
            </Link>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <Reveal key={p.slug} delay={i * 60}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
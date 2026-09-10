import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ProductDetailConfigurator from "@/components/ProductDetailConfigurator";
import Reveal from "@/components/Reveal";
import {
  getProductBySlug,
  getAllProducts,
  getProductsByCategory,
  getCategoryBySlug,
} from "@/lib/server-products";
import { ChevronRightIcon } from "@/lib/icons";

type Params = Promise<{ slug: string }>;

export const dynamicParams = true;

export async function generateStaticParams() {
  const allProducts = await getAllProducts();
  return allProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found — Jai Apple Store" };
  return {
    title: `${product.name} — ${product.price} | Jai Apple Store`,
    description: `${product.tagline || ""} ${product.description || ""} Now at ${product.price}. Buy genuine Apple products at Jai Apple Store, Pimpri-Chinchwad with No-Cost EMI and exchange offers.`,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const category = await getCategoryBySlug(product.category);
  const allRelated = await getProductsByCategory(product.category);
  const related = allRelated.filter((p) => p.slug !== product.slug).slice(0, 3);

  return (
    <>
      {/* Breadcrumb Navigation */}
      <nav className="border-b border-black/[0.05] bg-[#f5f5f7]/60">
        <div className="container-px flex items-center gap-1.5 py-3 text-sm text-ink/55">
          <Link href="/" className="hover:text-apple transition">
            Home
          </Link>
          <ChevronRightIcon width={14} height={14} />
          <Link href={`/${product.category}`} className="hover:text-apple transition">
            {category?.name || product.category}
          </Link>
          <ChevronRightIcon width={14} height={14} />
          <span className="text-ink/85 font-medium">{product.name}</span>
        </div>
      </nav>

      {/* Main Interactive Product Configurator Section */}
      <section className="py-10 sm:py-16 bg-white">
        <div className="container-px">
          <ProductDetailConfigurator product={product} />
        </div>
      </section>

      {/* Related Products Section */}
      {related.length > 0 ? (
        <section className="bg-[#f5f5f7] py-16 sm:py-20 border-t border-black/[0.05]">
          <div className="container-px">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                Explore More {category?.name || "Related"} Models
              </h2>
              <Link
                href={`/${product.category}`}
                className="text-sm font-semibold text-apple hover:underline flex items-center gap-1"
              >
                View all <ChevronRightIcon width={14} height={14} />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
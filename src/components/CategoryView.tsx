import Link from "next/link";
import ChapterNav from "@/components/sections/ChapterNav";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { categoryBySlug, productsByCategory } from "@/lib/products";

export default function CategoryView({ slug }: { slug: string }) {
  const category = categoryBySlug(slug);
  if (!category) return null;

  const products = productsByCategory(slug);
  const accent = category.tint;

  // Render a specialized Hero section depending on the category to look like Apple
  return (
    <div className="bg-[#f5f5f7]">
      <ChapterNav />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white text-center pt-24 pb-16 sm:pt-32 sm:pb-24 border-b border-gray-200">
        <div className="container-px relative z-10">
          <Reveal>
            <h1 className="text-[56px] sm:text-[80px] font-semibold tracking-tighter leading-none mb-4" style={{ color: accent }}>
              {category.name}
            </h1>
            <p className="text-2xl sm:text-3xl font-medium tracking-tight text-gray-900 max-w-2xl mx-auto mb-8">
              {category.blurb}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="#lineup-models" className="btn-apple">
                Explore {category.name} Models
              </a>
              <Link href="/cart" className="btn-ghost">
                View Cart & Orders
              </Link>
            </div>
          </Reveal>
        </div>
        {/* Abstract background gradient or image placeholder to give it an Apple feel */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none"
             style={{ background: `radial-gradient(circle at 50% 0%, ${accent} 0%, transparent 70%)` }}>
        </div>
      </section>

      {/* Featured/Compare Section */}
      <section id="lineup-models" className="py-20 bg-white">
        <div className="container-px text-center">
          <Reveal>
            <h2 className="text-[40px] font-semibold tracking-tighter mb-16">Which {category.name} is right for you?</h2>
          </Reveal>
          
          {products.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-gray-500 text-xl font-medium">Catalog loading — check back soon.</p>
              <Link href="/contact" className="mt-4 inline-block font-semibold text-blue-600 hover:underline">
                Or ask us what&apos;s in stock
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 justify-center">
              {products.map((p, i) => (
                <Reveal key={p.slug} delay={(i % 4) * 50}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-24 bg-[#f5f5f7]">
        <div className="container-px">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
            <Reveal delay={100}>
              <div className="bg-white p-12 rounded-[2rem] shadow-sm text-center">
                <h3 className="text-2xl font-semibold mb-4">Why buy from Jai Apple Store?</h3>
                <p className="text-gray-600">Genuine Apple products with official warranties. Best-in-class service, exchange offers, and expert advice right here in Pimpri-Chinchwad.</p>
              </div>
            </Reveal>
            <Reveal delay={200}>
              <div className="bg-white p-12 rounded-[2rem] shadow-sm text-center">
                <h3 className="text-2xl font-semibold mb-4">Flexible EMI Options</h3>
                <p className="text-gray-600">Take home your dream {category.name} today. We offer No-Cost EMI across major credit cards and finance partners.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
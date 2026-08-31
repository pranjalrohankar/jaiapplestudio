import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { featured, categories } from "@/lib/products";

export default function Lineup() {
  const chips = [
    "No-Cost EMI on all banks",
    "Exchange your old phone",
    "Free delivery within Pune",
    "GST invoice for businesses",
  ];

  return (
    <section id="lineup" className="py-20 sm:py-28">
      <div className="container-px">
        <Reveal>
          <div className="text-center">
            <h2 className="text-display-md">Explore the lineup.</h2>
            <p className="mx-auto mt-3 max-w-lg text-ink/65">
              Every model, every colour, in stock. Check out the full iPhone range
              and get the best deal in town.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {chips.map((c) => (
                <span key={c} className="chip bg-cloud text-ink/80">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <Reveal key={p.slug} delay={i * 60}>
              <ProductCard product={p} />
            </Reveal>
          ))}
          <Reveal delay={featured.length * 60}>
            <Link
              href="/iphone"
              className="group flex h-full min-h-[220px] flex-col items-start justify-center gap-3 rounded-3xl bg-ink p-8 text-white transition hover:scale-[1.01]"
            >
              <span className="text-2xl font-semibold tracking-tight">View all iPhones</span>
              <span className="text-sm text-white/60">
                {categories.find((c) => c.slug === "iphone")?.blurb}
              </span>
              <span className="mt-2 inline-flex items-center gap-1 font-semibold text-white group-hover:underline">
                See the lineup →
              </span>
            </Link>
          </Reveal>
        </div>

        <Reveal className="mt-6">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/iphone" className="btn-apple">
              Browse all products
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
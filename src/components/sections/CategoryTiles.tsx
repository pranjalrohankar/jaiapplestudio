import Link from "next/link";
import Reveal from "@/components/Reveal";
import { categories } from "@/lib/products";

export default function CategoryTiles() {
  const tiles = categories.filter((c) => c.slug !== "iphone");

  return (
    <section className="py-20 sm:py-28">
      <div className="container-px">
        <Reveal>
          <h2 className="text-center text-display-md">The whole Apple family.</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-ink/65">
            From MacBooks to AirPods — we stock the complete Apple ecosystem.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((c, i) => (
            <Reveal key={c.slug} delay={i * 50}>
              <Link
                href={`/${c.slug}`}
                className="group relative flex h-52 flex-col justify-between overflow-hidden rounded-3xl p-7 text-white transition duration-300 hover:-translate-y-1"
                style={{ backgroundColor: c.tint }}
              >
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 transition group-hover:scale-125" />
                <div className="relative">
                  <h3 className="text-2xl font-semibold tracking-tight">{c.name}</h3>
                  <p className="mt-2 max-w-[240px] text-sm text-white/85">{c.blurb}</p>
                </div>
                <span className="relative inline-flex items-center gap-1 font-semibold text-white group-hover:gap-2">
                  Browse {c.name} <span aria-hidden>→</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
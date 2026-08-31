import Link from "next/link";
import { categories } from "@/lib/products";

/** Sticky chapter nav — product family thumbnails, like Apple's site. */
export default function ChapterNav() {
  return (
    <div className="sticky top-[92px] z-40 border-b border-gray-200 bg-white/90 backdrop-blur-md">
      <div className="container-px flex gap-8 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden justify-center">
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={`/${c.slug}`}
            className="group flex flex-col items-center gap-1 transition-opacity hover:opacity-70"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors">
              {c.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
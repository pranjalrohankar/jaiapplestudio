import Image from "next/image";
import Reveal from "@/components/Reveal";
import { store } from "@/lib/store";
import { StarIcon, ChevronRightIcon } from "@/lib/icons";

const reviews = [
  {
    name: "Siddharth Sahota",
    city: "Pimpri, Pune",
    device: "iPhone 16 Pro Max 256GB Desert Titanium",
    text: "I bought my iPhone from here and the entire process was super smooth. The store staff was very helpful, explained the No-Cost EMI transparently, and transferred all data from my older phone within 15 minutes. Best Apple store in PCMC!",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
  },
  {
    name: "Pooja Deshmukh",
    city: "Wakad, Pune",
    device: "MacBook Air M3 15-inch Midnight",
    text: "Great store with fantastic customer service! Got my MacBook Air for my college studies along with the student discount and bank cashback. Genuine warranty verified directly on Apple's portal on spot.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
  },
  {
    name: "Rahul Verma",
    city: "Chinchwad, Pune",
    device: "Apple Watch Ultra 2 + AirPods Pro",
    text: "Purchased Apple Watch Ultra 2 with trade-in of my Series 7. They gave the highest exchange value compared to online trade-in programs and provided genuine invoice for my company's GST return.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80",
  },
];

export default function Reviews() {
  return (
    <section className="bg-[#f8f8fa] py-16 sm:py-24 border-t border-gray-200/80">
      <div className="container-xl">
        <Reveal>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111111]">
              Customer Reviews
            </h2>
            <div className="mt-2 flex items-center justify-center gap-1.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} width={18} height={18} />
              ))}
              <span className="ml-1 text-sm font-bold text-gray-700">
                {store.rating} / 5.0 on Google ({store.ratingCount}+ reviews)
              </span>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {reviews.map((r, i) => (
            <Reveal key={r.name} delay={i * 60}>
              <div className="flex flex-col justify-between rounded-2xl bg-white p-6 sm:p-7 border border-[#e6e6e6] shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-300 h-full">
                <div>
                  {/* Quote SVG */}
                  <svg
                    className="h-8 w-8 text-[#0071e3]/20 mb-3"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed italic">
                    &ldquo;{r.text}&rdquo;
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full shrink-0 border border-gray-200">
                    <Image
                      src={r.avatar}
                      alt={r.name || "Customer Review"}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#111111]">
                      {r.name}
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      {r.device} · {r.city}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 text-center">
          <a
            href={store.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0071e3] hover:underline"
          >
            Read all verified Google reviews <ChevronRightIcon width={14} height={14} />
          </a>
        </Reveal>
      </div>
    </section>
  );
}
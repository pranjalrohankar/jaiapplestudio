import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import { store } from "@/lib/store";
import { MapPinIcon, PhoneIcon, ClockIcon } from "@/lib/icons";

export default function StoreBanner() {
  return (
    <section className="bg-[#f8f8fa] py-16 sm:py-24 border-b border-gray-200/80">
      <div className="container-xl">
        <Reveal>
          <div className="overflow-hidden rounded-3xl bg-white border border-[#e6e6e6] shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="grid lg:grid-cols-12 items-center">
              {/* Image Side */}
              <div className="relative h-64 sm:h-80 lg:h-full lg:min-h-[380px] lg:col-span-6 overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=1200&q=80"
                  alt="Jai Apple Store Retail Experience"
                  fill
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
                <div className="absolute bottom-4 left-4 lg:hidden text-white">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#0071e3] px-3 py-1 text-xs font-bold text-white">
                    📍 Pimpri Colony, Pune
                  </span>
                </div>
              </div>

              {/* Text Side */}
              <div className="p-8 sm:p-12 lg:col-span-6 flex flex-col justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3]/10 px-3.5 py-1 text-xs font-bold text-[#0071e3] w-fit mb-3">
                  PHYSICAL STORE EXPERIENCE
                </span>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#111111]">
                  {store.name} Near You.
                </h3>
                <p className="mt-2 text-sm sm:text-base text-gray-600 leading-relaxed">
                  Visit our flagship store in Pimpri-Chinchwad to experience all Apple devices hands-on. Get instant demos, data transfer, exchange valuation, and special offline store discounts.
                </p>

                <div className="mt-6 space-y-2.5 text-xs sm:text-sm text-gray-600 border-t border-gray-100 pt-5">
                  <p className="flex items-center gap-2">
                    <MapPinIcon width={16} height={16} className="text-[#0071e3] shrink-0" />
                    <span>{store.address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <ClockIcon width={16} height={16} className="text-[#0071e3] shrink-0" />
                    <span>Open all 7 days: {store.timings}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <PhoneIcon width={16} height={16} className="text-[#0071e3] shrink-0" />
                    <a href={`tel:${store.phoneIntl}`} className="font-semibold text-black hover:text-[#0071e3]">
                      Call Store: {store.phoneDisplay}
                    </a>
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href={store.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-prime px-7 py-3"
                  >
                    Get Store Directions &rarr;
                  </a>
                  <Link
                    href="/contact"
                    className="btn-outline-dark px-6 py-3"
                  >
                    Contact Store Team
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

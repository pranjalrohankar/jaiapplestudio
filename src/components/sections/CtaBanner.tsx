import { store, waLink } from "@/lib/store";
import { WhatsAppIcon, MapPinIcon, ClockIcon, ChevronRightIcon } from "@/lib/icons";

export default function CtaBanner() {
  return (
    <section className="pb-20 sm:pb-28">
      <div className="container-px">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-14 text-center text-white sm:px-12 sm:py-20">
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-apple/30 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-wa/20 blur-3xl" />

          <div className="relative">
            <h2 className="text-display-md">Get your new Apple device today.</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              Browse the catalog, choose your model and finishes, add to cart, and confirm your order for instant store pickup or delivery in Pune.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/iphone"
                className="btn-apple !bg-white !text-ink hover:!bg-slate-100"
              >
                Browse Products & Add to Cart
              </a>
              <a
                href={store.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost !border-white/25 !text-white hover:!border-white"
              >
                <MapPinIcon width={18} height={18} />
                Get directions
              </a>
            </div>

            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-white/60">
              <ClockIcon width={16} height={16} />
              {store.timings}
            </p>

            <a
              href="/contact"
              className="mt-8 inline-flex items-center gap-1 font-semibold text-white/90 hover:underline"
            >
              Or visit the store page <ChevronRightIcon width={16} height={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
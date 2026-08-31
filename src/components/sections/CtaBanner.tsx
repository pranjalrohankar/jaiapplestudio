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
            <h2 className="text-display-md">Get your new device today.</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              Message us on WhatsApp for today&apos;s best price, available stock and
              exchange deals. We usually reply within minutes.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={waLink(`Hi ${store.name}! I'd like today's best price and offers.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-wa"
              >
                <WhatsAppIcon width={18} height={18} />
                Chat on WhatsApp
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
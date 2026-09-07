import Image from "next/image";
import Link from "next/link";
import { store, waLink } from "@/lib/store";
import { iphoneHeroImage } from "@/lib/products";
import { PhoneIcon, WhatsAppIcon } from "@/lib/icons";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cloud to-white">
      <div className="container-px pt-16 text-center sm:pt-24">
        <span className="chip">{store.name} · {store.city}</span>
        <h1 className="mt-6 text-display text-ink">iPhone.</h1>
        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink/70 sm:text-xl">
          {store.tagline}. 100% genuine Apple products, best prices, No-Cost EMI,
          exchange offers and 1-year warranty.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/iphone" className="btn-apple">
            Explore the lineup
          </Link>
          <Link href="/cart" className="btn-ghost">
            View Cart & Orders
          </Link>
          <a href="tel:+918888683101" className="btn-ghost">
            <PhoneIcon width={18} height={18} />
            {store.phoneDisplay}
          </a>
        </div>
      </div>

      <div className="relative mx-auto mt-10 flex max-w-4xl justify-center px-6">
        <Image
          src={iphoneHeroImage}
          alt="iPhone 17 Pro"
          width={1600}
          height={900}
          priority
          className="h-auto w-full max-w-3xl object-contain"
        />
      </div>
    </section>
  );
}
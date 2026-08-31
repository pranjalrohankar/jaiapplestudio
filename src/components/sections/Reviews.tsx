import Reveal from "@/components/Reveal";
import { store } from "@/lib/store";
import { StarIcon, ChevronRightIcon } from "@/lib/icons";

export default function Reviews() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container-px">
        <div className="mx-auto max-w-3xl rounded-[2rem] bg-cloud p-8 text-center sm:p-12">
          <Reveal>
            <div className="flex items-center justify-center gap-1 text-4xl text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon key={i} width={28} height={28} />
              ))}
            </div>
            <h2 className="mt-4 text-display-md">
              <span className="text-amber-500">{store.rating}</span> on Google
            </h2>
            <p className="mx-auto mt-3 max-w-md text-ink/65">
              {store.ratingCount}+ customers across Pimpri-Chinchwad trust us for
              genuine Apple products, honest prices and great support.
            </p>
            <a
              href={store.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-apple mt-7"
            >
              Read our Google reviews
              <ChevronRightIcon width={18} height={18} />
            </a>
            <p className="mt-3 text-xs text-ink/45">
              Reviews embed: we&apos;ll connect your Google Business reviews here — ask us after launch.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
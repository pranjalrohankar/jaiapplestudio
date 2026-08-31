import Link from "next/link";
import { waLink, store } from "@/lib/store";
import { WhatsAppIcon } from "@/lib/icons";

export default function NotFound() {
  return (
    <section className="py-28 text-center">
      <div className="container-px">
        <p className="text-[15rem] font-semibold leading-none text-cloud">404</p>
        <h1 className="text-display-md">This page is missing.</h1>
        <p className="mx-auto mt-3 max-w-md text-ink/65">
          Not to worry — ask us on WhatsApp and we&apos;ll point you to the right product.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className="btn-apple">
            Go to home
          </Link>
          <a
            href={waLink(`Hi ${store.name}! I couldn't find a page and need help.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-wa"
          >
            <WhatsAppIcon width={18} height={18} />
            Ask on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
import type { Metadata } from "next";
import EnquiryForm from "@/components/EnquiryForm";
import { store, telLink, mailLink, waLink, mapEmbedUrl } from "@/lib/store";
import {
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  ClockIcon,
  WhatsAppIcon,
  CheckIcon,
  ChevronRightIcon,
} from "@/lib/icons";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Contact & Store Location",
  description: `Visit ${store.name} at ${store.address}. Open ${store.timings}. Call ${store.phoneDisplay}, WhatsApp or email ${store.email}.`,
};

const offers = [
  "No-Cost EMI",
  "Exchange offers",
  "Delivery within Pune",
  "Free setup & data transfer",
  "GST invoice",
  "1-year warranty",
];

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-black/5 bg-cloud">
        <div className="container-px py-16 text-center sm:py-20">
          <h1 className="text-display-md">Visit the store.</h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-ink/65">
            Come try the devices in hand, or reach out and we&apos;ll help you find the
            perfect Apple product.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-px grid gap-10 lg:grid-cols-2">
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-cloud p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-apple">
                  <MapPinIcon width={22} height={22} />
                </span>
                <h3 className="mt-4 font-semibold">Address</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">
                  {store.addressLines[0]}
                  <br />
                  {store.addressLines[1]}
                </p>
              </div>
              <div className="rounded-3xl bg-cloud p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-apple">
                  <ClockIcon width={22} height={22} />
                </span>
                <h3 className="mt-4 font-semibold">Hours</h3>
                <p className="mt-2 text-sm text-ink/65">{store.timings}</p>
              </div>
              <div className="rounded-3xl bg-cloud p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-apple">
                  <PhoneIcon width={22} height={22} />
                </span>
                <h3 className="mt-4 font-semibold">Call / WhatsApp</h3>
                <a href={telLink} className="mt-2 block text-sm font-semibold text-apple hover:underline">
                  {store.phoneDisplay}
                </a>
                <a
                  href={waLink(`Hi ${store.name}! I have a question.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-wa-dark hover:underline"
                >
                  <WhatsAppIcon width={15} height={15} />
                  Chat on WhatsApp
                </a>
              </div>
              <div className="rounded-3xl bg-cloud p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-apple">
                  <MailIcon width={22} height={22} />
                </span>
                <h3 className="mt-4 font-semibold">Email</h3>
                <a href={mailLink} className="mt-2 block break-all text-sm font-semibold text-apple hover:underline">
                  {store.email}
                </a>
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-cloud p-6">
              <h3 className="font-semibold">What we offer</h3>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {offers.map((o) => (
                  <li key={o} className="flex items-center gap-2.5 text-sm text-ink/70">
                    <CheckIcon width={16} height={16} className="shrink-0 text-apple" />
                    {o}
                  </li>
                ))}
              </ul>
              <a
                href={store.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-1 font-semibold text-apple hover:underline"
              >
                Open in Google Maps <ChevronRightIcon width={16} height={16} />
              </a>
            </div>
          </div>

          <div>
            <EnquiryForm />
          </div>
        </div>

        <div className="container-px mt-10 overflow-hidden rounded-3xl ring-1 ring-black/[0.05]">
          <iframe
            src={mapEmbedUrl}
            title={`${store.name} location`}
            className="h-[380px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "Where is Jai Apple Store located?",
              acceptedAnswer: {
                "@type": "Answer",
                text: `${store.name} is at ${store.address}.`,
              },
            },
            {
              "@type": "Question",
              name: "Do you offer No-Cost EMI on Apple products?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes, we offer No-Cost EMI on all major bank cards, plus exchange offers and delivery within Pune.",
              },
            },
            {
              "@type": "Question",
              name: "Are your products genuine?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Yes, all products are 100% genuine Apple with full manufacturer warranty.",
              },
            },
          ],
        }}
      />
    </>
  );
}
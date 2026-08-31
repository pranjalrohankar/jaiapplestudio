import Link from "next/link";
import { store, waLink, telLink, mailLink } from "@/lib/store";
import { categories } from "@/lib/products";
import { MapPinIcon, PhoneIcon, MailIcon, ClockIcon, WhatsAppIcon, StarIcon } from "@/lib/icons";

const explore = categories.map((c) => ({ href: `/${c.slug}`, label: c.name }));

export default function Footer() {
  return (
    <footer className="bg-cloud">
      <div className="container-px py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-ink text-sm font-bold text-white">
                J
              </span>
              <span className="text-lg font-semibold tracking-tight">{store.name}</span>
            </div>
            <p className="mt-3 text-sm text-ink/60">{store.tagline} — genuine Apple products at the best price in Pimpri-Chinchwad.</p>
            <p className="mt-4 flex items-center gap-2 text-sm text-ink/60">
              <StarRow />
              <span>
                <strong>{store.rating}</strong> on Google · {store.ratingCount} reviews
              </span>
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink">Shop</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink/65">
              {explore.map((e) => (
                <li key={e.href}>
                  <Link href={e.href} className="hover:text-apple">
                    {e.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/contact" className="hover:text-apple">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink">Why shop with us</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink/65">
              <li>100% genuine + 1-yr warranty</li>
              <li>No-Cost EMI options</li>
              <li>Exchange offers</li>
              <li>{store.deliveryNote}</li>
              <li>Free setup & data transfer</li>
              <li>GST invoice for businesses</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-ink">Visit the store</h4>
            <ul className="mt-3 space-y-2.5 text-sm text-ink/65">
              <li className="flex gap-2.5">
                <MapPinIcon width={18} className="mt-0.5 shrink-0 text-apple" />
                <span>{store.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <ClockIcon width={18} className="shrink-0 text-apple" />
                <span>{store.timings}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <PhoneIcon width={18} className="shrink-0 text-apple" />
                <a href={telLink} className="hover:text-apple">
                  {store.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MailIcon width={18} className="shrink-0 text-apple" />
                <a href={mailLink} className="break-all hover:text-apple">
                  {store.email}
                </a>
              </li>
              <li>
                <a
                  href={waLink(`Hi ${store.name}! I have a question.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-2 font-semibold text-wa-dark hover:underline"
                >
                  <WhatsAppIcon width={16} />
                  Chat on WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-black/10">
        <div className="container-px flex flex-col gap-3 py-6 text-[13px] text-ink/55 md:flex-row md:items-center md:justify-between">
          <p>
            Copyright © {new Date().getFullYear()} {store.name}. All rights reserved.
          </p>
          <p>
            Apple, the Apple logo, iPhone, iPad, Mac, Apple Watch and AirPods are trademarks of Apple
            Inc. {store.name} is an independent reseller and is not affiliated with Apple Inc.
          </p>
        </div>
      </div>
    </footer>
  );
}

function StarRow() {
  return (
    <span className="flex text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon key={i} />
      ))}
    </span>
  );
}
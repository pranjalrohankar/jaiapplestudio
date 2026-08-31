import { store, waLink, productMessage, telLink } from "@/lib/store";
import { PhoneIcon, WhatsAppIcon } from "@/lib/icons";

export function WhatsAppButton({
  productName,
  label = "Enquire on WhatsApp",
  className = "btn-wa",
}: {
  productName?: string;
  label?: string;
  className?: string;
}) {
  const href = waLink(productName ?? `Hi ${store.name}! ${store.tagline}.`);
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      <WhatsAppIcon width={18} height={18} />
      {label}
    </a>
  );
}

export function CallButton({
  label = "Call the Store",
  className = "btn-apple",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <a href={telLink} className={className}>
      <PhoneIcon width={18} height={18} />
      {label}
    </a>
  );
}

/** Full set of enquiry actions used on product cards & detail pages. */
export default function EnquiryButtons({
  productName,
  compact = false,
}: {
  productName?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <WhatsAppButton productName={productName} label="Enquire" className="btn-wa px-5 py-2 text-[15px]" />
        <CallButton label="Call" className="btn-ghost px-5 py-2 text-[15px]" />
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-3">
      <WhatsAppButton productName={productName ?? productMessage(store.name)} />
      <CallButton />
    </div>
  );
}
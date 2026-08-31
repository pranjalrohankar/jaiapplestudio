/**
 * STORE CONFIG — edit everything about the store in one place.
 * No need to touch code elsewhere after this file.
 */

export type StoreConfig = {
  name: string;
  tagline: string;
  phoneDisplay: string;
  phoneIntl: string;
  whatsappNumber: string;
  email: string;
  address: string;
  addressLines: string[];
  city: string;
  mapUrl: string;
  timings: string;
  rating: string;
  ratingCount: string;
  deliveryNote: string;
  gstInvoice: boolean;
  formspreeEndpoint: string;
};

export const store: StoreConfig = {
  name: "Jai Apple Store",
  tagline: "Your one stop solution",
  phoneDisplay: "+91 88886 83101",
  phoneIntl: "+918888683101",
  whatsappNumber: "918888683101",
  email: "jaiapplestore@gmail.com",
  address:
    "Jay Plaza, Sai Chowk, near Sai Mandir, Pimpri Colony, Pimpri-Chinchwad, Maharashtra 411017",
  addressLines: [
    "Jay Plaza, Sai Chowk, near Sai Mandir",
    "Pimpri Colony, Pimpri-Chinchwad, Maharashtra 411017",
  ],
  city: "Pimpri-Chinchwad, Pune",
  mapUrl: "https://share.google/i3mbNWQksPOhNnCww",
  timings: "Open daily · 11 AM – 11 PM",
  rating: "4.9",
  ratingCount: "120+",
  deliveryNote: "Delivery within Pune",
  gstInvoice: true,
  formspreeEndpoint: "",
};

/** Build a WhatsApp deep-link with a pre-filled message. */
export function waLink(message: string): string {
  const text = encodeURIComponent(message);
  return `https://wa.me/${store.whatsappNumber}?text=${text}`;
}

export const telLink = `tel:${store.phoneIntl}`;
export const mailLink = `mailto:${store.email}`;

/** Generic Google Maps embed URL built from the store address (no API key). */
export const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
  store.address,
)}&output=embed`;

export function productMessage(productName: string): string {
  return `Hi ${store.name}! I'm interested in ${productName}. Could you share the price and availability?`;
}

export function contactMessage(): string {
  return `Hi ${store.name}! I'd like to know more about your Apple products and current offers.`;
}
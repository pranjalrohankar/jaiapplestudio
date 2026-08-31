import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import { store } from "@/lib/store";

const title = `${store.name} — Your One Stop Apple Solution | iPhone, Mac, iPad, Watch, AirPods`;
const description =
  `${store.name}, ${store.city}. 100% genuine Apple products — iPhone, Mac, iPad, Apple Watch, AirPods & accessories. ` +
  `No-Cost EMI, exchange offers, 1-year warranty, free setup and ${store.deliveryNote.toLowerCase()}. Enquire on WhatsApp at ${store.phoneDisplay}.`;

export const metadata: Metadata = {
  metadataBase: new URL("https://jaiapplestore.com"),
  title: {
    default: title,
    template: `%s — ${store.name}`,
  },
  description,
  keywords: [
    "Apple store Pimpri-Chinchwad",
    "iPhone price Pimpri",
    "MacBook dealer Pune",
    "iPad store PMP",
    "Apple reseller",
    "No cost EMI iPhone",
    "iPhone exchange offer",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full scroll-smooth antialiased">
      <body className="flex min-h-full flex-col">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
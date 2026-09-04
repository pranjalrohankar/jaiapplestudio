import Hero from "@/components/sections/Hero";
import LaunchBanner from "@/components/sections/LaunchBanner";
import ChapterNav from "@/components/sections/ChapterNav";
import Lineup from "@/components/sections/Lineup";
import WhyShop from "@/components/sections/WhyShop";
import CategoryTiles from "@/components/sections/CategoryTiles";
import Features from "@/components/sections/Features";
import Reviews from "@/components/sections/Reviews";
import CtaBanner from "@/components/sections/CtaBanner";
import JsonLd from "@/components/JsonLd";
import { store, telLink, mailLink } from "@/lib/store";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ElectronicsStore",
  name: store.name,
  slogan: store.tagline,
  image: "",
  telephone: store.phoneDisplay,
  email: store.email,
  url: "https://jaiapplestore.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Jay Plaza, Sai Chowk",
    addressLocality: "Pimpri Colony, Pimpri-Chinchwad",
    addressRegion: "Maharashtra",
    postalCode: "411017",
    addressCountry: "IN",
  },
  geo: { "@type": "GeoCoordinates" },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "11:00",
    closes: "23:00",
  },
  priceRange: "₹₹",
  sameAs: [telLink, mailLink],
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <ChapterNav />
      <LaunchBanner />
      <Lineup />
      <WhyShop />
      <CategoryTiles />
      <Features />
      <Reviews />
      <CtaBanner />
      <JsonLd data={jsonLd} />
    </>
  );
}
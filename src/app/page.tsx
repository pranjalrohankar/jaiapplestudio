import Hero from "@/components/sections/Hero";
import CategoryTiles from "@/components/sections/CategoryTiles";
import OfferBanners from "@/components/sections/OfferBanners";
import Lineup from "@/components/sections/Lineup";
import WhyShop from "@/components/sections/WhyShop";
import StoreBanner from "@/components/sections/StoreBanner";
import Reviews from "@/components/sections/Reviews";
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
      {/* 1. Hero Slider (Top Product Carousel) */}
      <Hero />

      {/* 2. Explore by Category Icon Strip */}
      <CategoryTiles />

      {/* 3. Promotional Offer Banners & Posters (Dedicated Section) */}
      <OfferBanners />

      {/* 4. Trending Now / Featured Products */}
      <Lineup />

      {/* 5. Why Shop With Us (4-USPs) */}
      <WhyShop />

      {/* 6. Physical Store Showcase */}
      <StoreBanner />

      {/* 7. Customer Testimonials & Reviews */}
      <Reviews />

      {/* 8. SEO Structured Data */}
      <JsonLd data={jsonLd} />
    </>
  );
}
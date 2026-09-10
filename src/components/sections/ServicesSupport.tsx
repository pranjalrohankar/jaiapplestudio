import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import { store, telLink } from "@/lib/store";
import { ChevronRightIcon } from "@/lib/icons";

const services = [
  {
    title: "Customer Support",
    description: "Experience Apple products hands-on with personalized assistance, setup, and troubleshooting.",
    cta: "Talk to an Expert",
    href: `tel:${store.phoneIntl}`,
    isExternal: true,
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    tag: "Free Expert Guidance",
  },
  {
    title: "Student & Teacher Offer",
    description: "Exclusive discount of up to 6% OFF on Mac & iPad for students, university faculty, and teachers.",
    cta: "Check Eligibility",
    href: "/contact",
    isExternal: false,
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
    tag: "Save Up To 6%",
  },
  {
    title: "Small Medium Business (SMB)",
    description: "Exclusive enterprise deals, bulk volume pricing, official GST credit invoicing, and dedicated account manager.",
    cta: "Business Enquiries",
    href: "/contact",
    isExternal: false,
    image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80",
    tag: "GST Invoice & Credit",
  },
];

export default function ServicesSupport() {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="container-xl">
        <Reveal>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111111]">
              Services & Support
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
              Everything you need for a seamless and delightful Apple experience
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {services.map((item, i) => (
            <Reveal key={item.title} delay={i * 60}>
              <div className="group overflow-hidden rounded-2xl bg-white border border-[#e6e6e6] transition-all duration-300 hover:shadow-xl hover:border-gray-300 flex flex-col h-full">
                {/* Image Container */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <Image
                    src={item.image}
                    alt={item.title || "Apple Service"}
                    fill
                    sizes="(max-width: 768px) 100vw, 400px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-black/75 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                    {item.tag}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-lg font-bold text-[#111111] group-hover:text-[#0071e3] transition">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-gray-500 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100">
                    {item.isExternal ? (
                      <a
                        href={item.href}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0071e3] hover:underline"
                      >
                        {item.cta} <ChevronRightIcon width={14} height={14} />
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0071e3] hover:underline"
                      >
                        {item.cta} <ChevronRightIcon width={14} height={14} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

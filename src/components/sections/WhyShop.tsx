import Link from "next/link";
import Reveal from "@/components/Reveal";
import { store } from "@/lib/store";

const usps = [
  {
    icon: (
      <svg className="w-10 h-10 text-[#0071e3]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Authorized Reseller",
    description: "100% Genuine Apple products with full manufacturer warranty & AppleCare support",
  },
  {
    icon: (
      <svg className="w-10 h-10 text-[#0071e3]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
    title: "Flexible Payment Options",
    description: "Multiple payment options including No-Cost EMI, UPI, Cards, Netbanking & Cash",
  },
  {
    icon: (
      <svg className="w-10 h-10 text-[#0071e3]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.67 2.67 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.07a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.094.479.1 1.004-.07 1.543l-4.59 4.59" />
      </svg>
    ),
    title: "Expert Apple Support",
    description: "Certified technicians, free device setup, and seamless data transfer assistance",
  },
  {
    icon: (
      <svg className="w-10 h-10 text-[#0071e3]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    title: "Fast Doorstep Delivery",
    description: "Free same-day doorstep delivery across Pune or instant pickup at Jay Plaza store",
  },
];

export default function WhyShop() {
  return (
    <section className="bg-[#f8f8fa] py-16 sm:py-24 border-y border-gray-200/80">
      <div className="container-xl">
        <Reveal>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111111]">
              Why Shop with {store.name}?
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-500 max-w-2xl mx-auto">
              Experience the seamless integration of genuine Apple hardware, expert support, and unmatched local customer care
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {usps.map((usp, i) => (
            <Reveal key={usp.title} delay={i * 50}>
              <div className="h-full rounded-2xl bg-white p-6 sm:p-7 border border-[#e6e6e6] text-center transition-all duration-300 hover:shadow-md hover:border-gray-300 flex flex-col items-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0071e3]/10">
                  {usp.icon}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#111111]">
                  {usp.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-gray-500 leading-relaxed">
                  {usp.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 text-center">
          <Link href="/iphone" className="btn-dark px-8 py-3.5">
            Shop Now
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
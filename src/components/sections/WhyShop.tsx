import Reveal from "@/components/Reveal";
import { store } from "@/lib/store";
import {
  ShieldIcon,
  CreditCardIcon,
  RefreshIcon,
  TruckIcon,
  WrenchIcon,
  BoxIcon,
} from "@/lib/icons";

const benefits = [
  {
    icon: ShieldIcon,
    title: "100% genuine & warranty",
    text: "All products are Apple genuine with full manufacturer warranty. AppleCare plans also available.",
  },
  {
    icon: CreditCardIcon,
    title: "No-Cost EMI",
    text: "Buy on No-Cost EMI with all major banks, plus UPI, debit/credit cards and net banking.",
  },
  {
    icon: RefreshIcon,
    title: "Exchange offers",
    text: "Trade in your old phone and save. We accept all brands and give instant credit.",
  },
  {
    icon: TruckIcon,
    title: "Delivery within Pune",
    text: `${store.deliveryNote}. Quick doorstep delivery or easy in-store pickup.`,
  },
  {
    icon: WrenchIcon,
    title: "Free setup & support",
    text: "Free data transfer, setup help, and friendly after-sales support at our store.",
  },
  {
    icon: BoxIcon,
    title: "GST invoice",
    text: store.gstInvoice
      ? "Get a proper GST invoice for business buyers without any hassle."
      : "Proper invoice provided with every purchase.",
  },
];

export default function WhyShop() {
  return (
    <section className="border-y border-black/5 bg-cloud py-20 sm:py-28">
      <div className="container-px">
        <Reveal>
          <h2 className="text-center text-display-md">Why shop at Jai Apple Store?</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-ink/65">
            Buying an Apple product should be simple and worry-free. Here&apos;s what
            you get when you shop with us.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, i) => (
            <Reveal key={b.title} delay={i * 50}>
              <div className="h-full rounded-3xl bg-white p-7 shadow-[0_2px_4px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.04] transition duration-300 hover:shadow-[0_16px_32px_-16px_rgba(0,0,0,0.16)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cloud text-ink">
                  <b.icon width={24} height={24} />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{b.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink/65">{b.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
import Reveal from "@/components/Reveal";
import {
  SparklesIcon,
  CameraIcon,
  ShieldIcon,
  BadgeIcon,
  TruckIcon,
  CreditCardIcon,
} from "@/lib/icons";

const features = [
  {
    icon: SparklesIcon,
    title: "Beautiful design",
    text: "Liquid-glass, premium materials and iconic Apple design that just feels right in your hand.",
  },
  {
    icon: CameraIcon,
    title: "Cameras you'll love",
    text: "Super-high-resolution photography and cinematic-quality video — automatic, every single shot.",
  },
  {
    icon: ShieldIcon,
    title: "Built to last",
    text: "Ceramic-grade glass, titanium and aluminium bodies, and years of software updates keep it feeling new.",
  },
  {
    icon: BadgeIcon,
    title: "Incredible battery",
    text: "Huge battery life from the industry's most efficient silicon — all-day, real-world performance.",
  },
  {
    icon: CreditCardIcon,
    title: "Trade-in value",
    text: "iPhones hold their value longer, and with our exchange offers, upgrading is easier than ever.",
  },
  {
    icon: TruckIcon,
    title: "Apple ecosystem",
    text: "iPhone, Mac, iPad, Watch and AirPods work seamlessly together with one-tap setup.",
  },
];

export default function Features({ heading = "Why iPhone?" }: { heading?: string }) {
  return (
    <section className="border-y border-black/5 bg-cloud py-20 sm:py-28">
      <div className="container-px">
        <Reveal>
          <h2 className="text-center text-display-md">{heading}</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-ink/65">
            The features that make iPhone leagues ahead.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 50}>
              <div className="h-full rounded-3xl bg-white p-7 ring-1 ring-black/[0.04] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_32px_-16px_rgba(0,0,0,0.16)]">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cloud text-ink">
                  <f.icon width={24} height={24} />
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink/65">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
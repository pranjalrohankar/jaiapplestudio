import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const PhoneIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const WhatsAppIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.83 14.12c-.25.7-1.45 1.33-2 1.38-.51.05-1.15.07-1.86-.12-.43-.11-.98-.32-1.69-.62-2.98-1.29-4.92-4.3-5.07-4.5-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.6-.37.8-.37h.57c.18.01.43-.07.66.5.25.6.84 2.06.91 2.21.07.15.12.33.02.53-.09.2-.14.32-.28.5l-.42.5c-.14.14-.29.3-.13.58.16.28.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.17-.19.7-.81.88-1.09.18-.28.37-.23.62-.14.25.09 1.6.75 1.87.89.28.14.47.21.54.32.06.11.06.65-.19 1.35z" />
  </svg>
);

export const MailIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <path d="m22 6-10 7L2 6" />
  </svg>
);

export const MapPinIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const ClockIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

export const StarIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export const ChevronRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const MenuIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </svg>
);

export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const ShieldIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const TruckIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M14 17H2V7a2 2 0 0 1 2-2h10v12z" />
    <path d="M14 9h4l3 4v4h-7" />
    <circle cx="7.5" cy="17.5" r="1.8" />
    <circle cx="17.5" cy="17.5" r="1.8" />
  </svg>
);

export const BadgeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="6" />
    <path d="M12 5v3l2 1" />
    <path d="m8.5 14-1 7 4.5-2.5L16.5 21l-1-7" />
  </svg>
);

export const RefreshIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
    <path d="M21 3v6h-6" />
  </svg>
);

export const CreditCardIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </svg>
);

export const WrenchIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M14.7 6.3a4.5 4.5 0 0 0-6.04 5.3L3 17.25 6.75 21l5.65-5.66a4.5 4.5 0 0 0 5.3-6.04l-2.36 2.36-2.3-2.3 2.36-2.36z" />
  </svg>
);

export const BoxIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M21 8 12 3 3 8v8l9 5 9-5V8z" />
    <path d="M3 8l9 5 9-5" />
    <path d="M12 13v8" />
  </svg>
);

export const GstIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 8h6" />
    <path d="M9 12h6" />
    <path d="M9 16h4" />
  </svg>
);

export const CameraIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2v11z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export const SparklesIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
  </svg>
);

export const BagIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 8h12l1.2 12a2 2 0 0 1-2 2.2H6.8a2 2 0 0 1-2-2.2L6 8z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

export const MinusIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
  </svg>
);

export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

export const TrashIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);
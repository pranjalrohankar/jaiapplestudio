import Image from "next/image";
import type { Product } from "@/lib/products";

/**
 * Renders a product image. Uses the provided Apple CDN image as a
 * placeholder, or a clean branded gradient tile until real photos
 * are supplied.
 */
export default function ProductImage({
  product,
  className,
  priority = false,
}: {
  product: Product;
  className?: string;
  priority?: boolean;
}) {
  if (product.image) {
    return (
      <div className={`relative overflow-hidden bg-cloud ${className ?? ""}`}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain"
          priority={priority}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-cloud to-gray-200 ${className ?? ""}`}
    >
      <div className="flex h-40 w-24 select-none items-center justify-center rounded-[1.4rem] border-[6px] border-black/80 bg-gradient-to-b from-white to-gray-300 shadow-xl sm:h-52 sm:w-32">
        <div className="h-2 w-10 rounded-full bg-black/70" />
      </div>
      <span className="mt-6 text-sm font-semibold tracking-wide text-ink/60">
        Image coming soon
      </span>
    </div>
  );
}
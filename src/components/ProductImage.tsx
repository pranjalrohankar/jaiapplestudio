import Image from "next/image";
import type { Product } from "@/lib/products";

export default function ProductImage({
  product,
  className,
  priority = false,
  overrideImage,
}: {
  product: Product;
  className?: string;
  priority?: boolean;
  overrideImage?: string;
}) {
  const imageSrc = overrideImage || product.image;

  if (imageSrc) {
    return (
      <div className={`relative overflow-hidden bg-transparent flex items-center justify-center ${className ?? ""}`}>
        <Image
          src={imageSrc}
          alt={product.name || "Apple Device"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain p-1.5 sm:p-2.5 mix-blend-multiply drop-shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-all duration-300 group-hover:scale-105"
          priority={priority}
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-cloud to-gray-200 p-4 ${className ?? ""}`}
    >
      <div className="flex h-32 w-20 select-none items-center justify-center rounded-2xl border-4 border-black/70 bg-gradient-to-b from-white to-gray-200 shadow-md">
        <div className="h-1.5 w-6 rounded-full bg-black/60" />
      </div>
      <span className="mt-3 text-xs font-semibold tracking-wide text-ink/60">
        {product.name}
      </span>
    </div>
  );
}
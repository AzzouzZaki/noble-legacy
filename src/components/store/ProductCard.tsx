"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils";

interface SizeEntry {
  id?: number | string;
  size: string;
  stock: number;
}

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  stock: number | null;
  imageUrl: string | null;
  sizes?: SizeEntry[];
}

export default function ProductCard({ product }: { product: Product }) {
  const priceValue = parseFloat(product.price || "0");

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col h-full bg-white border border-divider hover:border-black transition-colors duration-200 rounded-lg overflow-hidden"
    >
      {/* Product Image */}
      <div className="relative aspect-square w-full bg-neutral-50 overflow-hidden border-b border-divider">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-muted-text text-sm font-medium">
            لا توجد صورة
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-primary line-clamp-1 group-hover:underline">
            {product.name}
          </h3>
          <p className="text-sm font-semibold text-muted-text">
            {formatPrice(priceValue)}
          </p>
        </div>

        {/* View Details / Order Button */}
        <div className="mt-4">
          <span className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white group-hover:bg-primary-hover transition-colors duration-200 text-center cursor-pointer">
            عرض المنتج
          </span>
        </div>
      </div>
    </Link>
  );
}

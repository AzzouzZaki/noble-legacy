"use client";

import {
  type Variant,
  getVariantKey,
  getHeightLabel,
  getTotalPieces,
} from "@/lib/variants";

interface VariantListProps {
  variants: Variant[];
  onUpdateQuantity: (key: string, quantity: number) => void;
  onRemove: (key: string) => void;
}

export default function VariantList({
  variants,
  onUpdateQuantity,
  onRemove,
}: VariantListProps) {
  if (variants.length === 0) return null;

  const totalPieces = getTotalPieces(variants);

  return (
    <div className="space-y-3 animate-fade-up">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-primary font-tajawal">
          المنتجات المختارة ({variants.length})
        </span>
        <span className="text-xs font-bold text-muted-text font-tajawal bg-neutral-100 px-2.5 py-1 rounded">
          {totalPieces} قطع
        </span>
      </div>

      <div className="space-y-2">
        {variants.map((variant) => {
          const key = getVariantKey(variant);
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-3 p-3 bg-neutral-50 border border-divider rounded-xl transition-all duration-150"
            >
              {/* Variant info */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {variant.colorValue && (
                  <span
                    className="h-4 w-4 rounded-full border border-black/10 flex-shrink-0"
                    style={{ backgroundColor: variant.colorValue }}
                    aria-hidden="true"
                  />
                )}
                <span className="text-sm font-bold text-primary font-tajawal truncate">
                  {[
                    variant.colorName,
                    variant.size,
                    getHeightLabel(variant.heightCategory),
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </span>
              </div>

              {/* Quantity controls */}
              <div className="flex items-center space-x-reverse space-x-2">
                <div className="flex items-center space-x-reverse space-x-2 border border-divider rounded-lg p-0.5 bg-white">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(key, variant.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center text-base font-bold text-primary hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-xs">
                    {variant.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(key, variant.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center text-base font-bold text-primary hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => onRemove(key)}
                  className="w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                  aria-label="إزالة"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Variant management utilities for the product page.
 *
 * A "variant" represents a specific combination of size, height, and color
 * that the customer wants to order. Multiple variants can be added for the
 * same product, each with its own quantity.
 */

export interface Variant {
  size: string;
  heightCategory: "tall" | "cropped";
  colorName: string | null;
  colorValue: string | null;
  quantity: number;
}

/** Generate a unique key for deduplication based on size + height + color. */
export function getVariantKey(
  v: Pick<Variant, "size" | "heightCategory" | "colorName">
): string {
  return `${v.size}::${v.heightCategory}::${v.colorName ?? ""}`;
}

/** Add a variant, merging quantity if the same combination already exists. */
export function addVariant(
  variants: Variant[],
  newVariant: Variant
): Variant[] {
  const key = getVariantKey(newVariant);
  const exists = variants.some((v) => getVariantKey(v) === key);
  if (exists) {
    return variants.map((v) =>
      getVariantKey(v) === key
        ? { ...v, quantity: v.quantity + newVariant.quantity }
        : v
    );
  }
  return [...variants, newVariant];
}

/** Remove a variant by its key. */
export function removeVariant(variants: Variant[], key: string): Variant[] {
  return variants.filter((v) => getVariantKey(v) !== key);
}

/** Update the quantity of a specific variant. Removes it if quantity < 1. */
export function updateVariantQuantity(
  variants: Variant[],
  key: string,
  quantity: number
): Variant[] {
  if (quantity < 1) return removeVariant(variants, key);
  return variants.map((v) =>
    getVariantKey(v) === key ? { ...v, quantity } : v
  );
}

/** Sum of all variant quantities. */
export function getTotalPieces(variants: Variant[]): number {
  return variants.reduce((sum, v) => sum + v.quantity, 0);
}

/** Human-readable label for height category. */
export function getHeightLabel(height: "tall" | "cropped"): string {
  return height === "tall" ? "Tall" : "Short / Cropped";
}

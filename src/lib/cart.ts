export interface CartItem {
  productId: number;
  name: string;
  price: number;
  size: string;
  colorName?: string | null;
  colorValue?: string | null;
  heightOption?: "tall" | "cropped" | null;
  quantity: number;
  imageUrl?: string;
}

const CART_KEY = "cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : [];
}

export function addToCart(item: CartItem): void {
  const cart = getCart();
  const existing = cart.find(
    (i) =>
      i.productId === item.productId &&
      i.size === item.size &&
      (i.colorName ?? null) === (item.colorName ?? null)
  );

  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function removeFromCart(productId: number, size: string, colorName?: string | null): void {
  const cart = getCart().filter(
    (i) =>
      !(
        i.productId === productId &&
        i.size === size &&
        (i.colorName ?? null) === (colorName ?? null)
      )
  );
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function updateQuantity(
  productId: number,
  size: string,
  colorName: string | null | undefined,
  quantity: number
): void {
  const cart = getCart().map((i) =>
    i.productId === productId &&
    i.size === size &&
    (i.colorName ?? null) === (colorName ?? null)
      ? { ...i, quantity }
      : i
  );
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
}

export function getCartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartCount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

# Customer Storefront — Build Prompt

## Context
This is a Next.js 16 + Drizzle ORM + Neon PostgreSQL e-commerce project for a t-shirt/clothing brand. Backend (API routes, DB schema) and admin panel are already complete. This prompt covers the **customer-facing storefront only**.

The site is in **Arabic, RTL layout**. Design direction: minimal, white background, black as the secondary/accent color — inspired by clean streetwear storefronts (image-first product cards, generous whitespace, no clutter).

---

## Design Tokens (follow exactly)

**Colors:**
- Background: `#FFFFFF`
- Primary text / buttons: `#0A0A0A`
- Button hover: `#1A1A1A`
- Borders / dividers: `#E5E5E5`
- Muted text (secondary info, prices labels): `#737373`

**Typography:**
- Use **Tajawal** (Google Fonts) for all UI text — both headings and body. Use weight 700–800 for headings, 400–500 for body text. This avoids mixing multiple Arabic fonts which often clash visually.
- Fallback stack: `'Tajawal', 'Noto Sans Arabic', sans-serif`

**Layout:**
- `dir="rtl"` on the root html element, entire site mirrors accordingly (logo on the right, nav flows right-to-left, back arrows point right, etc.)
- Generous whitespace, image-led product cards
- Buttons are **solid black, rounded** (not outlined/pill style)

---

## Pages to Build

### 1. `src/app/(store)/layout.tsx`
- Top nav: logo/brand name (right side, since RTL), nav links (الرئيسية / المنتجات), cart icon with item count badge (left side)
- Footer: brand name, simple contact info placeholder, copyright line
- Both wrap all store pages

### 2. `src/app/(store)/page.tsx` — Home Page
- Full-width hero section: welcome title (e.g. "مرحباً بكم في [اسم المتجر]"), short subtitle, single black "تسوق الآن" (Shop Now) button linking to `/products`
- Below the hero: a "Featured Products" section showing 4-6 products fetched from `GET /api/products` in a responsive grid (reuse the same ProductCard component as the products page)
- Keep the hero clean — no stock photography clutter, let typography and whitespace carry it

### 3. `src/app/(store)/page.tsx` route → also build `src/components/store/ProductCard.tsx`
- Product image (aspect-square, object-cover)
- Product name below image
- Price (format using `formatPrice()` from `src/lib/utils.ts`)
- Solid black "اطلب الآن" or "عرض المنتج" button — full width, rounded
- Entire card links to `/product/[id]`

### 4. `src/app/(store)/products/page.tsx` — Products Page
- Fetch all products from `GET /api/products`
- Responsive grid (2 columns mobile, 3-4 columns desktop) of `ProductCard`
- Optional simple filter at top: "الكل" / "رجالي" (adult) / "أطفال" (kids) — filters client-side using the `category` field
- Empty state if no products: friendly centered message, not a blank page

### 5. `src/app/(store)/product/[id]/page.tsx` — Product Detail Page
- Fetch single product via `GET /api/products/[id]` (includes `sizes` array)
- Layout: image on one side (right side, since RTL — this is the "natural" reading start), details on the other (left side)
- Image scrolls normally with the page (not sticky/fixed)
- Details section includes:
  - Product name (large, bold)
  - Price
  - Description
  - Size selector: rounded pill buttons, one per available size (from `product.sizes`), selected state filled black, unselected outlined
  - Quantity selector (+/- stepper, default 1)
  - "إضافة إلى السلة" (Add to Cart) button — solid black, full width — calls `addToCart()` from `src/lib/cart.ts` with the selected size and quantity, then shows a brief confirmation (toast or inline message)
  - Validation: if no size selected, show inline error instead of allowing add to cart silently

---

## API Reference (already built, do not modify)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | Get all products |
| GET | `/api/products/[id]` | Get single product with sizes array |

## Cart helpers (already built in `src/lib/cart.ts`, do not modify)
- `getCart()`, `addToCart(item)`, `removeFromCart(productId, size)`, `updateQuantity(productId, size, quantity)`, `clearCart()`, `getCartTotal(cart)`, `getCartCount(cart)`

---

## Important Notes
- All interactive pages/components are client components (`"use client"`) since they read from localStorage and fetch client-side
- Use Tailwind CSS only
- Mobile-first responsive design — test down to a 375px viewport
- Keyboard focus states must be visible on all interactive elements
- Do not touch any existing API routes, db files, admin panel, or middleware
- Do not build the cart page or checkout page yet — those come in a separate step

---

## Test
Run `npm run dev`, visit `http://localhost:3000`, confirm:
- Hero renders with working "Shop Now" button
- Products page lists real products from the DB
- Clicking a product opens its detail page with working size selection and add-to-cart

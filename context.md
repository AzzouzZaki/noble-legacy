# Project Context

## Overview

This repository is a Next.js storefront and admin panel for a fashion brand called Noble Legacy / العريقة. The public site is an RTL Arabic storefront with product browsing, a client-side cart, and manual order submission. The admin side is a separate authenticated area for managing products and orders.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Drizzle ORM with PostgreSQL via Neon
- Cloudinary for image uploads
- Zimou Express API integration for delivery data and quotes
- Meta Pixel tracking on the storefront
- Vercel Analytics and Speed Insights

## High-Level Structure

- `src/app/(store)` contains the public storefront pages.
- `src/app/admin` contains the admin UI.
- `src/app/api` contains all backend route handlers.
- `src/components/store` contains storefront UI components.
- `src/components/admin` contains admin-specific UI, including the sidebar.
- `src/db` contains the Drizzle schema, database client, and seed script.
- `src/lib` contains shared helpers and service wrappers.
- `src/scripts` contains maintenance utilities.

## Public Storefront

The public storefront is wrapped by `src/app/(store)/layout.tsx`, which renders the shared navbar and footer.

- Home page: `src/app/(store)/page.tsx`
  - Fetches products from `/api/products` on the client.
  - Shows a hero section with animated decorative elements.
  - Displays the first four products as featured items.
- Products page: `src/app/(store)/products/page.tsx`
  - Fetches all products from `/api/products`.
  - Lets users filter by `all`, `men`, or `kids`.
  - Category detection is mostly heuristic and partly based on product name/description.
- Product detail page: `src/app/(store)/product/[id]/page.tsx`
  - Fetches one product from `/api/products/[id]`.
  - Lets users choose size, color, height option, quantity, and delivery choice.
  - Supports add-to-cart and direct manual order submission.
  - Tracks Meta Pixel events for `ViewContent`, `AddToCart`, and `Lead`.
- Cart page: `src/app/(store)/cart/page.tsx`
  - Uses localStorage cart state from `src/lib/cart.ts`.
  - Lets users edit quantities, remove items, and submit a manual order.
  - Tracks `InitiateCheckout` and `Lead` events.
- Checkout page: `src/app/(store)/checkout/page.tsx`
  - Currently a placeholder page.

Shared storefront components:

- `src/components/store/Navbar.tsx`
- `src/components/store/Footer.tsx`
- `src/components/store/ProductCard.tsx`
- `src/components/store/CartIcon.tsx`
- `src/components/store/ImageCarousel.tsx`
- `src/components/store/ZimouOfficeSelect.tsx`

## Admin Area

The admin area is protected by cookie-based auth and route middleware in `src/proxy.ts`.

- Unauthenticated users under `/admin` are redirected to `/admin/login`.
- Authenticated users are redirected away from `/admin` and `/admin/login` to `/admin/products`.
- The admin layout in `src/app/admin/layout.tsx` hides the sidebar on the login page.

Admin pages:

- Login: `src/app/admin/login/page.tsx`
  - Native form POST to `/api/admin/auth`.
  - Supports server-side redirect errors via `?error=...`.
- Products: `src/app/admin/products/page.tsx`
  - Product catalog management.
  - Create/edit/delete products.
  - Supports sizes, colors, multiple images, image reordering, and client-side crop/upload flow.
- Orders: `src/app/admin/orders/page.tsx`
  - Lists orders, updates status, deletes orders, and opens detailed order views.

## API Surface

### Products

- `GET /api/products`
  - Returns all products with sizes, images, and colors.
- `POST /api/products`
  - Creates a product plus optional sizes, images, and colors.
- `GET /api/products/[id]`
  - Returns one product with sizes, images, and colors.
- `PUT /api/products/[id]`
  - Updates the product and replaces related sizes, images, and colors.
- `DELETE /api/products/[id]`
  - Deletes the product and its related rows.

### Orders

- `GET /api/orders`
  - Returns all orders.
- `POST /api/orders`
  - Creates an order and its order items.
- `GET /api/orders/[id]`
  - Returns one order with items and joined product metadata.
- `PUT /api/orders/[id]`
  - Updates order status.
- `DELETE /api/orders/[id]`
  - Deletes the order and its items.

### Admin Auth

- `POST /api/admin/auth`
  - Accepts either JSON or form submission.
  - Verifies credentials and sets the `admin_token` cookie.
  - Redirects to `/admin/products` on success or `/admin/login?error=...` on failure.
- `DELETE /api/admin/auth`
  - Clears the admin cookie.

### Upload

- `POST /api/upload`
  - Accepts a base64 image string.
  - Uploads to Cloudinary and returns the secure URL.

### Zimou Delivery

- `GET /api/zimou/wilayas`
- `GET /api/zimou/communes`
- `GET /api/zimou/offices`
- `GET /api/zimou/quotes?communeId=...`
- `POST /api/zimou/quote`

These endpoints proxy the Zimou Express API through `src/lib/zimou.ts` and normalize the response shapes for the frontend.

## Database Model

The schema lives in `src/db/schema.ts` and targets PostgreSQL.

Core commerce tables:

- `products`
- `product_sizes`
- `product_colors`
- `product_images`
- `orders`
- `order_items`
- `admin_users`

Zimou sync tables:

- `delivery_companies`
- `offices`
- `office_prices`

Important details:

- Prices are stored as decimal strings in the database layer and converted as needed in the UI.
- Orders store customer contact data, shipping address text, total amount, and status.
- Order items store size, color, height category, quantity, and unit price.
- The Zimou tables model delivery companies, offices, and per-office pricing.

## Shared Utilities

- `src/lib/auth.ts`
  - Verifies admin credentials.
  - Supports legacy SHA-256 password hashes and bcrypt hashes.
  - Manages the `admin_token` cookie.
- `src/lib/cart.ts`
  - LocalStorage cart helpers for the storefront.
- `src/lib/cloudinary.ts`
  - Cloudinary upload/delete helpers.
- `src/lib/utils.ts`
  - `formatPrice`, `slugify`, and `cn` helpers.
- `src/lib/zimou.ts`
  - Fetches and normalizes Zimou wilayas, communes, offices, and delivery quotes.
  - Chooses the best office quote by matching office metadata against delivery quote text.
- `src/lib/meta-pixel.ts`
  - Client-side Meta Pixel helper with event ID generation and duplicate-event protection.

## Meta Pixel Notes

- Meta Pixel is frontend-only in this repo.
- The bootstrap script is injected in `src/app/layout.tsx` when `NEXT_PUBLIC_META_PIXEL_ID` is set.
- Product detail and cart pages send tracking events through `src/lib/meta-pixel.ts`.
- Manual orders should fire `Lead` on successful submission, not `Purchase`.

## Styling and Layout

- Global styles live in `src/app/globals.css`.
- The app uses Tailwind theme variables for `primary`, `divider`, `muted-text`, and the Tajawal font.
- The public storefront is RTL and Arabic-first.
- The admin area is LTR and visually isolated from the storefront.

## Environment Variables

Likely required environment variables:

- `DATABASE_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_META_PIXEL_ID`
- `NEXT_PUBLIC_META_PIXEL_DEBUG`
- `ZIMOU_API_TOKEN`
- `ZIMOU_EMAIL`
- `ZIMOU_PASSWORD`

## Scripts

Defined in `package.json`:

- `npm run dev` - Next.js development server
- `npm run build` - production build
- `npm run start` - start production server
- `npm run lint` - ESLint
- `npm run db:generate` - generate Drizzle migrations
- `npm run db:migrate` - run migrations
- `npm run db:seed` - seed the database with sample products and images
- `npm run db:studio` - open Drizzle Studio

## Seed and Maintenance

- `src/db/seed.ts` clears existing commerce data and seeds sample t-shirt products with Cloudinary-hosted images.
- `src/scripts/checkProducts.ts` is a small inspection script that prints product IDs and names.

## Practical Notes For Future Changes

- Product and order data are fetched client-side in many places, so UI changes often require matching API shape changes.
- The cart is stored in localStorage, so changes to cart item fields should stay backward-compatible.
- The admin product editor depends on `/api/upload` and the image crop workflow, so image schema changes should be tested end-to-end.
- The checkout-related delivery UI depends on the Zimou endpoints and the delivery quote normalization logic in `src/lib/zimou.ts`.
- The admin login flow depends on the cookie name `admin_token` in both `src/proxy.ts` and `src/lib/auth.ts`.

## Important Existing Files

- [src/app/layout.tsx](src/app/layout.tsx)
- [src/app/(store)/page.tsx](src/app/(store)/page.tsx)
- [src/app/(store)/product/[id]/page.tsx](src/app/(store)/product/[id]/page.tsx)
- [src/app/admin/products/page.tsx](src/app/admin/products/page.tsx)
- [src/app/admin/orders/page.tsx](src/app/admin/orders/page.tsx)
- [src/app/api/products/route.ts](src/app/api/products/route.ts)
- [src/app/api/orders/route.ts](src/app/api/orders/route.ts)
- [src/db/schema.ts](src/db/schema.ts)
- [src/lib/meta-pixel.ts](src/lib/meta-pixel.ts)
- [src/lib/zimou.ts](src/lib/zimou.ts)
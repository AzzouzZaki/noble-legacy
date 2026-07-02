# Project Handout

## Summary

- Workspace: `C:\dev\my-store`
- App: Next.js 16 App Router storefront/admin for an Arabic T-shirt shop called Noble Legacy / العريقة.
- Important repo rule from `AGENTS.md`: this is a newer Next.js version with breaking changes, so read relevant docs in `node_modules/next/dist/docs/` before editing Next-specific behavior.
- Use `apply_patch` for manual code edits.
- Do not revert user/unrelated changes. The repo may be dirty.
- Do not print `.env` secrets in responses.

## Current Git State

At the time this handout was generated:

```text
## master
 M src/app/(store)/cart/page.tsx
 M src/app/(store)/product/[id]/page.tsx
 M src/app/layout.tsx
?? src/lib/meta-pixel.ts
```

Recent Git/deploy context:

- Remote is `TshirtShop` at `https://github.com/AzzouzZaki/noble-legacy.git`.
- Local branch is `master`.
- Remote `TshirtShop/master` had Vercel commits, which caused a non-fast-forward push rejection.
- The safe flow was to pull/rebase `TshirtShop master`, then push.
- After pulling, `@vercel/analytics` and `@vercel/speed-insights` imports existed but packages were missing locally. Running `npm install` installed the two packages. `package.json` and `package-lock.json` already included them.

## Important Current/Open User Request

The user previously said:

> i am failing to delete this products تيشيرت باكي هانما and تيشيرت ستريتوير فايت, find why and remove them

This has not been investigated yet in the latest work. Next agent should treat this as the active unresolved task unless the user says otherwise.

Likely steps:

1. Inspect product delete route/admin delete flow.
2. Check DB relations that may block deletion, especially `product_images`, `product_sizes`, `product_colors`, `order_items`, or other foreign keys.
3. Find the two products by exact Arabic names.
4. Remove dependent rows safely or fix cascade behavior, then delete the products.
5. Verify `/api/products` and admin product list no longer show them.

Network/DB access may need approval depending on sandbox. Use the existing `.env` `DATABASE_URL`, but never reveal it.

## Core App Structure

Important paths:

- Store layout: `src/app/(store)/layout.tsx`
- Home page: `src/app/(store)/page.tsx`
- Product detail: `src/app/(store)/product/[id]/page.tsx`
- Cart page: `src/app/(store)/cart/page.tsx`
- Admin products: `src/app/admin/products/page.tsx`
- Admin orders: `src/app/admin/orders/page.tsx`
- DB schema: `src/db/schema.ts`
- Zimou API helpers: `src/lib/zimou.ts`
- Zimou selector: `src/components/store/ZimouOfficeSelect.tsx`
- Product gallery: `src/components/store/ImageCarousel.tsx`
- Footer: `src/components/store/Footer.tsx`

Useful commands:

```powershell
npm.cmd run dev
npx.cmd tsc --noEmit --pretty false
npx.cmd eslint "src\path\to\file.tsx"
```

Database migrations:

```powershell
$envLine = Get-Content -LiteralPath '.env' | Where-Object { $_ -like 'DATABASE_URL=*' } | Select-Object -First 1
$env:DATABASE_URL = $envLine.Substring('DATABASE_URL='.Length)
npx.cmd drizzle-kit migrate
```

## Implemented Product/Order Features

Products now support:

- Sizes.
- Optional colors via `product_colors`.
- Buyer color selection if colors exist.
- Buyer height/category selection:
  - `tall`
  - `cropped`
- No stock tracking. Product and size stock were removed from UI/data flow.

Migrations already created/applied earlier:

- `drizzle/0003_good_shotgun.sql`
- `drizzle/0004_wise_thundra.sql`

Order/cart behavior:

- Cart items can include `heightOption`.
- Order items store `heightCategory`.
- Admin orders show height category.
- Product detail form is always visible; user does not press "Order now" just to reveal the form.

## Zimou Delivery Integration

The app uses Zimou's public API instead of scraping/seeded Neon tables.

Key behavior:

- `/api/zimou/wilayas`, `/api/zimou/communes`, `/api/zimou/offices`, and `/api/zimou/quotes` provide delivery data.
- `ZimouOfficeSelect` filters by wilaya, then commune.
- Home delivery then chooses delivery company/type.
- Office delivery then chooses delivery office.
- Office dropdown should display:
  - delivery company
  - office address
  - price
- The selected-delivery summary card below the selector was removed after the user said it was unwanted.
- For home delivery, the home address textarea should be always visible when home mode is selected and should appear directly below the delivery type selector. It must not wait for a selected delivery quote.

Recent Zimou resilience fix:

- The client no longer throws a visible console error when `/api/zimou/quotes` returns non-OK.
- Office delivery can fall back to the office's own `deliveryPrice` when quotes are unavailable.

## Storefront UX Changes

Footer:

- Footer was shrunk because it took too much space.
- Mobile and desktop footer use 3 equal columns.
- Footer text should not wrap; it truncates instead.
- Several alignment tweaks were attempted for the "Follow us" column. Inspect current component before changing again.

Home hero:

- Shirt/product card should be hidden on mobile only.
- On desktop, hero should keep the previous card on the left and text on the right.

Product gallery:

- `ImageCarousel` now uses CSS scroll snapping for smooth drag/swipe between product images.
- Swiping/dragging reveals adjacent photos while moving.
- Arrows, dots, and thumbnails should still control the same scroll-snap track.
- Arrow behavior was explicitly reversed at the user's request:
  - left arrow goes next
  - right arrow goes previous

## Admin Image Management

Admin product images:

- Image thumbnail controls for remove/switch are tiny.
- Desktop controls show on hover.
- Mobile controls remain accessible.
- Clicking an image opens a full-screen preview.

Image cropper:

- Admin upload opens a crop/framing modal before upload.
- Crop preview uses a square canvas.
- User can drag with finger/cursor and use +/- zoom.
- The final uploaded image should be generated from the exact same canvas math as the preview, so the saved crop matches what the admin framed.

Important file:

- `src/app/admin/products/page.tsx`

If cropper is revisited, verify:

```powershell
npx.cmd tsc --noEmit --pretty false
npx.cmd eslint "src\app\admin\products\page.tsx"
```

## Meta/Vercel Tracking

Current uncommitted changes include Meta Pixel tracking:

- `src/app/layout.tsx` imports `next/script`, reads `NEXT_PUBLIC_META_PIXEL_ID`, and injects the Meta Pixel script when present.
- `src/lib/meta-pixel.ts` is new and untracked.
- `src/app/(store)/product/[id]/page.tsx` tracks:
  - `ViewContent`
  - `AddToCart`
  - `Lead` after successful direct order
- `src/app/(store)/cart/page.tsx` tracks:
  - `InitiateCheckout` once per cart checkout visit
  - `Lead` after successful cart order
- Vercel analytics and speed insights are in `src/app/layout.tsx`.

Before committing/pushing this tracking work, inspect `src/lib/meta-pixel.ts` and run:

```powershell
npx.cmd tsc --noEmit --pretty false
```

## Known Verification Notes

Recently passing checks:

- `npx.cmd tsc --noEmit --pretty false` passed after several changes.
- ESLint often passes with warnings only for existing `<img>` usage in store/cart/gallery/admin pages.

Existing warning pattern:

- `@next/next/no-img-element` warnings are common and were not treated as blockers unless the user asks to convert to `next/image`.

## Next Agent Priorities

If the user asks to continue immediately, start with the unresolved deletion task:

1. Read Next route handler docs if editing API routes.
2. Inspect product/admin delete implementation and DB schema relations.
3. Reproduce why deleting `تيشيرت باكي هانما` and `تيشيرت ستريتوير فايت` fails.
4. Delete the products and necessary dependent rows safely.
5. Verify locally and report exactly what blocked deletion.

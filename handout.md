# Project Handout

## Current Project

- Workspace: `C:\dev\my-store`
- App: Next.js 16 App Router storefront/admin for a T-shirt shop.
- Important rule from `AGENTS.md`: this Next.js version may differ from older docs, so read relevant guides in `node_modules/next/dist/docs/` before editing Next.js code.
- Do not revert existing uncommitted changes unless explicitly asked.
- Use `apply_patch` for manual edits.

## Recent User Goal

The latest active feature work is the admin image crop/upload flow.

The owner/admin should be able to choose which part of an uploaded image is cropped into the final fixed square image. The crop modal should not merely preview a different framing while upload still crops from a default position. The preview and the saved upload must use the same crop math.

## Current State Of Image Cropper

File to inspect:

- `src/app/admin/products/page.tsx`

Recent cropper changes already started:

- `useRef` was added to React imports.
- Added `PendingCropImage` interface.
- Added crop states:
  - `cropQueue`
  - `currentCrop`
  - `cropZoom`
  - `cropX`
  - `cropY`
  - `cropDrag`
  - `cropCanvasRef`
- File input now calls `handleImageFilesSelected`.
- Upload now opens a crop modal before uploading.
- Crop modal uses a square `<canvas>` preview, with pointer drag for mobile/web and +/- zoom buttons.
- The intended final fix is that `drawCropToCanvas` draws both:
  - the visible preview canvas, and
  - the hidden upload canvas used to produce the final image.

Expected crop math shape:

```ts
const baseScale = Math.max(outputSize / image.naturalWidth, outputSize / image.naturalHeight);
const scale = baseScale * cropZoom;
const drawWidth = image.naturalWidth * scale;
const drawHeight = image.naturalHeight * scale;
const maxOffsetX = Math.max(0, (drawWidth - outputSize) / 2);
const maxOffsetY = Math.max(0, (drawHeight - outputSize) / 2);
const drawX = (outputSize - drawWidth) / 2 + (cropX / 100) * maxOffsetX;
const drawY = (outputSize - drawHeight) / 2 + (cropY / 100) * maxOffsetY;
context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
```

Potential issue to check:

- Make sure `drawCropToCanvas` is declared before any `useEffect` that depends on it.
- Prefer this order:
  - `loadImageElement`
  - `drawCropToCanvas`
  - `buildCroppedImage`
  - crop preview `useEffect`

Verification commands:

```powershell
npx.cmd tsc --noEmit --pretty false
npx.cmd eslint "src\app\admin\products\page.tsx"
```

Expected ESLint result:

- It may pass with warnings about `<img>` usage. Those warnings existed before and are not necessarily part of this task.

## Previous Completed Work

### Zimou API Integration

Added Zimou API support and removed the need for scraping/neon seeded office tables.

Key files:

- `src/lib/zimou.ts`
- `src/app/api/zimou/*`
- `src/components/store/ZimouOfficeSelect.tsx`

Previously tested endpoints:

- `/api/zimou/wilayas`
- `/api/zimou/communes`
- `/api/zimou/offices`

They returned 200 locally in an earlier check.

Known possible future issue:

- User previously saw `Failed to fetch quotes` from `ZimouOfficeSelect`.
- This has not been fully fixed yet because the user pivoted back to the cropper.
- Likely next debugging target:
  - `src/app/api/zimou/quotes/route.ts`
  - `src/app/api/zimou/quote/route.ts`
  - `src/components/store/ZimouOfficeSelect.tsx`
  - `src/lib/zimou.ts`

### Product Colors, Height Categories, And Stock Removal

Implemented:

- Product colors table and admin CRUD.
- Buyer can choose one color when product has colors.
- Product can have no color options.
- Buyer selects height option:
  - tall
  - cropped
- Removed stock tracking from product and size flows.

Migrations already created/applied:

- `drizzle/0003_good_shotgun.sql`
- `drizzle/0004_wise_thundra.sql`

Related behavior:

- Product detail page requires size, height, and color if colors exist.
- Cart items include `heightOption`.
- Orders send `heightCategory`.

### Product Detail Form UX

Changed product detail page so the order form is visible immediately. The user should not need to press “Order now” before seeing the form. Buttons are placed below the form.

### Mobile/Home/Footer UX

Earlier requested and partially adjusted:

- Shirt card should be hidden only on mobile, visible on desktop.
- Desktop hero should show the card on the left and text on the right.
- Mobile footer should be more compact and use 3 columns instead of one.
- Footer was later reported as taking too much space on phone.

If revisiting this, inspect the current CSS/components first because several iterations happened.

### Admin Product Image Controls

Implemented:

- Tiny remove/switch image buttons on thumbnails.
- On desktop, controls appear on hover.
- On mobile, controls must still be accessible.
- Clicking an image opens a full-screen preview.

## Useful Commands

```powershell
npm.cmd run dev
npx.cmd tsc --noEmit --pretty false
npx.cmd eslint "src\app\admin\products\page.tsx"
```

If database migrations are needed, load `DATABASE_URL` from `.env` and run:

```powershell
$envLine = Get-Content -LiteralPath '.env' | Where-Object { $_ -like 'DATABASE_URL=*' } | Select-Object -First 1
$env:DATABASE_URL = $envLine.Substring('DATABASE_URL='.Length)
npx.cmd drizzle-kit migrate
```

Do not print secrets from `.env` in final responses.

## Next Best Step

Continue from the cropper:

1. Inspect `src/app/admin/products/page.tsx`.
2. Confirm the crop preview canvas and final upload use the same `drawCropToCanvas` function.
3. Run TypeScript and ESLint checks.
4. If all passes, tell the user the crop modal now saves exactly the framed square they see.

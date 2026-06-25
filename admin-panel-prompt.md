# Admin Panel — Continuation Prompt

## Context
This is a Next.js 16 + Drizzle ORM + Neon PostgreSQL e-commerce project. The admin panel is already partially built. Here is what is done:

**Already working:**
- `src/middleware.ts` — protects all `/admin/*` routes using `admin_token` cookie, redirects to `/admin/login` if not authenticated
- `src/lib/auth.ts` — `verifyAdmin()`, `setAdminCookie()`, `clearAdminCookie()`, `hashPassword()` using SHA-256
- `src/app/admin/login/page.tsx` — login form, calls `POST /api/admin/auth`, redirects to `/admin/products` on success
- `POST /api/admin/auth` — verifies credentials, sets `admin_token` cookie
- `DELETE /api/admin/auth` — clears `admin_token` cookie

---

## What needs to be built

### 1. `src/app/admin/layout.tsx`
A simple sidebar layout wrapping all admin pages (except login). Should include:
- Sidebar with two navigation links: **Products** (`/admin/products`) and **Orders** (`/admin/orders`)
- A **Logout** button that calls `DELETE /api/admin/auth` then redirects to `/admin/login`
- Clean minimal styling with Tailwind CSS

### 2. `src/app/admin/products/page.tsx`
A product management page. Should:
- Fetch all products from `GET /api/products` on load
- Display products in a table with columns: name, price, stock, actions
- Have an **Add Product** button that opens a form (inline or modal) with fields:
  - `name` (text, required)
  - `description` (textarea)
  - `price` (number, required)
  - `stock` (number)
  - `imageUrl` (text)
  - `sizes` — dynamic list where admin can add multiple size+stock pairs (e.g. S/10, M/5, L/8)
- Form submits to `POST /api/products`
- Each product row has an **Edit** button that pre-fills the form and submits to `PUT /api/products/[id]`
- Each product row has a **Delete** button that calls `DELETE /api/products/[id]`
- Refresh the product list after every action

### 3. `src/app/admin/orders/page.tsx`
An order management page. Should:
- Fetch all orders from `GET /api/orders` on load
- Display orders in a table with columns: id, customer name, phone, total amount, status, date, actions
- Each order row has a **Status** dropdown with options: `pending`, `confirmed`, `shipped`, `delivered`
- Changing the dropdown calls `PUT /api/orders/[id]` with the new status immediately
- Each order row has a **Delete** button that calls `DELETE /api/orders/[id]`
- Status should be color coded:
  - `pending` → yellow
  - `confirmed` → blue
  - `shipped` → purple
  - `delivered` → green

---

## API Reference
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | Get all products |
| POST | `/api/products` | Create product |
| PUT | `/api/products/[id]` | Update product |
| DELETE | `/api/products/[id]` | Delete product |
| GET | `/api/orders` | Get all orders |
| PUT | `/api/orders/[id]` | Update order status (body: `{ status: string }`) |
| DELETE | `/api/orders/[id]` | Delete order |
| DELETE | `/api/admin/auth` | Logout |

---

## Important Notes
- All admin pages are client components (`"use client"`)
- Use Tailwind CSS only, keep styling minimal and functional
- Do not touch any existing files

---

## Test
Once done, test by logging in at `http://localhost:3000/admin/login` with `username: admin, password: admin`.

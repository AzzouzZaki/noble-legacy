# Project Context — my-store

## What we are building
A fully functional e-commerce storefront with an admin panel.
- **Storefront**: Arabic RTL layout featuring a modern, minimal streetwear aesthetic using the **Tajawal** font. Cart functionality is handled entirely client-side via browser `localStorage`.
- **Admin Panel**: LTR layout for managing products, sizes, and orders. Uses simple cookie-based authentication.
- **Image Management**: Integrated with Cloudinary for product image uploads.

---

## Tech Stack
| Layer | Choice |
|---|---|
| Frontend + API | Next.js 16 (App Router) |
| ORM | Drizzle ORM |
| Database | PostgreSQL via Neon (Serverless) |
| Image Hosting | Cloudinary |
| Styling | Tailwind CSS v4 |
| Language | TypeScript |

---

## Database Schema
5 tables — migrated to Neon PostgreSQL:

- **products** — id, name, description, price, stock, image_url, created_at
- **product_sizes** — id, product_id (FK), size, stock
- **orders** — id, customer_name, customer_phone, customer_email, shipping_address, total_amount, status (pending/confirmed/shipped/delivered), created_at
- **order_items** — id, order_id (FK), product_id (FK), size, quantity, unit_price
- **admin_users** — id, username, password_hash, created_at

---

## Project Structure
```
my-store/
├── src/
│   ├── app/
│   │   ├── (store)/          # Customer Storefront (Arabic RTL)
│   │   │   ├── layout.tsx    # Root Storefront wrapper (Navbar & Footer)
│   │   │   ├── page.tsx      # Home Page (Hero & Featured Products)
│   │   │   ├── products/     # Products Catalog (Client-side filters)
│   │   │   └── product/[id]/ # Product Detail Page & Order Form
│   │   ├── admin/            # Admin Panel (LTR)
│   │   │   ├── login/        # Admin Login
│   │   │   ├── products/     # Product & Size Management
│   │   │   └── orders/       # Order Management
│   │   └── api/              # API Routes (Products, Orders, Auth, Upload)
│   ├── components/
│   │   └── store/            # Reusable Storefront UI (Navbar, ProductCard, CartIcon)
│   ├── db/
│   │   ├── schema.ts         # Drizzle schema definition
│   │   ├── index.ts          # Neon DB connection export
│   │   └── seed.ts           # DB Seed script
│   └── lib/
│       ├── cart.ts           # LocalStorage cart helper functions
│       ├── cloudinary.ts     # Cloudinary integration functions
│       └── utils.ts          # Utilities (e.g., formatPrice)
├── drizzle/                  # Generated SQL migrations
├── drizzle.config.ts         # Drizzle config
├── .env                      # Environment Variables
└── package.json
```

---

## Development & Environment

### Key Environment Variables (`.env`)
```
DATABASE_URL="postgres://..."
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

### Scripts
- `npm run dev`: Start Next.js development server
- `npm run build`: Build for production
- `npm run db:generate`: Generate Drizzle migrations
- `npm run db:migrate`: Run migrations against Neon
- `npm run db:seed`: Seed the database with fake data
- `npm run db:studio`: Open Drizzle Studio to inspect DB

---

## Decisions Made
- No user authentication for customers (guest checkout only).
- Admin panel uses a separate login via the `admin_users` table and secure HTTP-only cookies.
- Cart state is stored exclusively in **browser localStorage**. There is no server-side cart database table.
- Form submissions (orders, products) interact via RESTful API routes (`/api/...`).
- Storefront styling is minimal: white backgrounds, solid black primary accents, and Tailwind `gap-10` conventions.

---

## Current Status
✅ Next.js project initialized  
✅ Drizzle + Neon installed, configured, and migrated  
✅ API routes built (`/api/products`, `/api/orders`, `/api/admin/auth`, `/api/upload`)  
✅ Admin Panel built (Login, Product Management, Image Uploads, Size Management)  
✅ Customer Storefront built (Home, Catalog, Detail Pages, Order Checkout Form)  
✅ Cloudinary integrated for image uploads  

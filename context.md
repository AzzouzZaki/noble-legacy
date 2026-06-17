# Project Context — my-store

## What we are building
A simple e-commerce storefront with an admin panel. No user login system. Cart is handled via browser localStorage.

---

## Tech Stack
| Layer | Choice |
|---|---|
| Frontend + API | Next.js (App Router) |
| ORM | Drizzle ORM |
| Database | PostgreSQL via Neon |
| Deployment | Vercel (frontend) + Neon (DB) |
| Styling | Tailwind CSS |
| Language | TypeScript |

---

## Database Schema
5 tables — already migrated to Neon:

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
│   ├── app/                  # Next.js App Router pages
│   └── db/
│       ├── schema.ts         # Drizzle schema (all 5 tables)
│       └── index.ts          # Neon DB connection
├── drizzle/                  # Generated SQL migrations
├── drizzle.config.ts         # Drizzle config
├── .env                      # DATABASE_URL (Neon connection string)
└── package.json
```

---

## Key Files

### `drizzle.config.ts`
```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "placeholder",
  },
});
```

### `src/db/index.ts`
```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### `package.json` scripts
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```

---

## Dependencies
```json
"dependencies": {
  "@neondatabase/serverless": "^1.1.0",
  "dotenv": "^17.4.2",
  "drizzle-orm": "^0.45.2",
  "next": "16.2.9",
  "react": "19.2.4",
  "react-dom": "19.2.4"
},
"devDependencies": {
  "drizzle-kit": "^0.31.10",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

---

## Cart Implementation
No server-side cart. Cart state is stored in **browser localStorage** only. No `cart` or `cart_items` table in the DB.

---

## Decisions Made
- No user authentication (customers don't log in)
- Admin panel will use a separate login via `admin_users` table
- Free deployment: Vercel + Neon free tiers
- Full Next.js (no separate Express server)
- npm as package manager

---

## Current Status
✅ Next.js project initialized  
✅ Drizzle + Neon installed and configured  
✅ Schema written and migration generated  
✅ Tables migrated to Neon database  
⬜ Project folder structure (next step)  
⬜ API routes  
⬜ Frontend pages  
⬜ Admin panel  

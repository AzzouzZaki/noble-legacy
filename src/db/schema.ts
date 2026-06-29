import {
  pgTable,
  serial,
  varchar,
  text,
  decimal,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productSizes = pgTable("product_sizes", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  size: varchar("size").notNull(),
});

export const productColors = pgTable("product_colors", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  name: varchar("name").notNull(),
  value: varchar("value").notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name").notNull(),
  customerPhone: varchar("customer_phone"),
  customerEmail: varchar("customer_email"),
  shippingAddress: text("shipping_address").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  size: varchar("size").notNull(),
  colorName: varchar("color_name"),
  colorValue: varchar("color_value"),
  heightCategory: varchar("height_category"),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: varchar("username").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id),
  url: varchar("url").notNull(),
  position: integer("position").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Zimou Delivery Sync Tables ─────────────────────────────────────────────

/** One row per delivery company (e.g. Zimou Express, Yalidine, etc.) */
export const deliveryCompanies = pgTable("delivery_companies", {
  id: serial("id").primaryKey(),
  name: varchar("name").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** One row per physical office/stop point for a delivery company */
export const offices = pgTable(
  "offices",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id")
      .notNull()
      .references(() => deliveryCompanies.id),
    wilaya: varchar("wilaya").notNull(),
    commune: varchar("commune").notNull(),
    communeId: integer("commune_id").notNull(),
    officeName: varchar("office_name").notNull(),
    address: text("address"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [
    // Ensures no duplicate office per company+commune+name combination
    uniqueIndex("unique_office_idx").on(t.companyId, t.communeId, t.officeName),
  ]
);

/** Delivery pricing for each office (1-to-1 with offices) */
export const officePrices = pgTable("office_prices", {
  id: serial("id").primaryKey(),
  /** FK to offices — unique so each office has exactly one price row */
  officeId: integer("office_id")
    .notNull()
    .unique()
    .references(() => offices.id),
  homePrice: decimal("home_price", { precision: 10, scale: 2 }).notNull(),
  officePrice: decimal("office_price", { precision: 10, scale: 2 }).notNull(),
  returnPrice: decimal("return_price", { precision: 10, scale: 2 }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

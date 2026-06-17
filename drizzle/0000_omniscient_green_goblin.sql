CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"size" varchar NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" varchar NOT NULL,
	"customer_phone" varchar,
	"customer_email" varchar,
	"shipping_address" text NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" varchar DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_sizes" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"size" varchar NOT NULL,
	"stock" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"stock" integer DEFAULT 0,
	"image_url" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_sizes" ADD CONSTRAINT "product_sizes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
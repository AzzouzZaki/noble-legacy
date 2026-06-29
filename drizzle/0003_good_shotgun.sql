CREATE TABLE "product_colors" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"name" varchar NOT NULL,
	"value" varchar NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "color_name" varchar;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "color_value" varchar;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "height_category" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "height_category" varchar;--> statement-breakpoint
ALTER TABLE "product_colors" ADD CONSTRAINT "product_colors_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;
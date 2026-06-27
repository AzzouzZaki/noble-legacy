CREATE TABLE "delivery_companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "delivery_companies_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "office_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"office_id" integer NOT NULL,
	"home_price" numeric(10, 2) NOT NULL,
	"office_price" numeric(10, 2) NOT NULL,
	"return_price" numeric(10, 2) NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "office_prices_office_id_unique" UNIQUE("office_id")
);
--> statement-breakpoint
CREATE TABLE "offices" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"wilaya" varchar NOT NULL,
	"commune" varchar NOT NULL,
	"commune_id" integer NOT NULL,
	"office_name" varchar NOT NULL,
	"address" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "office_prices" ADD CONSTRAINT "office_prices_office_id_offices_id_fk" FOREIGN KEY ("office_id") REFERENCES "public"."offices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offices" ADD CONSTRAINT "offices_company_id_delivery_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."delivery_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_office_idx" ON "offices" USING btree ("company_id","commune_id","office_name");
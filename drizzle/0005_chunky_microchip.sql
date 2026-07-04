CREATE TABLE "admin_push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);

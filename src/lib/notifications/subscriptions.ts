/**
 * subscriptions.ts — Database helpers for admin push subscriptions.
 *
 * All DB access for the admin_push_subscriptions table lives here.
 * No business logic — only CRUD operations.
 */

import { db } from "@/db";
import { adminPushSubscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { PushSubscriptionData } from "./push";

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Returns all stored push subscriptions. */
export async function getAllSubscriptions(): Promise<PushSubscriptionData[]> {
  const rows = await db.select().from(adminPushSubscriptions);
  return rows.map((row) => ({
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
  }));
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Upsert a subscription by endpoint.
 * If the endpoint already exists, updates p256dh + auth (keys can rotate).
 * If not, inserts a new row.
 */
export async function upsertSubscription(
  data: PushSubscriptionData
): Promise<void> {
  await db
    .insert(adminPushSubscriptions)
    .values({
      endpoint: data.endpoint,
      p256dh: data.p256dh,
      auth: data.auth,
    })
    .onConflictDoUpdate({
      target: adminPushSubscriptions.endpoint,
      set: {
        p256dh: data.p256dh,
        auth: data.auth,
      },
    });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Remove a subscription by endpoint.
 * Called when a subscription expires (push service returns 404/410)
 * or when the admin explicitly unsubscribes.
 */
export async function deleteSubscription(endpoint: string): Promise<void> {
  await db
    .delete(adminPushSubscriptions)
    .where(eq(adminPushSubscriptions.endpoint, endpoint));
}

/**
 * service.ts — High-level NotificationService.
 *
 * This is the single public API that the rest of the application uses.
 * Business logic for delivering notifications lives here.
 *
 * Usage:
 *   import { NotificationService } from "@/lib/notifications/service";
 *   await NotificationService.newOrder(order);
 */

import { sendPushNotification, type PushPayload } from "./push";
import {
  getAllSubscriptions,
  deleteSubscription,
} from "./subscriptions";
import { newOrderPayload, testPayload, type OrderForNotification } from "./templates";

// ─── Expired subscription status codes ────────────────────────────────────────

/**
 * HTTP status codes that indicate a push subscription is permanently gone.
 * When we receive these, we remove the subscription from the DB to avoid
 * wasting future delivery attempts.
 */
const EXPIRED_STATUS_CODES = new Set([404, 410]);

// ─── Core delivery loop ───────────────────────────────────────────────────────

/**
 * Send a push payload to ALL registered subscriptions.
 *
 * - Delivers concurrently to every device.
 * - Automatically removes expired subscriptions (404/410).
 * - Never throws — all errors are caught and logged.
 * - One failed device never blocks delivery to the others.
 *
 * @returns Counts of successful, failed, and removed subscriptions.
 */
async function sendToAll(
  payload: PushPayload
): Promise<{ sent: number; failed: number; removed: number }> {
  let sent = 0;
  let failed = 0;
  let removed = 0;

  let subscriptions;
  try {
    subscriptions = await getAllSubscriptions();
  } catch (err) {
    console.error("[NotificationService] Failed to fetch subscriptions:", err);
    return { sent, failed, removed };
  }

  if (subscriptions.length === 0) {
    return { sent, failed, removed };
  }

  // Deliver to all subscriptions concurrently; collect results.
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const result = await sendPushNotification(sub, payload);

      if (result.success) {
        sent++;
        return;
      }

      // Subscription expired — clean it up silently
      if (
        result.statusCode !== null &&
        EXPIRED_STATUS_CODES.has(result.statusCode)
      ) {
        try {
          await deleteSubscription(sub.endpoint);
          removed++;
          console.info(
            `[NotificationService] Removed expired subscription (HTTP ${result.statusCode}): ${sub.endpoint.slice(0, 60)}…`
          );
        } catch (deleteErr) {
          console.error(
            "[NotificationService] Failed to remove expired subscription:",
            deleteErr
          );
        }
      } else {
        failed++;
        console.warn(
          `[NotificationService] Delivery failed (HTTP ${result.statusCode ?? "unknown"}): ${sub.endpoint.slice(0, 60)}…`
        );
      }
    })
  );

  // Log any unexpected rejections from the allSettled wrappers
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(
        `[NotificationService] Unexpected error for subscription[${i}]:`,
        r.reason
      );
      failed++;
    }
  });

  return { sent, failed, removed };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const NotificationService = {
  /**
   * Notify all admin devices about a new order.
   *
   * This must NEVER throw — it is called inside the order creation flow and
   * order creation must always succeed regardless of notification status.
   */
  async newOrder(order: OrderForNotification): Promise<void> {
    try {
      const payload = newOrderPayload(order);
      const stats = await sendToAll(payload);
      console.info(
        `[NotificationService] newOrder #${order.id} — sent: ${stats.sent}, failed: ${stats.failed}, removed: ${stats.removed}`
      );
    } catch (err) {
      // Safeguard: even if something unexpected happens, never propagate
      console.error(
        "[NotificationService] Unexpected error in newOrder:",
        err
      );
    }
  },

  /**
   * Send a test notification to all admin devices.
   * Used by POST /api/admin/push/test.
   */
  async sendTest(): Promise<{ sent: number; failed: number; removed: number }> {
    return sendToAll(testPayload());
  },

  /**
   * Send an arbitrary payload to all admin devices.
   * Exposed for future extensibility.
   */
  sendToAll,
} as const;

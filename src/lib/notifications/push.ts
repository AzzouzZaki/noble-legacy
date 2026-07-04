/**
 * push.ts — Low-level Web Push wrapper.
 *
 * This is the ONLY file in the project that imports web-push directly.
 * All other modules must go through this abstraction.
 */

import webPush from "web-push";

export type PushSubscriptionData = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushPayload = {
  title: string;
  body: string;
  /** Arbitrary data forwarded to the service worker (e.g. { orderId: 42 }) */
  data?: Record<string, unknown>;
  /** Icon URL shown in the notification (optional) */
  icon?: string;
  /** Badge URL (optional, used on Android) */
  badge?: string;
};

let configured = false;

/**
 * Lazily configure web-push with VAPID keys.
 * Called once the first time sendPushNotification is used.
 * Returns false if the required env vars are absent (allows graceful failure
 * during local dev before keys are generated).
 */
function ensureConfigured(): boolean {
  if (configured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.warn(
      "[push] VAPID keys are not configured. " +
        "Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in your .env file."
    );
    return false;
  }

  const subject =
    process.env.VAPID_SUBJECT ?? "mailto:noreply@example.com";

  webPush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

/**
 * Send a push notification to a single subscription.
 *
 * @returns A result object indicating success or the HTTP status on failure.
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<{ success: true } | { success: false; statusCode: number | null }> {
  if (!ensureConfigured()) {
    return { success: false, statusCode: null };
  }

  const pushSubscription: webPush.PushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webPush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );
    return { success: true };
  } catch (err: unknown) {
    const statusCode =
      err != null &&
      typeof err === "object" &&
      "statusCode" in err &&
      typeof (err as { statusCode: unknown }).statusCode === "number"
        ? (err as { statusCode: number }).statusCode
        : null;

    return { success: false, statusCode };
  }
}

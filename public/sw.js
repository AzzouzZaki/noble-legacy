/**
 * sw.js — Noble Legacy Admin Service Worker
 *
 * Handles:
 *   - push  : Receive a Web Push event and display a notification.
 *   - notificationclick : Open the correct admin order page when the
 *                         notification is clicked.
 *
 * This file must remain plain JavaScript (not TypeScript) so it can be
 * served directly from /public without a build step.
 */

/* ─── Push Event ─────────────────────────────────────────────────────────── */

self.addEventListener("push", (event) => {
  /** @type {{ title?: string; body?: string; icon?: string; badge?: string; data?: Record<string, unknown> }} */
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      // Fallback: treat data as a plain string body
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title ?? "🛍 Noble Legacy";
  const options = {
    body: payload.body ?? "You have a new notification.",
    icon: payload.icon ?? "/favicon.ico",
    badge: payload.badge ?? "/favicon.ico",
    data: payload.data ?? {},
    // Keep the notification visible until the user explicitly dismisses it
    requireInteraction: true,
    // Collapse duplicate notifications for the same order
    tag: payload.data?.orderId ? `order-${payload.data.orderId}` : "noble-legacy",
    // Vibration pattern (ms on, ms off, ms on)
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* ─── Notification Click Event ───────────────────────────────────────────── */

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Determine the target URL from notification data
  const data = event.notification.data ?? {};
  const targetUrl =
    data.url ??
    (data.orderId ? `/admin/orders/${data.orderId}` : "/admin/orders");

  event.waitUntil(
    // Try to focus an already-open admin tab first, then open a new one.
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Look for an existing window/tab we can navigate
        for (const client of windowClients) {
          if (new URL(client.url).origin === self.location.origin) {
            return client.focus().then((c) => c.navigate(targetUrl));
          }
        }
        // No existing window — open a new one
        return clients.openWindow(targetUrl);
      })
  );
});

/* ─── Install / Activate Lifecycle ──────────────────────────────────────── */

self.addEventListener("install", () => {
  // Skip the waiting phase so the new SW activates immediately.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Claim all open clients so this SW controls them right away.
  event.waitUntil(clients.claim());
});

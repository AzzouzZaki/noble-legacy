/**
 * templates.ts — Pure functions that build notification payloads.
 *
 * No database access, no side effects — just data transformation.
 * Add new notification templates here as the app grows.
 */

import type { PushPayload } from "./push";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrderForNotification = {
  id: number;
  customerName: string;
  totalAmount: string | number;
  /** Optional: delivery company name to surface in the notification body */
  deliveryCompany?: string | null;
  /** Optional: wilaya / region to surface in the notification body */
  wilaya?: string | null;
  /** Raw shipping address — used as a fallback when wilaya is absent */
  shippingAddress?: string | null;
};

// ─── Templates ────────────────────────────────────────────────────────────────

/**
 * Build the push payload for a new order notification.
 *
 * Body lines (each appended only when present):
 *   - Customer name
 *   - Total amount (formatted as "6 400 DA")
 *   - Delivery company
 *   - Wilaya (or first 60 chars of shippingAddress as fallback)
 */
export function newOrderPayload(order: OrderForNotification): PushPayload {
  const lines: string[] = [];

  lines.push(order.customerName);

  // Format amount: "6400.00" → "6 400 DA"
  const amount = parseFloat(String(order.totalAmount));
  if (!isNaN(amount)) {
    lines.push(
      amount.toLocaleString("fr-DZ", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }) + " DA"
    );
  }

  if (order.deliveryCompany) {
    lines.push(order.deliveryCompany);
  }

  if (order.wilaya) {
    lines.push(order.wilaya);
  } else if (order.shippingAddress) {
    // Trim the address to keep the notification body concise
    const trimmed = order.shippingAddress.trim().slice(0, 60);
    if (trimmed) lines.push(trimmed);
  }

  return {
    title: "🛍 New Order",
    body: lines.join("\n"),
    data: {
      orderId: order.id,
      url: `/admin/orders/${order.id}`,
    },
  };
}

/**
 * Build the push payload for a manual test notification.
 */
export function testPayload(): PushPayload {
  return {
    title: "🔔 Test Notification",
    body: "Push notifications are working correctly on this device.",
    data: {
      url: "/admin/orders",
    },
  };
}

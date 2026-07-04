/**
 * POST /api/admin/push/subscribe
 *
 * Stores (or updates) a Web Push subscription for an admin device.
 * Requires authenticated admin session (admin_token cookie).
 *
 * Request body:
 *   { endpoint: string; keys: { p256dh: string; auth: string } }
 */

import { NextRequest, NextResponse } from "next/server";
import { upsertSubscription } from "@/lib/notifications/subscriptions";

const COOKIE_NAME = "admin_token";
const COOKIE_VALUE = "authenticated";

function isAdminAuthenticated(request: NextRequest): boolean {
  return request.cookies.get(COOKIE_NAME)?.value === COOKIE_VALUE;
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate shape
  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).endpoint !== "string" ||
    typeof (body as Record<string, unknown>).keys !== "object" ||
    (body as Record<string, unknown>).keys === null
  ) {
    return NextResponse.json(
      { error: "Missing required fields: endpoint, keys" },
      { status: 400 }
    );
  }

  const { endpoint, keys } = body as {
    endpoint: string;
    keys: Record<string, unknown>;
  };

  if (
    typeof keys.p256dh !== "string" ||
    typeof keys.auth !== "string" ||
    !keys.p256dh ||
    !keys.auth
  ) {
    return NextResponse.json(
      { error: "Missing required key fields: p256dh, auth" },
      { status: 400 }
    );
  }

  if (!endpoint) {
    return NextResponse.json(
      { error: "endpoint must be a non-empty string" },
      { status: 400 }
    );
  }

  try {
    await upsertSubscription({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/admin/push/subscribe] Error:", err);
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 }
    );
  }
}

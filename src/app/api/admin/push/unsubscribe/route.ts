/**
 * DELETE /api/admin/push/unsubscribe
 *
 * Removes a Web Push subscription from the database.
 * Called when a subscription expires or the admin explicitly opts out.
 * Requires authenticated admin session (admin_token cookie).
 *
 * Request body:
 *   { endpoint: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { deleteSubscription } from "@/lib/notifications/subscriptions";

const COOKIE_NAME = "admin_token";
const COOKIE_VALUE = "authenticated";

function isAdminAuthenticated(request: NextRequest): boolean {
  return request.cookies.get(COOKIE_NAME)?.value === COOKIE_VALUE;
}

export async function DELETE(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const endpoint =
    typeof body === "object" &&
    body !== null &&
    typeof (body as Record<string, unknown>).endpoint === "string"
      ? (body as { endpoint: string }).endpoint
      : null;

  if (!endpoint) {
    return NextResponse.json(
      { error: "Missing required field: endpoint" },
      { status: 400 }
    );
  }

  try {
    await deleteSubscription(endpoint);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/admin/push/unsubscribe] Error:", err);
    return NextResponse.json(
      { error: "Failed to remove subscription" },
      { status: 500 }
    );
  }
}

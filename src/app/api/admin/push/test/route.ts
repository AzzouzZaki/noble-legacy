/**
 * POST /api/admin/push/test
 *
 * Sends a test push notification to every registered admin subscription.
 * Requires authenticated admin session (admin_token cookie).
 *
 * No request body required.
 */

import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/notifications/service";

const COOKIE_NAME = "admin_token";
const COOKIE_VALUE = "authenticated";

function isAdminAuthenticated(request: NextRequest): boolean {
  return request.cookies.get(COOKIE_NAME)?.value === COOKIE_VALUE;
}

export async function POST(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await NotificationService.sendTest();
    return NextResponse.json({
      success: true,
      sent: stats.sent,
      failed: stats.failed,
      removed: stats.removed,
    });
  } catch (err) {
    console.error("[POST /api/admin/push/test] Error:", err);
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 }
    );
  }
}

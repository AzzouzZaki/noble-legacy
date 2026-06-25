import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";

const COOKIE_NAME = "admin_token";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

// POST /api/admin/auth — login
export async function POST(request: NextRequest) {
  try {
    let username = "";
    let password = "";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      username = (body.username ?? "").trim();
      password = body.password ?? "";
    } else {
      // Native form submission (application/x-www-form-urlencoded)
      const formData = await request.formData();
      username = ((formData.get("username") as string) ?? "").trim();
      password = (formData.get("password") as string) ?? "";
    }

    if (!username || !password) {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("error", "Please enter both username and password.");
      return NextResponse.redirect(url, { status: 303 });
    }

    const valid = await verifyAdmin(username, password);

    if (!valid) {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("error", "Invalid username or password. Please try again.");
      return NextResponse.redirect(url, { status: 303 });
    }

    // ✅ Set cookie directly on the redirect response.
    // This means one atomic HTTP response: Set-Cookie + Location.
    // The browser stores the cookie BEFORE following the redirect — no race condition.
    const response = NextResponse.redirect(new URL("/admin/products", request.url), {
      status: 303,
    });
    response.cookies.set(COOKIE_NAME, "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Authentication route error:", error);
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("error", "A server error occurred. Please try again.");
    return NextResponse.redirect(url, { status: 303 });
  }
}

// DELETE /api/admin/auth — logout
export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}
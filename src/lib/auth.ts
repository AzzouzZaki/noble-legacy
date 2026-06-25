import { cookies } from "next/headers";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "admin_token";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function verifyAdmin(
  username: string,
  password: string
): Promise<boolean> {
  const hash = hashPassword(password);
  const user = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, username))
    .limit(1);

  if (user.length === 0) return false;
  const stored = user[0].passwordHash;
  // If stored hash looks like a bcrypt hash, use bcrypt.compare
  if (typeof stored === "string" && stored.startsWith("$2")) {
    return bcrypt.compareSync(password, stored);
  }

  // Fallback to SHA256 comparison for legacy seeds
  return stored === hash;
}

export async function setAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
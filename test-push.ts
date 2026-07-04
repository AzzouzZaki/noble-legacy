import { chromium } from "playwright";
import "dotenv/config";
import { db } from "./src/db";
import { adminPushSubscriptions } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function runTest() {
  console.log("Starting Next.js server...");
  const { exec } = await import("child_process");
  const server = exec("npm run dev");
  
  // wait for server to be ready
  await new Promise((r) => setTimeout(r, 5000));
  
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    permissions: ["notifications"],
  });
  
  const page = await context.newPage();
  page.on("console", (msg) => console.log("BROWSER CONSOLE:", msg.text()));
  page.on("pageerror", (err) => console.log("BROWSER ERROR:", err.message));
  page.on("requestfailed", (request) =>
    console.log("BROWSER NETWORK FAILED:", request.url(), request.failure()?.errorText)
  );
  
  console.log("Navigating to login...");
  await page.goto("http://localhost:3000/admin/login");
  
  console.log("Logging in...");
  await page.fill('input[name="username"]', "anis");
  await page.fill('input[name="password"]', "anis@2005");
  await page.click('button[type="submit"]');
  
  console.log("Waiting for navigation to admin panel...");
  await page.waitForURL("**/admin/**");
  
  console.log("Waiting for subscription to complete...");
  await page.waitForTimeout(3000);
  
  console.log("Checking database...");
  const subs = await db.select().from(adminPushSubscriptions);
  console.log("Subscriptions in DB:", subs.length);
  if (subs.length > 0) {
    console.log("✅ Subscription successfully saved!");
  } else {
    console.log("❌ No subscriptions found in DB.");
  }
  
  console.log("Testing POST /api/admin/push/test...");
  // Get the cookie
  const cookies = await context.cookies();
  const adminToken = cookies.find((c) => c.name === "admin_token")?.value;
  
  if (adminToken) {
    const res = await fetch("http://localhost:3000/api/admin/push/test", {
      method: "POST",
      headers: {
        Cookie: `admin_token=${adminToken}`,
      },
    });
    const json = await res.json();
    console.log("Test endpoint response:", json);
  } else {
    console.log("❌ Admin token not found in cookies!");
  }
  
  await browser.close();
  server.kill();
  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

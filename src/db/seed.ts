import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db } from "./index";
import { adminUsers, products, productSizes, productImages, productColors, orders, orderItems } from "./schema";
import { uploadImage } from "../lib/cloudinary";
import "dotenv/config";

async function fetchImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const mimeType = "image/jpeg";
  return `data:${mimeType};base64,${base64}`;
}

const seedProducts = [
  { name: "تيشيرت أوفرسايز بروكلين", type: "adult", price: "2800" },
  { name: "تيشيرت ستريتوير فايت", type: "adult", price: "2800" },
  { name: "تيشيرت باكي هانما", type: "adult", price: "3200" },
  { name: "تيشيرت ستاند الون", type: "adult", price: "2800" },
  { name: "تيشيرت أطفال ديناصور", type: "kids", price: "1800" },
  { name: "تيشيرت أطفال سوبر هيرو", type: "kids", price: "1800" },
];

const adultSizes = ["S", "M", "L", "XL", "XXL"];
const kidsSizes = ["2-3Y", "4-5Y", "6-7Y", "8-9Y"];
const adminAccounts = [
  {
    username: "anis",
    password: "anis@2005",
  },
];

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function upsertAdminAccounts() {
  for (const account of adminAccounts) {
    const existing = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, account.username))
      .limit(1);

    const passwordHash = hashPassword(account.password);

    if (existing.length > 0) {
      await db
        .update(adminUsers)
        .set({ passwordHash })
        .where(eq(adminUsers.username, account.username));
      continue;
    }

    await db.insert(adminUsers).values({
      username: account.username,
      passwordHash,
    });
  }
}

async function seed() {
  console.log("🌱 Seeding database...");

  // clear existing seed data (optional — delete in reverse FK order)
  await db.delete(productImages);
  await db.delete(productColors);
  await db.delete(productSizes);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(products);

  await upsertAdminAccounts();

  let imageCounter = 1;

  for (const p of seedProducts) {
    console.log(`Uploading images for ${p.name}...`);
    const imageUrls: string[] = [];
    
    for (let i = 0; i < 3; i++) {
      const base64Image = await fetchImageAsBase64(`https://picsum.photos/800/800?random=${imageCounter}`);
      const cloudinaryUrl = await uploadImage(base64Image);
      imageUrls.push(cloudinaryUrl);
      imageCounter++;
    }

    console.log(`Inserting product ${p.name}...`);
    const [insertedProduct] = await db
      .insert(products)
      .values({
        name: p.name,
        price: p.price,
        imageUrl: imageUrls[0], // First image as fallback/primary
        description: `This is a high quality ${p.type} t-shirt.`,
      })
      .returning();

    console.log(`Inserting sizes for ${p.name}...`);
    const sizesToInsert = p.type === "adult" ? adultSizes : kidsSizes;
    const sizesData = sizesToInsert.map(size => ({
      productId: insertedProduct.id,
      size: size,
    }));
    await db.insert(productSizes).values(sizesData);

    console.log(`Inserting images for ${p.name}...`);
    const imagesData = imageUrls.map((url, index) => ({
      productId: insertedProduct.id,
      url: url,
      position: index,
    }));
    await db.insert(productImages).values(imagesData);
  }

  console.log("✅ Done!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});

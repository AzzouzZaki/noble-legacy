import "dotenv/config";
import { db } from "./index";
import {
  products,
  productSizes,
  orders,
  orderItems,
  adminUsers,
} from "./schema";
import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(orderItems);
  await db.delete(productSizes);
  await db.delete(orders);
  await db.delete(products);
  await db.delete(adminUsers);

  // Seed Admin User
  const passwordHash = await bcrypt.hash("admin", 10);
  await db.insert(adminUsers).values({
    username: "admin",
    passwordHash: passwordHash,
  });

  // Seed Products and Sizes
  const createdProducts = [];
  for (let i = 0; i < 10; i++) {
    const [product] = await db
      .insert(products)
      .values({
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: faker.commerce.price({ min: 10, max: 200 }),
        stock: faker.number.int({ min: 0, max: 100 }),
        imageUrl: faker.image.url(),
      })
      .returning();
    createdProducts.push(product);

    const sizes = ["S", "M", "L", "XL"];
    for (const size of sizes) {
      await db.insert(productSizes).values({
        productId: product.id,
        size: size,
        stock: faker.number.int({ min: 0, max: 50 }),
      });
    }
  }

  // Seed Orders and Order Items
  for (let i = 0; i < 5; i++) {
    const [order] = await db
      .insert(orders)
      .values({
        customerName: faker.person.fullName(),
        customerPhone: faker.phone.number(),
        customerEmail: faker.internet.email(),
        shippingAddress: faker.location.streetAddress(),
        totalAmount: "0", // Will be updated after creating items
        status: faker.helpers.arrayElement(["pending", "shipped", "delivered"]),
      })
      .returning();

    let totalAmount = 0;
    const numItems = faker.number.int({ min: 1, max: 3 });
    for (let j = 0; j < numItems; j++) {
      const randomProduct = faker.helpers.arrayElement(createdProducts);
      const quantity = faker.number.int({ min: 1, max: 5 });
      const unitPrice = parseFloat(randomProduct.price);
      totalAmount += quantity * unitPrice;

      await db.insert(orderItems).values({
        orderId: order.id,
        productId: randomProduct.id,
        size: faker.helpers.arrayElement(["S", "M", "L"]),
        quantity: quantity,
        unitPrice: String(unitPrice),
      });
    }

    await db
      .update(orders)
      .set({ totalAmount: String(totalAmount.toFixed(2)) })
      .where(eq(orders.id, order.id));
  }

  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Error seeding database:", error);
  process.exit(1);
});

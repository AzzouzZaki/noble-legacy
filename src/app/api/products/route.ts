import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productSizes, productImages, productColors } from "@/db/schema";
import { asc } from "drizzle-orm";

// GET /api/products
export async function GET() {
  try {
    const allProducts = await db.select().from(products).orderBy(asc(products.id));
    const allSizes = await db.select().from(productSizes);
    const allImages = await db.select().from(productImages).orderBy(asc(productImages.position));
    const allColors = await db.select().from(productColors);

    const productsWithSizes = allProducts.map((p) => {
      const sizes = allSizes
        .filter((s) => s.productId === p.id)
        .map((s) => ({
          id: s.id,
          size: s.size,
        }));
      const images = allImages
        .filter((img) => img.productId === p.id)
        .map((img) => ({
          id: img.id,
          url: img.url,
          position: img.position,
        }));
      const colors = allColors
        .filter((color) => color.productId === p.id)
        .map((color) => ({
          id: color.id,
          name: color.name,
          value: color.value,
        }));
      return { ...p, sizes, images, colors };
    });

    return NextResponse.json(productsWithSizes);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, imageUrl, sizes, images, colors } = body;

    const [newProduct] = await db
      .insert(products)
      .values({ name, description, price, imageUrl })
      .returning();

    if (sizes && sizes.length > 0) {
      await db.insert(productSizes).values(
        sizes.map((s: { size: string }) => ({
          productId: newProduct.id,
          size: s.size,
        }))
      );
    }

    if (images && images.length > 0) {
      await db.insert(productImages).values(
        images.map((img: { url: string; position: number }) => ({
          productId: newProduct.id,
          url: img.url,
          position: img.position,
        }))
      );
    }

    if (colors && colors.length > 0) {
      const colorRows = colors
        .filter((color: { name?: string; value?: string }) => (color.name || color.value))
        .map((color: { name?: string; value?: string }) => ({
          productId: newProduct.id,
          name: color.name?.trim() || color.value || "Color",
          value: color.value || "#000000",
        }));

      if (colorRows.length > 0) {
        await db.insert(productColors).values(colorRows);
      }
    }

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

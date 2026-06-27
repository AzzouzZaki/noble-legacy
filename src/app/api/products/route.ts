import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productSizes, productImages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

// GET /api/products
export async function GET() {
  try {
    const allProducts = await db.select().from(products).orderBy(asc(products.id));
    const allSizes = await db.select().from(productSizes);
    const allImages = await db.select().from(productImages).orderBy(asc(productImages.position));

    const productsWithSizes = allProducts.map((p) => {
      const sizes = allSizes
        .filter((s) => s.productId === p.id)
        .map((s) => ({
          id: s.id,
          size: s.size,
          stock: s.stock,
        }));
      const images = allImages
        .filter((img) => img.productId === p.id)
        .map((img) => ({
          id: img.id,
          url: img.url,
          position: img.position,
        }));
      return { ...p, sizes, images };
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
    const { name, description, price, stock, imageUrl, sizes, images } = body;

    const [newProduct] = await db
      .insert(products)
      .values({ name, description, price, stock, imageUrl })
      .returning();

    if (sizes && sizes.length > 0) {
      await db.insert(productSizes).values(
        sizes.map((s: { size: string; stock: number }) => ({
          productId: newProduct.id,
          size: s.size,
          stock: s.stock,
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

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
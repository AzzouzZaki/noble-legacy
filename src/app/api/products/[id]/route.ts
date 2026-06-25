import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productSizes } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/products/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, parseInt(id)))
      .limit(1);

    if (product.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const sizes = await db
      .select()
      .from(productSizes)
      .where(eq(productSizes.productId, parseInt(id)));

    return NextResponse.json({ ...product[0], sizes });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT /api/products/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, price, stock, imageUrl, sizes } = body;

    const [updated] = await db
      .update(products)
      .set({ name, description, price, stock, imageUrl })
      .where(eq(products.id, parseInt(id)))
      .returning();

    if (sizes) {
      await db
        .delete(productSizes)
        .where(eq(productSizes.productId, parseInt(id)));

      if (sizes.length > 0) {
        await db.insert(productSizes).values(
          sizes.map((s: { size: string; stock: number }) => ({
            productId: parseInt(id),
            size: s.size,
            stock: s.stock,
          }))
        );
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db
      .delete(productSizes)
      .where(eq(productSizes.productId, parseInt(id)));

    await db.delete(products).where(eq(products.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
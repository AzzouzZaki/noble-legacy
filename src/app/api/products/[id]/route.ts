import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productSizes, productImages, productColors } from "@/db/schema";
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

    const images = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, parseInt(id)))
      .orderBy(productImages.position);

    const colors = await db
      .select()
      .from(productColors)
      .where(eq(productColors.productId, parseInt(id)));

    return NextResponse.json({ ...product[0], sizes, images, colors });
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
    const { name, description, price, imageUrl, sizes, images, colors } = body;

    const [updated] = await db
      .update(products)
      .set({ name, description, price, imageUrl })
      .where(eq(products.id, parseInt(id)))
      .returning();

    if (sizes) {
      await db
        .delete(productSizes)
        .where(eq(productSizes.productId, parseInt(id)));

      if (sizes.length > 0) {
        await db.insert(productSizes).values(
          sizes.map((s: { size: string }) => ({
            productId: parseInt(id),
            size: s.size,
          }))
        );
      }
    }

    if (images) {
      await db
        .delete(productImages)
        .where(eq(productImages.productId, parseInt(id)));

      if (images.length > 0) {
        await db.insert(productImages).values(
          images.map((img: { url: string; position: number }) => ({
            productId: parseInt(id),
            url: img.url,
            position: img.position,
          }))
        );
      }
    }

    if (colors) {
      await db
        .delete(productColors)
        .where(eq(productColors.productId, parseInt(id)));

      if (colors.length > 0) {
        const colorRows = colors
          .filter((color: { name?: string; value?: string }) => (color.name || color.value))
          .map((color: { name?: string; value?: string }) => ({
            productId: parseInt(id),
            name: color.name?.trim() || color.value || "Color",
            value: color.value || "#000000",
          }));

        if (colorRows.length > 0) {
          await db.insert(productColors).values(colorRows);
        }
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
      .delete(productImages)
      .where(eq(productImages.productId, parseInt(id)));

    await db
      .delete(productColors)
      .where(eq(productColors.productId, parseInt(id)));

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

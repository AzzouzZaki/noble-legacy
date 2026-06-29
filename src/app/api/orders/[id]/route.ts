import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/orders/:id — get order details with items
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const orderList = await db
      .select()
      .from(orders)
      .where(eq(orders.id, parseInt(id)))
      .limit(1);

    if (orderList.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const itemsList = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        size: orderItems.size,
        colorName: orderItems.colorName,
        colorValue: orderItems.colorValue,
        heightCategory: orderItems.heightCategory,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        productName: products.name,
        productImageUrl: products.imageUrl,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, parseInt(id)));

    return NextResponse.json({
      ...orderList[0],
      items: itemsList,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch order details" }, { status: 500 });
  }
}

// PUT /api/orders/:id — update status
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    const validStatuses = ["pending", "confirmed", "shipped", "delivered"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, parseInt(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

// DELETE /api/orders/:id
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await db.delete(orderItems).where(eq(orderItems.orderId, parseInt(id)));
    await db.delete(orders).where(eq(orders.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}

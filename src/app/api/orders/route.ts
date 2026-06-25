import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/orders
export async function GET() {
  try {
    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(orders.createdAt);
    return NextResponse.json(allOrders);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      totalAmount,
      items,
    } = body;

    const [newOrder] = await db
      .insert(orders)
      .values({
        customerName,
        customerPhone,
        customerEmail,
        shippingAddress,
        totalAmount,
      })
      .returning();

    if (items && items.length > 0) {
      await db.insert(orderItems).values(
        items.map((item: {
          productId: number;
          size: string;
          quantity: number;
          unitPrice: string;
        }) => ({
          orderId: newOrder.id,
          productId: item.productId,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))
      );
    }

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/orders error:', error, error?.stack);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
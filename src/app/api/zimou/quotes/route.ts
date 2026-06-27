import { NextRequest, NextResponse } from "next/server";
import { fetchZimouDeliveryQuotes } from "@/lib/zimou";

export async function GET(request: NextRequest) {
  try {
    const communeId = Number(request.nextUrl.searchParams.get("communeId"));

    if (!Number.isFinite(communeId) || communeId <= 0) {
      return NextResponse.json(
        { error: "Missing communeId" },
        { status: 400 }
      );
    }

    const quotes = await fetchZimouDeliveryQuotes(communeId);
    return NextResponse.json({ data: quotes });
  } catch (error) {
    console.error("GET /api/zimou/quotes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Zimou delivery quotes" },
      { status: 500 }
    );
  }
}

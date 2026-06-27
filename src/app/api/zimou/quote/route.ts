import { NextRequest, NextResponse } from "next/server";
import { quoteZimouOffice, ZimouOffice } from "@/lib/zimou";

export async function POST(request: NextRequest) {
  try {
    const office = (await request.json()) as ZimouOffice;

    if (!office?.id || !office?.communeId) {
      return NextResponse.json(
        { error: "Missing office id or commune id" },
        { status: 400 }
      );
    }

    const quote = await quoteZimouOffice(office);
    return NextResponse.json({ data: quote });
  } catch (error) {
    console.error("POST /api/zimou/quote error:", error);
    return NextResponse.json(
      { error: "Failed to quote Zimou delivery" },
      { status: 500 }
    );
  }
}

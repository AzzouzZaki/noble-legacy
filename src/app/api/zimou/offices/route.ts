import { NextResponse } from "next/server";
import { fetchZimouOffices } from "@/lib/zimou";

export async function GET() {
  try {
    const offices = await fetchZimouOffices();
    return NextResponse.json({ data: offices });
  } catch (error) {
    console.error("GET /api/zimou/offices error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Zimou offices" },
      { status: 500 }
    );
  }
}

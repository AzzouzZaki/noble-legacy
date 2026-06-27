import { NextResponse } from "next/server";
import { fetchZimouCommunes } from "@/lib/zimou";

export async function GET() {
  try {
    const communes = await fetchZimouCommunes();
    return NextResponse.json({ data: communes });
  } catch (error) {
    console.error("GET /api/zimou/communes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Zimou communes" },
      { status: 500 }
    );
  }
}

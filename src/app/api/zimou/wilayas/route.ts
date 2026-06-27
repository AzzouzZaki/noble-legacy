import { NextResponse } from "next/server";
import { fetchZimouWilayas } from "@/lib/zimou";

export async function GET() {
  try {
    const wilayas = await fetchZimouWilayas();
    return NextResponse.json({ data: wilayas });
  } catch (error) {
    console.error("GET /api/zimou/wilayas error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Zimou wilayas" },
      { status: 500 }
    );
  }
}

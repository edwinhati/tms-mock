import { desc } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { shipments } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10);

    const recentShipments = await db
      .select()
      .from(shipments)
      .orderBy(desc(shipments.createdAt))
      .limit(limit);

    const response = NextResponse.json(recentShipments);
    response.headers.set(
      "Cache-Control",
      "private, max-age=15, stale-while-revalidate=30",
    );

    return response;
  } catch (error) {
    console.error("Error fetching recent shipments:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: 500 },
    );
  }
}

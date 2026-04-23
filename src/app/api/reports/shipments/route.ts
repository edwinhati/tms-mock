import { parseISO } from "date-fns";
import { and, count, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { shipments } from "@/lib/db/schema";

const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(
        1,
        parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10),
      ),
    );

    const conditions: SQL<unknown>[] = [];

    if (startDate) {
      conditions.push(gte(shipments.createdAt, parseISO(startDate)));
    }

    if (endDate) {
      conditions.push(lte(shipments.createdAt, parseISO(endDate)));
    }

    if (status) {
      conditions.push(
        eq(
          shipments.status,
          status as "planned" | "in_transit" | "delivered" | "cancelled",
        ),
      );
    }

    if (customerId) {
      conditions.push(eq(shipments.customerId, customerId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [results, totalCount] = await Promise.all([
      db
        .select()
        .from(shipments)
        .where(whereClause)
        .orderBy(desc(shipments.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ count: count() })
        .from(shipments)
        .where(whereClause)
        .then((res) => res[0]?.count || 0),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    const response = NextResponse.json({
      data: results,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });

    response.headers.set(
      "Cache-Control",
      "private, max-age=10, stale-while-revalidate=30",
    );

    return response;
  } catch (error) {
    console.error("Error fetching shipment report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 },
    );
  }
}

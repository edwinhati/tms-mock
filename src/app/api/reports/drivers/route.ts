import { parseISO } from "date-fns";
import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { drivers, shipmentLegs } from "@/lib/db/schema";

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

    const dateConditions: any[] = [];
    if (startDate) {
      dateConditions.push(gte(shipmentLegs.createdAt, parseISO(startDate)));
    }
    if (endDate) {
      dateConditions.push(lte(shipmentLegs.createdAt, parseISO(endDate)));
    }
    const dateFilter =
      dateConditions.length > 0 ? and(...dateConditions) : undefined;

    const driverStats = await db
      .select({
        driverId: drivers.id,
        driverName: drivers.name,
        totalShipments: count(shipmentLegs.id),
        completedShipments: count(
          sql`CASE WHEN ${shipmentLegs.status} = 'completed' THEN 1 END`,
        ),
        inProgressShipments: count(
          sql`CASE WHEN ${shipmentLegs.status} = 'in_progress' THEN 1 END`,
        ),
        onTimeDeliveries: count(
          sql`CASE WHEN ${shipmentLegs.status} = 'completed' 
            AND ${shipmentLegs.actualArrival} IS NOT NULL 
            AND ${shipmentLegs.plannedArrival} IS NOT NULL
            AND ${shipmentLegs.actualArrival} <= ${shipmentLegs.plannedArrival} THEN 1 END`,
        ),
        lateDeliveries: count(
          sql`CASE WHEN ${shipmentLegs.status} = 'completed' 
            AND ${shipmentLegs.actualArrival} IS NOT NULL 
            AND ${shipmentLegs.plannedArrival} IS NOT NULL
            AND ${shipmentLegs.actualArrival} > ${shipmentLegs.plannedArrival} THEN 1 END`,
        ),
      })
      .from(drivers)
      .leftJoin(shipmentLegs, eq(drivers.id, shipmentLegs.driverId))
      .where(dateFilter)
      .groupBy(drivers.id, drivers.name)
      .orderBy(drivers.name);

    const response = NextResponse.json(driverStats);
    response.headers.set(
      "Cache-Control",
      "private, max-age=30, stale-while-revalidate=60",
    );

    return response;
  } catch (error) {
    console.error("Error fetching driver performance:", error);
    return NextResponse.json(
      { error: "Failed to fetch driver performance" },
      { status: 500 },
    );
  }
}

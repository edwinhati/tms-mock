import { endOfDay, startOfDay } from "date-fns";
import { count, eq, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { drivers, shipmentLegs, shipments } from "@/lib/db/schema";

export const revalidate = 30;

export async function GET(request: NextRequest) {
  try {
    // Get session using the request directly
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const [shipmentStats, activeDrivers, activeLegs] = await Promise.all([
      db
        .select({
          total: count(),
          planned: sql<number>`count(*) filter (where ${shipments.status} = 'planned')`,
          inTransit: sql<number>`count(*) filter (where ${shipments.status} = 'in_transit')`,
          delivered: sql<number>`count(*) filter (where ${shipments.status} = 'delivered')`,
          cancelled: sql<number>`count(*) filter (where ${shipments.status} = 'cancelled')`,
          today: sql<number>`count(*) filter (where ${shipments.createdAt} >= ${todayStart.toISOString()} and ${shipments.createdAt} <= ${todayEnd.toISOString()})`,
        })
        .from(shipments),
      db
        .select({ count: count() })
        .from(drivers)
        .where(eq(drivers.status, "active")),
      db
        .select({ count: count() })
        .from(shipmentLegs)
        .where(eq(shipmentLegs.status, "in_progress")),
    ]);

    const response = NextResponse.json({
      totalShipments: Number(shipmentStats[0]?.total || 0),
      plannedShipments: Number(shipmentStats[0]?.planned || 0),
      inTransitShipments: Number(shipmentStats[0]?.inTransit || 0),
      deliveredShipments: Number(shipmentStats[0]?.delivered || 0),
      cancelledShipments: Number(shipmentStats[0]?.cancelled || 0),
      todayShipments: Number(shipmentStats[0]?.today || 0),
      activeDrivers: Number(activeDrivers[0]?.count || 0),
      activeLegs: Number(activeLegs[0]?.count || 0),
    });

    response.headers.set(
      "Cache-Control",
      "private, max-age=30, stale-while-revalidate=60",
    );

    return response;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}

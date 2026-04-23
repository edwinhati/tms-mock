import { eq, inArray } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { drivers, shipmentLegs, shipments } from "@/lib/db/schema";
import {
  resolveSiteNames,
  type SiteReference,
  type SiteType,
} from "@/lib/site-resolver";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const driver = await db
      .select()
      .from(drivers)
      .where(eq(drivers.userId, session.user.id))
      .limit(1);

    if (driver.length === 0) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    const driverId = driver[0].id;

    const legs = await db
      .select({ shipmentId: shipmentLegs.shipmentId })
      .from(shipmentLegs)
      .where(eq(shipmentLegs.driverId, driverId));

    if (legs.length === 0) {
      return NextResponse.json([]);
    }

    const shipmentIds = [
      ...new Set(legs.map((leg) => leg.shipmentId)),
    ] as string[];

    const shipmentsData = await db
      .select()
      .from(shipments)
      .where(inArray(shipments.id, shipmentIds));

    const siteRefs: SiteReference[] = [];
    for (const shipment of shipmentsData) {
      if (shipment.originId && shipment.originType) {
        siteRefs.push({
          id: shipment.originId,
          type: shipment.originType as SiteType,
        });
      }
      if (shipment.destinationId && shipment.destinationType) {
        siteRefs.push({
          id: shipment.destinationId,
          type: shipment.destinationType as SiteType,
        });
      }
    }

    const siteNames = await resolveSiteNames(siteRefs);

    const shipmentsWithNames = shipmentsData.map((shipment) => ({
      ...shipment,
      originName: siteNames.get(`${shipment.originType}:${shipment.originId}`),
      destinationName: siteNames.get(
        `${shipment.destinationType}:${shipment.destinationId}`,
      ),
    }));

    return NextResponse.json(shipmentsWithNames);
  } catch (error) {
    console.error("Error fetching driver shipments:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: 500 },
    );
  }
}

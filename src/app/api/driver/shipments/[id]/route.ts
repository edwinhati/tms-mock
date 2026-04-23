import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shipmentItems,
  shipmentLegs,
  shipmentStatusHistory,
  shipments,
} from "@/lib/db/schema";
import {
  resolveSiteNames,
  type SiteReference,
  type SiteType,
} from "@/lib/site-resolver";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [shipment] = await db
      .select()
      .from(shipments)
      .where(eq(shipments.id, id))
      .limit(1);

    if (!shipment) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 },
      );
    }

    const items = await db
      .select()
      .from(shipmentItems)
      .where(eq(shipmentItems.shipmentId, id));

    const legs = await db
      .select()
      .from(shipmentLegs)
      .where(eq(shipmentLegs.shipmentId, id))
      .orderBy(shipmentLegs.legNumber);

    const history = await db
      .select()
      .from(shipmentStatusHistory)
      .where(eq(shipmentStatusHistory.shipmentId, id))
      .orderBy(shipmentStatusHistory.createdAt);

    const siteRefs: SiteReference[] = [];
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
    for (const leg of legs) {
      if (leg.originId && leg.originType) {
        siteRefs.push({ id: leg.originId, type: leg.originType as SiteType });
      }
      if (leg.destinationId && leg.destinationType) {
        siteRefs.push({
          id: leg.destinationId,
          type: leg.destinationType as SiteType,
        });
      }
    }

    const siteNames = await resolveSiteNames(siteRefs);

    return NextResponse.json({
      ...shipment,
      originName: siteNames.get(`${shipment.originType}:${shipment.originId}`),
      destinationName: siteNames.get(
        `${shipment.destinationType}:${shipment.destinationId}`,
      ),
      items,
      legs: legs.map((leg) => ({
        ...leg,
        originName: siteNames.get(`${leg.originType}:${leg.originId}`),
        destinationName: siteNames.get(
          `${leg.destinationType}:${leg.destinationId}`,
        ),
      })),
      history,
    });
  } catch (error) {
    console.error("Error fetching shipment detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipment" },
      { status: 500 },
    );
  }
}

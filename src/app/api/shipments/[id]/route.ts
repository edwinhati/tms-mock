import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

const shipmentUpdateSchema = z.object({
  customerId: z.string().optional(),
  originId: z.string().optional(),
  originType: z
    .enum(["warehouse", "hub", "port", "school", "vendor", "customer"])
    .optional(),
  destinationId: z.string().optional(),
  destinationType: z
    .enum(["warehouse", "hub", "port", "school", "vendor", "customer"])
    .optional(),
  scheduledDate: z.string().datetime().optional(),
  slaDeadline: z.string().datetime().optional(),
  notes: z.string().optional(),
});

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

    const totalLegs = legs.length;
    const completedLegs = legs.filter(
      (leg) => leg.status === "completed",
    ).length;
    const calculatedProgress =
      totalLegs > 0 ? Math.round((completedLegs / totalLegs) * 100) : 0;

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
      calculatedProgress,
    });
  } catch (error) {
    console.error("Error fetching shipment:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipment" },
      { status: 500 },
    );
  }
}

export async function PUT(
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
    const body = await request.json();
    const validatedData = shipmentUpdateSchema.parse(body);

    const updatedShipment = await db
      .update(shipments)
      .set({
        ...validatedData,
        scheduledDate: validatedData.scheduledDate
          ? new Date(validatedData.scheduledDate)
          : undefined,
        slaDeadline: validatedData.slaDeadline
          ? new Date(validatedData.slaDeadline)
          : undefined,
      })
      .where(eq(shipments.id, id))
      .returning();

    if (updatedShipment.length === 0) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedShipment[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error updating shipment:", error);
    return NextResponse.json(
      { error: "Failed to update shipment" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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
    const deletedShipment = await db
      .delete(shipments)
      .where(eq(shipments.id, id))
      .returning();

    if (deletedShipment.length === 0) {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Shipment deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting shipment:", error);
    return NextResponse.json(
      { error: "Failed to delete shipment" },
      { status: 500 },
    );
  }
}

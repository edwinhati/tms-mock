import { and, count, desc, eq, type SQL } from "drizzle-orm";
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

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

const shipmentItemSchema = z.object({
  goodsId: z.string(),
  quantity: z.number().int().positive(),
  weight: z.number().optional(),
  volume: z.number().optional(),
  notes: z.string().optional(),
});

const shipmentLegSchema = z.object({
  legNumber: z.number().int().positive(),
  originId: z.string(),
  originType: z.enum([
    "warehouse",
    "hub",
    "port",
    "school",
    "vendor",
    "customer",
  ]),
  destinationId: z.string(),
  destinationType: z.enum([
    "warehouse",
    "hub",
    "port",
    "school",
    "vendor",
    "customer",
  ]),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  plannedDeparture: z.string().optional(),
  plannedArrival: z.string().optional(),
  notes: z.string().optional(),
});

const createShipmentSchema = z.object({
  customerId: z.string(),
  originId: z.string(),
  originType: z.enum([
    "warehouse",
    "hub",
    "port",
    "school",
    "vendor",
    "customer",
  ]),
  destinationId: z.string(),
  destinationType: z.enum([
    "warehouse",
    "hub",
    "port",
    "school",
    "vendor",
    "customer",
  ]),
  scheduledDate: z.string().optional(),
  slaDeadline: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(shipmentItemSchema).min(1, "At least one item is required"),
  legs: z.array(shipmentLegSchema).min(1, "At least one leg is required"),
});

function generateShipmentNumber(): string {
  const prefix = "SHP";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(
        1,
        Number.parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10),
      ),
    );
    const offset = Math.max(
      0,
      Number.parseInt(searchParams.get("offset") || "0", 10),
    );

    const conditions: SQL<unknown>[] = [];

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
      db.query.shipments.findMany({
        where: whereClause,
        orderBy: desc(shipments.createdAt),
        limit,
        offset,
        with: {
          legs: true,
        },
      }),
      db
        .select({ count: count() })
        .from(shipments)
        .where(whereClause)
        .then((res) => res[0]?.count || 0),
    ]);

    const siteRefs: SiteReference[] = [];
    for (const shipment of results) {
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
      for (const leg of shipment.legs) {
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
    }

    const siteNames = await resolveSiteNames(siteRefs);

    const shipmentsWithProgress = results.map((shipment) => {
      const totalLegs = shipment.legs.length;
      const completedLegs = shipment.legs.filter(
        (leg) => leg.status === "completed",
      ).length;
      const calculatedProgress =
        totalLegs > 0 ? Math.round((completedLegs / totalLegs) * 100) : 0;

      return {
        ...shipment,
        originName: siteNames.get(
          `${shipment.originType}:${shipment.originId}`,
        ),
        destinationName: siteNames.get(
          `${shipment.destinationType}:${shipment.destinationId}`,
        ),
        legs: shipment.legs.map((leg) => ({
          ...leg,
          originName: siteNames.get(`${leg.originType}:${leg.originId}`),
          destinationName: siteNames.get(
            `${leg.destinationType}:${leg.destinationId}`,
          ),
        })),
        calculatedProgress,
      };
    });

    const response = NextResponse.json({
      data: shipmentsWithProgress,
      pagination: {
        limit,
        offset,
        totalCount,
        hasMore: offset + results.length < totalCount,
      },
    });

    response.headers.set(
      "Cache-Control",
      "private, max-age=10, stale-while-revalidate=30",
    );

    return response;
  } catch (error) {
    console.error("Error fetching shipments:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createShipmentSchema.parse(body);

    // Create shipment with items and legs in a transaction
    const result = await db.transaction(async (tx) => {
      // Create shipment
      const [shipment] = await tx
        .insert(shipments)
        .values({
          id: crypto.randomUUID(),
          shipmentNumber: generateShipmentNumber(),
          customerId: validatedData.customerId,
          originId: validatedData.originId,
          originType: validatedData.originType,
          destinationId: validatedData.destinationId,
          destinationType: validatedData.destinationType,
          status: "planned" as const,
          scheduledDate: validatedData.scheduledDate
            ? new Date(validatedData.scheduledDate)
            : null,
          slaDeadline: validatedData.slaDeadline
            ? new Date(validatedData.slaDeadline)
            : null,
          notes: validatedData.notes,
          createdBy: session.user.id,
        })
        .returning();

      // Create shipment items
      if (validatedData.items.length > 0) {
        await tx.insert(shipmentItems).values(
          validatedData.items.map((item) => ({
            id: crypto.randomUUID(),
            shipmentId: shipment.id,
            goodsId: item.goodsId,
            quantity: item.quantity,
            weight: item.weight?.toString(),
            volume: item.volume?.toString(),
            notes: item.notes,
          })),
        );
      }

      for (const leg of validatedData.legs) {
        await tx.insert(shipmentLegs).values({
          id: crypto.randomUUID(),
          shipmentId: shipment.id,
          legNumber: leg.legNumber,
          originId: leg.originId,
          originType: leg.originType,
          destinationId: leg.destinationId,
          destinationType: leg.destinationType,
          vehicleId: leg.vehicleId || null,
          driverId: leg.driverId || null,
          status: "pending" as const,
          plannedDeparture: leg.plannedDeparture
            ? new Date(leg.plannedDeparture)
            : null,
          plannedArrival: leg.plannedArrival
            ? new Date(leg.plannedArrival)
            : null,
          notes: leg.notes,
        });
      }

      // Create initial status history
      await tx.insert(shipmentStatusHistory).values({
        id: crypto.randomUUID(),
        shipmentId: shipment.id,
        status: "planned" as const,
        notes: "Shipment created",
        updatedBy: session.user.id,
      });

      return shipment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error creating shipment:", error);
    return NextResponse.json(
      { error: "Failed to create shipment" },
      { status: 500 },
    );
  }
}

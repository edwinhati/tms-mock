import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shipmentLegs,
  shipmentStatusHistory,
  shipments,
} from "@/lib/db/schema";

const updateLegStatusSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  notes: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; legId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: shipmentId, legId } = await params;
    const body = await request.json();
    const validatedData = updateLegStatusSchema.parse(body);

    const result = await db.transaction(async (tx) => {
      // 1. Fetch the leg to check existence and legNumber
      const [leg] = await tx
        .select()
        .from(shipmentLegs)
        .where(
          and(
            eq(shipmentLegs.id, legId),
            eq(shipmentLegs.shipmentId, shipmentId),
          ),
        )
        .limit(1);

      if (!leg) {
        throw new Error("Leg not found");
      }

      // 2. Prepare update data for shipment_legs
      const legUpdateData: {
        status: "pending" | "in_progress" | "completed" | "cancelled";
        updatedAt: Date;
        actualDeparture?: Date;
        actualArrival?: Date;
        notes?: string;
      } = {
        status: validatedData.status,
        updatedAt: new Date(),
      };

      if (validatedData.status === "in_progress" && !leg.actualDeparture) {
        legUpdateData.actualDeparture = new Date();
      } else if (validatedData.status === "completed" && !leg.actualArrival) {
        legUpdateData.actualArrival = new Date();
      }

      if (validatedData.notes !== undefined) {
        legUpdateData.notes = validatedData.notes;
      }

      // 3. Update the specific shipment_legs record
      const [updatedLeg] = await tx
        .update(shipmentLegs)
        .set(legUpdateData)
        .where(eq(shipmentLegs.id, legId))
        .returning();

      // 4. Record the change in shipment_status_history
      await tx.insert(shipmentStatusHistory).values({
        id: crypto.randomUUID(),
        shipmentId: shipmentId,
        legId: legId,
        status: validatedData.status,
        notes: validatedData.notes,
        updatedBy: session.user.id,
      });

      // 5. Business Rule: If the first leg (legNumber 1) is started (in_progress),
      // automatically update the main shipments table status to in_transit.
      if (leg.legNumber === 1 && validatedData.status === "in_progress") {
        const [updatedShipment] = await tx
          .update(shipments)
          .set({
            status: "in_transit",
            updatedAt: new Date(),
          })
          .where(
            and(eq(shipments.id, shipmentId), eq(shipments.status, "planned")),
          )
          .returning();

        if (updatedShipment) {
          await tx.insert(shipmentStatusHistory).values({
            id: crypto.randomUUID(),
            shipmentId: shipmentId,
            status: "in_transit",
            notes: "Automatically updated to in_transit because Leg 1 started",
            updatedBy: session.user.id,
          });
        }
      }

      return updatedLeg;
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === "Leg not found") {
      return NextResponse.json({ error: "Leg not found" }, { status: 404 });
    }
    console.error("Error updating leg status:", error);
    return NextResponse.json(
      { error: "Failed to update leg status" },
      { status: 500 },
    );
  }
}

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shipmentLegs, shipmentStatusHistory } from "@/lib/db/schema";

const updateStatusSchema = z.object({
  legId: z.string(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  notes: z.string().optional(),
});

export async function POST(
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
    const validatedData = updateStatusSchema.parse(body);

    const result = await db.transaction(async (tx) => {
      const [updatedLeg] = await tx
        .update(shipmentLegs)
        .set({
          status: validatedData.status,
          actualDeparture:
            validatedData.status === "in_progress" ? new Date() : undefined,
          actualArrival:
            validatedData.status === "completed" ? new Date() : undefined,
        })
        .where(eq(shipmentLegs.id, validatedData.legId))
        .returning();

      if (!updatedLeg) {
        throw new Error("Leg not found");
      }

      await tx.insert(shipmentStatusHistory).values({
        id: crypto.randomUUID(),
        shipmentId: id,
        legId: validatedData.legId,
        status: validatedData.status,
        notes: validatedData.notes,
        updatedBy: session.user.id,
      });

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
    console.error("Error updating status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 },
    );
  }
}

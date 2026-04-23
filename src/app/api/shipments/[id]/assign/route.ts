import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shipmentLegs } from "@/lib/db/schema";
import { notifyDriverAssignment } from "@/lib/notifications/service";

const assignSchema = z.object({
  legId: z.string(),
  vehicleId: z.string(),
  driverId: z.string(),
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
    const validatedData = assignSchema.parse(body);

    const updatedLeg = await db
      .update(shipmentLegs)
      .set({
        vehicleId: validatedData.vehicleId,
        driverId: validatedData.driverId,
      })
      .where(eq(shipmentLegs.id, validatedData.legId))
      .returning();

    if (updatedLeg.length === 0) {
      return NextResponse.json({ error: "Leg not found" }, { status: 404 });
    }

    // Send WhatsApp notification to driver
    try {
      const legWithDetails = await db.query.shipmentLegs.findFirst({
        where: eq(shipmentLegs.id, validatedData.legId),
        with: {
          driver: true,
          shipment: true,
        },
      });

      if (legWithDetails?.driver?.phone && legWithDetails?.shipment) {
        await notifyDriverAssignment(
          legWithDetails.driver.phone,
          legWithDetails.driver.name,
          legWithDetails.shipment.shipmentNumber,
        );
      }
    } catch (notificationError) {
      // Log but don't fail the request if notification fails
      console.error("Failed to send driver notification:", notificationError);
    }

    return NextResponse.json(updatedLeg[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error assigning vehicle/driver:", error);
    return NextResponse.json(
      { error: "Failed to assign vehicle/driver" },
      { status: 500 },
    );
  }
}

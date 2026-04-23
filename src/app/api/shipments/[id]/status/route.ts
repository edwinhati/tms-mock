import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { asc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shipmentLegs,
  shipmentStatusHistory,
  shipments,
} from "@/lib/db/schema";
import {
  notifyDeliveryComplete,
  notifyStatusUpdate,
} from "@/lib/notifications/service";
import { resolveSiteNames, type SiteType } from "@/lib/site-resolver";

const updateStatusSchema = z.object({
  status: z.enum(["planned", "in_transit", "delivered", "cancelled"]),
  notes: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
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
      const [updatedShipment] = await tx
        .update(shipments)
        .set({
          status: validatedData.status,
          actualDate:
            validatedData.status === "delivered" ? new Date() : undefined,
        })
        .where(eq(shipments.id, id))
        .returning();

      if (!updatedShipment) {
        throw new Error("Shipment not found");
      }

      // Automatically activate first leg if shipment starts
      if (validatedData.status === "in_transit") {
        const [firstLeg] = await tx
          .select()
          .from(shipmentLegs)
          .where(eq(shipmentLegs.shipmentId, id))
          .orderBy(asc(shipmentLegs.legNumber))
          .limit(1);

        if (firstLeg && firstLeg.status === "pending") {
          await tx
            .update(shipmentLegs)
            .set({
              status: "in_progress",
              actualDeparture: new Date(),
            })
            .where(eq(shipmentLegs.id, firstLeg.id));
        }
      }

      await tx.insert(shipmentStatusHistory).values({
        id: crypto.randomUUID(),
        shipmentId: id,
        status: validatedData.status,
        notes: validatedData.notes,
        latitude: validatedData.latitude?.toString(),
        longitude: validatedData.longitude?.toString(),
        updatedBy: session.user.id,
      });

      return updatedShipment;
    });

    // Send WhatsApp notification to customer
    try {
      const shipmentWithCustomer = await db.query.shipments.findFirst({
        where: eq(shipments.id, id),
        with: {
          customer: true,
        },
      });

      if (shipmentWithCustomer?.customer?.phone) {
        let destinationName = "Dalam perjalanan";

        if (
          shipmentWithCustomer.destinationId &&
          shipmentWithCustomer.destinationType
        ) {
          const siteNames = await resolveSiteNames([
            {
              id: shipmentWithCustomer.destinationId,
              type: shipmentWithCustomer.destinationType as SiteType,
            },
          ]);
          destinationName =
            siteNames.get(
              `${shipmentWithCustomer.destinationType}:${shipmentWithCustomer.destinationId}`,
            ) || "Dalam perjalanan";
        }

        const location = validatedData.notes || destinationName;

        if (validatedData.status === "delivered") {
          // Send delivery complete notification
          const deliveredAt = format(new Date(), "dd MMMM yyyy, HH:mm", {
            locale: localeId,
          });
          await notifyDeliveryComplete(
            shipmentWithCustomer.customer.phone,
            shipmentWithCustomer.shipmentNumber,
            deliveredAt,
          );
        } else {
          // Send status update notification
          await notifyStatusUpdate(
            shipmentWithCustomer.customer.phone,
            shipmentWithCustomer.shipmentNumber,
            validatedData.status,
            location,
          );
        }
      }
    } catch (notificationError) {
      // Log but don't fail the request if notification fails
      console.error("Failed to send notification:", notificationError);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === "Shipment not found") {
      return NextResponse.json(
        { error: "Shipment not found" },
        { status: 404 },
      );
    }
    console.error("Error updating shipment status:", error);
    return NextResponse.json(
      { error: "Failed to update shipment status" },
      { status: 500 },
    );
  }
}

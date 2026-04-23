import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shippingRates } from "@/lib/db/schema";

const shippingRateUpdateSchema = z.object({
  originId: z.string().min(1, "Origin is required").optional(),
  originType: z
    .enum(["warehouse", "hub", "port", "school", "vendor", "customer"])
    .optional(),
  destinationId: z.string().min(1, "Destination is required").optional(),
  destinationType: z
    .enum(["warehouse", "hub", "port", "school", "vendor", "customer"])
    .optional(),
  vehicleType: z.enum(["truck", "wing_box", "ship", "container"]).optional(),
  ratePerKg: z.number().optional(),
  ratePerVolume: z.number().optional(),
  ratePerTrip: z.number().optional(),
  effectiveDate: z.string().datetime().optional(),
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
    const rate = await db
      .select()
      .from(shippingRates)
      .where(eq(shippingRates.id, id))
      .limit(1);

    if (rate.length === 0) {
      return NextResponse.json(
        { error: "Shipping rate not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(rate[0]);
  } catch (error) {
    console.error("Error fetching shipping rate:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping rate" },
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
    const validatedData = shippingRateUpdateSchema.parse(body);

    const updatedRate = await db
      .update(shippingRates)
      .set({
        ...validatedData,
        effectiveDate: validatedData.effectiveDate
          ? new Date(validatedData.effectiveDate)
          : undefined,
        ratePerKg: validatedData.ratePerKg?.toString(),
        ratePerVolume: validatedData.ratePerVolume?.toString(),
        ratePerTrip: validatedData.ratePerTrip?.toString(),
      })
      .where(eq(shippingRates.id, id))
      .returning();

    if (updatedRate.length === 0) {
      return NextResponse.json(
        { error: "Shipping rate not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedRate[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error updating shipping rate:", error);
    return NextResponse.json(
      { error: "Failed to update shipping rate" },
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
    const deletedRate = await db
      .delete(shippingRates)
      .where(eq(shippingRates.id, id))
      .returning();

    if (deletedRate.length === 0) {
      return NextResponse.json(
        { error: "Shipping rate not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Shipping rate deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting shipping rate:", error);
    return NextResponse.json(
      { error: "Failed to delete shipping rate" },
      { status: 500 },
    );
  }
}

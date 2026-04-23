import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { drivers } from "@/lib/db/schema";

const driverUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  phone: z.string().min(1, "Phone is required").optional(),
  licenseNumber: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  userId: z.string().optional(),
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
    const driver = await db
      .select()
      .from(drivers)
      .where(eq(drivers.id, id))
      .limit(1);

    if (driver.length === 0) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json(driver[0]);
  } catch (error) {
    console.error("Error fetching driver:", error);
    return NextResponse.json(
      { error: "Failed to fetch driver" },
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
    const validatedData = driverUpdateSchema.parse(body);

    const updatedDriver = await db
      .update(drivers)
      .set(validatedData)
      .where(eq(drivers.id, id))
      .returning();

    if (updatedDriver.length === 0) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json(updatedDriver[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error updating driver:", error);
    return NextResponse.json(
      { error: "Failed to update driver" },
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
    const deletedDriver = await db
      .delete(drivers)
      .where(eq(drivers.id, id))
      .returning();

    if (deletedDriver.length === 0) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Driver deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting driver:", error);
    return NextResponse.json(
      { error: "Failed to delete driver" },
      { status: 500 },
    );
  }
}

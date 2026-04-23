import { and, desc, eq, like, type SQL } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { vehicles } from "@/lib/db/schema";

const vehicleSchema = z.object({
  licensePlate: z.string().min(1, "License plate is required"),
  type: z.enum(["truck", "wing_box", "ship", "container"]),
  capacity: z.string().optional(),
  vendorId: z.string().min(1, "Vendor is required"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

    const conditions: SQL<unknown>[] = [];

    if (search) {
      conditions.push(like(vehicles.licensePlate, `%${search}%`));
    }

    if (type) {
      conditions.push(
        eq(vehicles.type, type as "truck" | "wing_box" | "ship" | "container"),
      );
    }

    if (status) {
      conditions.push(
        eq(vehicles.status, status as "active" | "inactive" | "maintenance"),
      );
    }

    const results = await db
      .select()
      .from(vehicles)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(vehicles.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
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
    const validatedData = vehicleSchema.parse(body);

    // Parse numeric value from capacity string (e.g., "5000 KG" -> 5000)
    const capacityNumeric = validatedData.capacity
      ? parseFloat(validatedData.capacity.replace(/[^0-9.]/g, "")) || null
      : null;

    const newVehicle = await db
      .insert(vehicles)
      .values({
        ...validatedData,
        id: crypto.randomUUID(),
        capacity: capacityNumeric,
        status: "active",
      })
      .returning();

    return NextResponse.json(newVehicle[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error creating vehicle:", error);
    return NextResponse.json(
      { error: "Failed to create vehicle" },
      { status: 500 },
    );
  }
}

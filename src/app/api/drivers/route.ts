import { and, desc, eq, like, type SQL } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { drivers } from "@/lib/db/schema";

const driverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  licenseNumber: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  userId: z.string().optional(),
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
    const status = searchParams.get("status");
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

    const conditions: SQL<unknown>[] = [];

    if (search) {
      conditions.push(like(drivers.name, `%${search}%`));
    }

    if (status) {
      conditions.push(eq(drivers.status, status as "active" | "inactive"));
    }

    const results = await db
      .select()
      .from(drivers)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(drivers.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json(
      { error: "Failed to fetch drivers" },
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
    const validatedData = driverSchema.parse(body);

    const newDriver = await db
      .insert(drivers)
      .values({
        ...validatedData,
        id: crypto.randomUUID(),
      })
      .returning();

    return NextResponse.json(newDriver[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error creating driver:", error);
    return NextResponse.json(
      { error: "Failed to create driver" },
      { status: 500 },
    );
  }
}

import { and, desc, eq, like, type SQL } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";

const schoolSchema = z.object({
  name: z.string().min(1, "Name is required"),
  locationId: z.string().min(1, "Location is required"),
  educationLevel: z.enum(["SD", "SMP", "SMA", "SMK"]),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
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
    const educationLevel = searchParams.get("educationLevel");
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

    const conditions: SQL<unknown>[] = [];

    if (search) {
      conditions.push(like(schools.name, `%${search}%`));
    }

    if (educationLevel) {
      conditions.push(
        eq(
          schools.educationLevel,
          educationLevel as "SD" | "SMP" | "SMA" | "SMK",
        ),
      );
    }

    const results = await db
      .select()
      .from(schools)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(schools.createdAt))
      .limit(limit)
      .offset(offset);

    // Ensure each result has proper string name
    const sanitizedResults = results.map((r) => ({
      ...r,
      name: typeof r.name === "string" ? r.name : String(r.name),
    }));

    return NextResponse.json(sanitizedResults);
  } catch (error) {
    console.error("Error fetching schools:", error);
    return NextResponse.json(
      { error: "Failed to fetch schools" },
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
    const validatedData = schoolSchema.parse(body);

    const newSchool = await db
      .insert(schools)
      .values({
        ...validatedData,
        id: crypto.randomUUID(),
      })
      .returning();

    return NextResponse.json(newSchool[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error creating school:", error);
    return NextResponse.json(
      { error: "Failed to create school" },
      { status: 500 },
    );
  }
}

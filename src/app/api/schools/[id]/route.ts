import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";

const schoolUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  locationId: z.string().min(1, "Location is required").optional(),
  educationLevel: z.enum(["SD", "SMP", "SMA", "SMK"]).optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
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
    const school = await db
      .select()
      .from(schools)
      .where(eq(schools.id, id))
      .limit(1);

    if (school.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json(school[0]);
  } catch (error) {
    console.error("Error fetching school:", error);
    return NextResponse.json(
      { error: "Failed to fetch school" },
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
    const validatedData = schoolUpdateSchema.parse(body);

    const updatedSchool = await db
      .update(schools)
      .set(validatedData)
      .where(eq(schools.id, id))
      .returning();

    if (updatedSchool.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json(updatedSchool[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error updating school:", error);
    return NextResponse.json(
      { error: "Failed to update school" },
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
    const deletedSchool = await db
      .delete(schools)
      .where(eq(schools.id, id))
      .returning();

    if (deletedSchool.length === 0) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "School deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting school:", error);
    return NextResponse.json(
      { error: "Failed to delete school" },
      { status: 500 },
    );
  }
}

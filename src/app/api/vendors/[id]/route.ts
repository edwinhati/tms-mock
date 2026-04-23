import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { vendors } from "@/lib/db/schema";

const vendorUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
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
    const vendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, id))
      .limit(1);

    if (vendor.length === 0) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json(vendor[0]);
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
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
    const validatedData = vendorUpdateSchema.parse(body);

    const updatedVendor = await db
      .update(vendors)
      .set(validatedData)
      .where(eq(vendors.id, id))
      .returning();

    if (updatedVendor.length === 0) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json(updatedVendor[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error updating vendor:", error);
    return NextResponse.json(
      { error: "Failed to update vendor" },
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
    const deletedVendor = await db
      .delete(vendors)
      .where(eq(vendors.id, id))
      .returning();

    if (deletedVendor.length === 0) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Vendor deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 },
    );
  }
}

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hubs } from "@/lib/db/schema/tms";
import { hubSchema } from "@/lib/schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [hub] = await db.select().from(hubs).where(eq(hubs.id, id));

    if (!hub) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 });
    }

    return NextResponse.json(hub);
  } catch (error) {
    console.error("Failed to fetch hub:", error);
    return NextResponse.json({ error: "Failed to fetch hub" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.type) {
      body.type = "hub";
    }

    const validatedData = hubSchema.parse(body);

    const [updatedHub] = await db
      .update(hubs)
      .set({
        name: validatedData.name,
        phone: validatedData.phone || null,
        provinceCode: validatedData.provinceCode,
        provinceName: validatedData.provinceName,
        cityCode: validatedData.cityCode,
        cityName: validatedData.cityName,
        districtCode: validatedData.districtCode,
        districtName: validatedData.districtName,
        villageCode: validatedData.villageCode,
        villageName: validatedData.villageName,
        address: validatedData.address,
        latitude: validatedData.latitude || null,
        longitude: validatedData.longitude || null,
      })
      .where(eq(hubs.id, id))
      .returning();

    if (!updatedHub) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 });
    }

    return NextResponse.json(updatedHub);
  } catch (error) {
    console.error("Failed to update hub:", error);
    return NextResponse.json(
      { error: "Failed to update hub" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [deletedHub] = await db
      .delete(hubs)
      .where(eq(hubs.id, id))
      .returning();

    if (!deletedHub) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete hub:", error);
    return NextResponse.json(
      { error: "Failed to delete hub" },
      { status: 500 },
    );
  }
}

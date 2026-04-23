import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ports } from "@/lib/db/schema/tms";
import { portSchema } from "@/lib/schemas";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [port] = await db.select().from(ports).where(eq(ports.id, id));

    if (!port) {
      return NextResponse.json({ error: "Port not found" }, { status: 404 });
    }

    return NextResponse.json(port);
  } catch (error) {
    console.error("Failed to fetch port:", error);
    return NextResponse.json(
      { error: "Failed to fetch port" },
      { status: 500 },
    );
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
      body.type = "port";
    }

    const validatedData = portSchema.parse(body);

    const [updatedPort] = await db
      .update(ports)
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
      .where(eq(ports.id, id))
      .returning();

    if (!updatedPort) {
      return NextResponse.json({ error: "Port not found" }, { status: 404 });
    }

    return NextResponse.json(updatedPort);
  } catch (error) {
    console.error("Failed to update port:", error);
    return NextResponse.json(
      { error: "Failed to update port" },
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
    const [deletedPort] = await db
      .delete(ports)
      .where(eq(ports.id, id))
      .returning();

    if (!deletedPort) {
      return NextResponse.json({ error: "Port not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete port:", error);
    return NextResponse.json(
      { error: "Failed to delete port" },
      { status: 500 },
    );
  }
}

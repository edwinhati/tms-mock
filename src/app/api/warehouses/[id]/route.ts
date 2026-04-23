import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { warehouses } from "@/lib/db/schema/tms";
import { eq } from "drizzle-orm";
import { warehouseSchema } from "@/lib/schemas";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [warehouse] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, id));

    if (!warehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(warehouse);
  } catch (error) {
    console.error("Failed to fetch warehouse:", error);
    return NextResponse.json(
      { error: "Failed to fetch warehouse" },
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

    // Add type if missing
    if (!body.type) {
      body.type = "warehouse";
    }

    const validatedData = warehouseSchema.parse(body);

    const [updatedWarehouse] = await db
      .update(warehouses)
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
      .where(eq(warehouses.id, id))
      .returning();

    if (!updatedWarehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedWarehouse);
  } catch (error) {
    console.error("Failed to update warehouse:", error);
    return NextResponse.json(
      { error: "Failed to update warehouse" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const [deletedWarehouse] = await db
      .delete(warehouses)
      .where(eq(warehouses.id, id))
      .returning();

    if (!deletedWarehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete warehouse:", error);
    return NextResponse.json(
      { error: "Failed to delete warehouse" },
      { status: 500 },
    );
  }
}

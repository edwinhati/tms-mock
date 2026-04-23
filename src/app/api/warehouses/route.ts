import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { warehouses } from "@/lib/db/schema/tms";
import { warehouseSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const allWarehouses = await db.select().from(warehouses);
    return NextResponse.json(allWarehouses);
  } catch (error) {
    console.error("Failed to fetch warehouses:", error);
    return NextResponse.json(
      { error: "Failed to fetch warehouses" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Add type if missing
    if (!body.type) {
      body.type = "warehouse";
    }

    const validatedData = warehouseSchema.parse(body);

    const [newWarehouse] = await db
      .insert(warehouses)
      .values({
        id: crypto.randomUUID(),
        name: validatedData.name,
        contactPerson: null, // locationSchema doesn't have contactPerson, we map phone/address
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
      .returning();

    return NextResponse.json(newWarehouse, { status: 201 });
  } catch (error) {
    console.error("Failed to create warehouse:", error);
    return NextResponse.json(
      { error: "Failed to create warehouse" },
      { status: 400 },
    );
  }
}

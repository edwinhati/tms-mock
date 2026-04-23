import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ports } from "@/lib/db/schema/tms";
import { eq } from "drizzle-orm";
import { portSchema } from "@/lib/schemas";
import crypto from "crypto";

export async function GET() {
  try {
    const allPorts = await db.select().from(ports);
    return NextResponse.json(allPorts);
  } catch (error) {
    console.error("Failed to fetch ports:", error);
    return NextResponse.json(
      { error: "Failed to fetch ports" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.type) {
      body.type = "port";
    }

    const validatedData = portSchema.parse(body);

    const [newPort] = await db
      .insert(ports)
      .values({
        id: crypto.randomUUID(),
        name: validatedData.name,
        contactPerson: null,
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

    return NextResponse.json(newPort, { status: 201 });
  } catch (error) {
    console.error("Failed to create port:", error);
    return NextResponse.json(
      { error: "Failed to create port" },
      { status: 400 },
    );
  }
}

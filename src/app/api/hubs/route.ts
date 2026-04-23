import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hubs } from "@/lib/db/schema/tms";
import { eq } from "drizzle-orm";
import { hubSchema } from "@/lib/schemas";
import crypto from "crypto";

export async function GET() {
  try {
    const allHubs = await db.select().from(hubs);
    return NextResponse.json(allHubs);
  } catch (error) {
    console.error("Failed to fetch hubs:", error);
    return NextResponse.json(
      { error: "Failed to fetch hubs" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.type) {
      body.type = "hub";
    }

    const validatedData = hubSchema.parse(body);

    const [newHub] = await db
      .insert(hubs)
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

    return NextResponse.json(newHub, { status: 201 });
  } catch (error) {
    console.error("Failed to create hub:", error);
    return NextResponse.json(
      { error: "Failed to create hub" },
      { status: 400 },
    );
  }
}

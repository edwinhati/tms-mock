import { and, desc, eq, type SQL } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shippingRates } from "@/lib/db/schema";
import { shippingRateSchema } from "@/lib/schemas";
import {
  resolveSiteNames,
  type SiteReference,
  type SiteType,
} from "@/lib/site-resolver";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const originId = searchParams.get("originId");
    const originType = searchParams.get("originType") as SiteType | null;
    const destinationId = searchParams.get("destinationId");
    const destinationType = searchParams.get(
      "destinationType",
    ) as SiteType | null;
    const vehicleType = searchParams.get("vehicleType");
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

    const conditions: SQL<unknown>[] = [];

    if (originId) {
      conditions.push(eq(shippingRates.originId, originId));
    }
    if (originType) {
      conditions.push(eq(shippingRates.originType, originType));
    }

    if (destinationId) {
      conditions.push(eq(shippingRates.destinationId, destinationId));
    }
    if (destinationType) {
      conditions.push(eq(shippingRates.destinationType, destinationType));
    }

    if (vehicleType) {
      conditions.push(
        eq(
          shippingRates.vehicleType,
          vehicleType as "truck" | "wing_box" | "ship" | "container",
        ),
      );
    }

    // Get shipping rates
    const rates = await db
      .select()
      .from(shippingRates)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(shippingRates.effectiveDate))
      .limit(limit)
      .offset(offset);

    // Get all location references
    const siteRefs: SiteReference[] = [];
    for (const r of rates) {
      siteRefs.push({ id: r.originId, type: r.originType as SiteType });
      siteRefs.push({
        id: r.destinationId,
        type: r.destinationType as SiteType,
      });
    }

    // Fetch location names
    const siteMap = await resolveSiteNames(siteRefs);

    // Enrich with location names
    const enrichedResults = rates.map((rate) => ({
      ...rate,
      originLocationName:
        siteMap.get(`${rate.originType}:${rate.originId}`) || rate.originId,
      destinationLocationName:
        siteMap.get(`${rate.destinationType}:${rate.destinationId}`) ||
        rate.destinationId,
    }));

    return NextResponse.json(enrichedResults);
  } catch (error) {
    console.error("Error fetching shipping rates:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping rates" },
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
    const validatedData = shippingRateSchema.parse(body);

    const newRate = await db
      .insert(shippingRates)
      .values({
        ...validatedData,
        id: crypto.randomUUID(),
        effectiveDate: validatedData.effectiveDate
          ? new Date(validatedData.effectiveDate)
          : new Date(),
        ratePerTrip: validatedData.rate,
      })
      .returning();

    return NextResponse.json(newRate[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error creating shipping rate:", error);
    return NextResponse.json(
      { error: "Failed to create shipping rate" },
      { status: 500 },
    );
  }
}

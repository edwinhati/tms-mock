import { and, desc, eq, like, type SQL } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { goods } from "@/lib/db/schema";

const goodsSchema = z.object({
  materialCode: z.string().min(1, "Material code is required"),
  description: z.string().min(1, "Description is required"),
  unit: z.enum(["set", "unit", "pcs"]),
  defaultWeight: z.number().optional(),
  defaultVolume: z.number().optional(),
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
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const offset = Number.parseInt(searchParams.get("offset") || "0", 10);

    const conditions: SQL<unknown>[] = [];

    if (search) {
      conditions.push(
        like(goods.materialCode, `%${search}%`),
        like(goods.description, `%${search}%`),
      );
    }

    const results = await db
      .select()
      .from(goods)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(goods.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching goods:", error);
    return NextResponse.json(
      { error: "Failed to fetch goods" },
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
    const validatedData = goodsSchema.parse(body);

    const newGoods = await db
      .insert(goods)
      .values({
        ...validatedData,
        id: crypto.randomUUID(),
        defaultWeight: validatedData.defaultWeight?.toString(),
        defaultVolume: validatedData.defaultVolume?.toString(),
      })
      .returning();

    return NextResponse.json(newGoods[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error creating goods:", error);
    return NextResponse.json(
      { error: "Failed to create goods" },
      { status: 500 },
    );
  }
}

import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { goods } from "@/lib/db/schema";

const goodsUpdateSchema = z.object({
  materialCode: z.string().min(1, "Material code is required").optional(),
  description: z.string().min(1, "Description is required").optional(),
  unit: z.enum(["set", "unit", "pcs"]).optional(),
  defaultWeight: z.number().optional(),
  defaultVolume: z.number().optional(),
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
    const item = await db.select().from(goods).where(eq(goods.id, id)).limit(1);

    if (item.length === 0) {
      return NextResponse.json({ error: "Goods not found" }, { status: 404 });
    }

    return NextResponse.json(item[0]);
  } catch (error) {
    console.error("Error fetching goods:", error);
    return NextResponse.json(
      { error: "Failed to fetch goods" },
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
    const validatedData = goodsUpdateSchema.parse(body);

    const updatedGoods = await db
      .update(goods)
      .set({
        ...validatedData,
        defaultWeight: validatedData.defaultWeight?.toString(),
        defaultVolume: validatedData.defaultVolume?.toString(),
      })
      .where(eq(goods.id, id))
      .returning();

    if (updatedGoods.length === 0) {
      return NextResponse.json({ error: "Goods not found" }, { status: 404 });
    }

    return NextResponse.json(updatedGoods[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error updating goods:", error);
    return NextResponse.json(
      { error: "Failed to update goods" },
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
    const deletedGoods = await db
      .delete(goods)
      .where(eq(goods.id, id))
      .returning();

    if (deletedGoods.length === 0) {
      return NextResponse.json({ error: "Goods not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Goods deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting goods:", error);
    return NextResponse.json(
      { error: "Failed to delete goods" },
      { status: 500 },
    );
  }
}

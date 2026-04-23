import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deliveryProofs } from "@/lib/db/schema";

const photoSchema = z.object({
  legId: z.string().optional(),
  type: z.enum(["photo", "bast", "signature"]),
  fileUrl: z.string(),
  notes: z.string().optional(),
  takenAt: z.string().datetime().optional(),
});

export async function POST(
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
    const validatedData = photoSchema.parse(body);

    const newProof = await db
      .insert(deliveryProofs)
      .values({
        id: crypto.randomUUID(),
        shipmentId: id,
        legId: validatedData.legId || null,
        type: validatedData.type,
        fileUrl: validatedData.fileUrl,
        notes: validatedData.notes,
        takenAt: validatedData.takenAt
          ? new Date(validatedData.takenAt)
          : new Date(),
        takenBy: session.user.id,
      })
      .returning();

    return NextResponse.json(newProof[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }
    console.error("Error uploading photo:", error);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 },
    );
  }
}

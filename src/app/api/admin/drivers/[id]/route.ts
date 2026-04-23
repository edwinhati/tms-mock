import { db } from "@/lib/db";
import { users, drivers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { name, licenseNumber, status } = await req.json();

    const driver = await db.query.drivers.findFirst({
      where: eq(drivers.id, id),
    });

    if (!driver) {
      return Response.json({ error: "Driver not found" }, { status: 404 });
    }

    const now = new Date();

    await db
      .update(drivers)
      .set({
        name: name || driver.name,
        licenseNumber:
          licenseNumber !== undefined ? licenseNumber : driver.licenseNumber,
        status: status || driver.status,
        updatedAt: now,
      })
      .where(eq(drivers.id, id));

    if (name) {
      await db
        .update(users)
        .set({
          name,
          updatedAt: now,
        })
        .where(eq(users.id, driver.userId));
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating driver:", error);
    return Response.json({ error: "Failed to update driver" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const driver = await db.query.drivers.findFirst({
      where: eq(drivers.id, id),
    });

    if (!driver) {
      return Response.json({ error: "Driver not found" }, { status: 404 });
    }

    await db.delete(drivers).where(eq(drivers.id, id));
    await db.delete(users).where(eq(users.id, driver.userId));

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting driver:", error);
    return Response.json({ error: "Failed to delete driver" }, { status: 500 });
  }
}

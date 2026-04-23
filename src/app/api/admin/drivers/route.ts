import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { drivers, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth/server";

function validatePhone(phone: string): boolean {
  return /^08\d{8,11}$/.test(phone);
}

export async function GET() {
  try {
    const driversWithUsers = await db.query.drivers.findMany({
      with: {
        user: true,
      },
      orderBy: (t: any, { desc }: any) => [desc(t.createdAt)],
    });

    const formattedDrivers = driversWithUsers.map((driver) => ({
      id: driver.id,
      userId: driver.userId,
      name: driver.name,
      phone: driver.user?.phone,
      email: driver.user?.email,
      licenseNumber: driver.licenseNumber,
      status: driver.status,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    }));

    return Response.json({ drivers: formattedDrivers });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return Response.json({ error: "Failed to fetch drivers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, password, phone, licenseNumber } = await req.json();

    if (!name || !email || !password || !phone) {
      return Response.json(
        { error: "Name, email, password, and phone are required" },
        { status: 400 },
      );
    }

    if (!validatePhone(phone)) {
      return Response.json(
        {
          error:
            "Invalid phone number format. Must start with 08 and be 10-13 digits.",
        },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return Response.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    // 1. Create User & Account via Better Auth Admin API
    // This handles password hashing, roles, and linking correctly in one call
    const authResult = await auth.api.createUser({
      body: {
        email,
        password,
        name,
        role: "driver",
        data: {
          phone,
        },
      },
    });

    const userId = authResult.user.id;
    const now = new Date();

    // 2. Create Driver entry and ensure phone is synced to main user record
    await db.transaction(async (tx) => {
      // Sync phone to user record (in case 'data' mapping above wasn't enough for the direct column)
      await tx
        .update(users)
        .set({ phone, updatedAt: now })
        .where(eq(users.id, userId));

      await tx.insert(drivers).values({
        id: crypto.randomUUID(),
        userId,
        name,
        licenseNumber: licenseNumber || null,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
    });

    return Response.json({
      success: true,
      driver: {
        name,
        email,
        phone,
        licenseNumber: licenseNumber || null,
        status: "active",
      },
    });
  } catch (error) {
    console.error("Error creating driver:", error);
    return Response.json({ error: "Failed to create driver" }, { status: 500 });
  }
}

import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  let dbStatus = "unknown";
  try {
    // Simple query to check DB connection
    await db.execute(sql`SELECT 1`);
    dbStatus = "connected";
  } catch (error) {
    console.error("Database health check failed:", error);
    dbStatus = "disconnected";
  }

  return NextResponse.json({
    status: dbStatus === "connected" ? "healthy" : "unhealthy",
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

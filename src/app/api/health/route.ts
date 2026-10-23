import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Database connection pending";
    return NextResponse.json(
      {
        status: "healthy",
        database: "disconnected",
        details: errorMsg,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}

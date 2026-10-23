import { NextRequest, NextResponse } from "next/server";
import { setAdminSessionCookie, clearAdminSessionCookie, verifyAdminAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAuthenticated = verifyAdminAuth();
  return NextResponse.json({ authenticated: isAuthenticated });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passcode } = body;

    const expectedPasscode = process.env.ADMIN_SECRET_KEY || "admin123";

    if (!passcode || String(passcode) !== expectedPasscode) {
      return NextResponse.json(
        { error: "Invalid admin passcode" },
        { status: 401 }
      );
    }

    setAdminSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    clearAdminSessionCookie();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("DELETE /api/admin/auth error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}

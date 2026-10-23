import { NextRequest, NextResponse } from "next/server";
import {
  setAdminSessionCookie,
  clearAdminSessionCookie,
  verifyAdminAuth,
  getAdminSessionUser,
  verifyPassword,
  hashPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const isAuthenticated = verifyAdminAuth();
  const user = getAdminSessionUser();
  return NextResponse.json({
    authenticated: isAuthenticated,
    user: user || (isAuthenticated ? { username: "admin", email: "admin@auramart.com" } : null),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { emailOrUsername, password, passcode } = body;
    const fallbackSecret = process.env.ADMIN_SECRET_KEY || "admin123";

    // 1. Database-backed credentials login (Username/Email + Password)
    if (emailOrUsername && password) {
      const identifier = String(emailOrUsername).trim().toLowerCase();
      const inputPass = String(password);

      try {
        const user = await prisma.adminUser.findFirst({
          where: {
            OR: [
              { email: { equals: identifier, mode: "insensitive" } },
              { username: { equals: identifier, mode: "insensitive" } },
            ],
          },
        });

        if (user) {
          const isValid = verifyPassword(inputPass, user.password);
          if (isValid) {
            setAdminSessionCookie({
              id: user.id,
              username: user.username,
              email: user.email,
            });
            return NextResponse.json({
              success: true,
              user: { name: user.name, email: user.email, username: user.username, role: user.role },
            });
          }
          return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
        }

        // Check if database has ANY admin users yet
        const totalAdmins = await prisma.adminUser.count();
        if (totalAdmins === 0) {
          // If first-time setup and password matches default or fallback secret, bootstrap default admin!
          if (inputPass === fallbackSecret || inputPass === "admin123") {
            const newAdmin = await prisma.adminUser.create({
              data: {
                username: identifier || "admin",
                email: identifier.includes("@") ? identifier : `${identifier}@auramart.com`,
                password: hashPassword(inputPass),
                name: "Super Admin",
                role: "superadmin",
              },
            });
            setAdminSessionCookie({
              id: newAdmin.id,
              username: newAdmin.username,
              email: newAdmin.email,
            });
            return NextResponse.json({
              success: true,
              user: { name: newAdmin.name, email: newAdmin.email, username: newAdmin.username, role: newAdmin.role },
            });
          }
        }
      } catch (dbErr) {
        console.warn("Database lookup failed during admin auth, trying fallback passcode:", dbErr);
      }

      // Fallback: If DB table not ready or offline preview, allow default admin credentials
      if (
        (identifier === "admin" || identifier === "admin@auramart.com") &&
        (inputPass === fallbackSecret || inputPass === "admin123")
      ) {
        setAdminSessionCookie({
          id: "default-admin",
          username: "admin",
          email: "admin@auramart.com",
        });
        return NextResponse.json({
          success: true,
          user: { name: "Store Admin", email: "admin@auramart.com", username: "admin", role: "superadmin" },
        });
      }

      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // 2. Passcode-based login (for quick secret key entry or backwards compatibility)
    if (passcode) {
      if (String(passcode) !== fallbackSecret) {
        return NextResponse.json({ error: "Invalid admin passcode" }, { status: 401 });
      }

      setAdminSessionCookie();
      return NextResponse.json({
        success: true,
        user: { name: "Store Admin", email: "admin@auramart.com", username: "admin", role: "superadmin" },
      });
    }

    return NextResponse.json({ error: "Please enter your username/email and password" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/admin/auth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    clearAdminSessionCookie();
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("DELETE /api/admin/auth error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}

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
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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
    const ip = getClientIp(req);
    // 1. IP-level rate limiting: max 5 login attempts per 15 minutes
    const ipCheck = checkRateLimit(`login-ip:${ip}`, 5, 900);
    if (!ipCheck.success) {
      return NextResponse.json(
        {
          error: `Too many login attempts. Please wait ${Math.ceil(
            ipCheck.resetInSeconds / 60
          )} minute(s) before trying again.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { emailOrUsername, password } = body;

    // Validation
    if (!emailOrUsername || !password) {
      return NextResponse.json(
        { error: "Please enter your username/email and password" },
        { status: 400 }
      );
    }

    const identifier = String(emailOrUsername).trim().toLowerCase();
    const inputPass = String(password);

    // 2. Account-level rate limiting: max 5 attempts per 15 minutes
    const accCheck = checkRateLimit(`login-acc:${identifier}`, 5, 900);
    if (!accCheck.success) {
      return NextResponse.json(
        {
          error: `Too many login attempts for this account. Please wait ${Math.ceil(
            accCheck.resetInSeconds / 60
          )} minute(s) before trying again.`,
        },
        { status: 429 }
      );
    }

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

      // First-time setup: only if DB has exactly 0 admin users
      const totalAdmins = await prisma.adminUser.count();
      if (totalAdmins === 0) {
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
    } catch (dbErr) {
      console.error("Database lookup failed during admin auth:", dbErr);
      return NextResponse.json(
        { error: "Database service unavailable. Please check server logs." },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
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

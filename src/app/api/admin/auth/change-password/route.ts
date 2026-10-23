import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyAdminAuth,
  getAdminSessionUser,
  verifyPassword,
  hashPassword,
} from "@/lib/auth";
import { sendTelegramPasswordChangedAlert } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessionUser = getAdminSessionUser();
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json(
        { error: "Current password is required." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password cannot be the same as your current password." },
        { status: 400 }
      );
    }

    // Look up user in database
    let user = null;
    if (sessionUser && sessionUser.id) {
      user = await prisma.adminUser.findUnique({
        where: { id: sessionUser.id },
      });
    }

    if (!user) {
      // Fallback search by username
      user = await prisma.adminUser.findFirst({
        where: {
          username: { equals: sessionUser?.username || "admin", mode: "insensitive" },
        },
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "Admin user record not found." },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentValid = verifyPassword(currentPassword, user.password);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: "Incorrect current password. Please try again." },
        { status: 400 }
      );
    }

    // Hash and persist new password
    const newHashed = hashPassword(newPassword);
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        password: newHashed,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Send Telegram Security Notice
    sendTelegramPasswordChangedAlert(user.username || user.name).catch((err) =>
      console.warn("Telegram password changed alert failed:", err)
    );

    return NextResponse.json({
      success: true,
      message: "Password changed successfully! Keep your new password secure.",
    });
  } catch (error) {
    console.error("POST /api/admin/auth/change-password error:", error);
    return NextResponse.json(
      { error: "Failed to update password. Please try again." },
      { status: 500 }
    );
  }
}

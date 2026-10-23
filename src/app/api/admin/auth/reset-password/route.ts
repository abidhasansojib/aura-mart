import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, setAdminSessionCookie } from "@/lib/auth";
import { sendTelegramPasswordChangedAlert } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { emailOrUsername, otp, masterKey, newPassword } = body;

    if (!emailOrUsername || typeof emailOrUsername !== "string" || !emailOrUsername.trim()) {
      return NextResponse.json(
        { error: "Username or email is required." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const identifier = emailOrUsername.trim().toLowerCase();
    const user = await prisma.adminUser.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: "insensitive" } },
          { username: { equals: identifier, mode: "insensitive" } },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Admin account not found." },
        { status: 404 }
      );
    }

    let isAuthorized = false;

    // 1. Master Recovery Key Authorization
    if (masterKey) {
      const serverMasterKey = process.env.ADMIN_SECRET_KEY || "admin123";
      if (String(masterKey).trim() === serverMasterKey) {
        isAuthorized = true;
      } else {
        return NextResponse.json(
          { error: "Invalid Master Recovery Key." },
          { status: 401 }
        );
      }
    }
    // 2. Telegram OTP Verification
    else if (otp) {
      if (!user.resetToken || !user.resetTokenExpiry) {
        return NextResponse.json(
          { error: "No active password reset request found. Please request a new verification code." },
          { status: 400 }
        );
      }

      if (new Date() > new Date(user.resetTokenExpiry)) {
        return NextResponse.json(
          { error: "Verification code has expired (10 minute limit). Please request a new one." },
          { status: 400 }
        );
      }

      const isOtpValid = verifyPassword(String(otp).trim(), user.resetToken);
      if (!isOtpValid) {
        return NextResponse.json(
          { error: "Invalid 6-digit verification code. Please check your Telegram message." },
          { status: 400 }
        );
      }

      isAuthorized = true;
    } else {
      return NextResponse.json(
        { error: "Either a 6-digit verification code or Master Recovery Key is required." },
        { status: 400 }
      );
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Authorization failed." }, { status: 401 });
    }

    // Persist new password and clear reset token
    const newHashedPassword = hashPassword(newPassword);
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        password: newHashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Send Telegram Security Notice
    sendTelegramPasswordChangedAlert(user.username || user.email).catch((err) =>
      console.warn("Telegram password changed alert failed:", err)
    );

    // Automatically sign in the admin
    setAdminSessionCookie({
      id: user.id,
      username: user.username,
      email: user.email,
    });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully! You are now signed in.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/auth/reset-password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}

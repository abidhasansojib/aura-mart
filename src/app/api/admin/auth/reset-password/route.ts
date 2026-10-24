import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, setAdminSessionCookie } from "@/lib/auth";
import { sendTelegramPasswordChangedAlert } from "@/lib/telegram";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Rate limit: max 5 password reset attempts per 15 minutes per IP
    const rateCheck = checkRateLimit(`reset-attempt:${ip}`, 5, 900);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: `Too many password reset attempts. Please wait ${Math.ceil(
            rateCheck.resetInSeconds / 60
          )} minute(s) before trying again.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { emailOrUsername, otp, newPassword } = body;

    if (!emailOrUsername || typeof emailOrUsername !== "string" || !emailOrUsername.trim()) {
      return NextResponse.json(
        { error: "Username or email is required." },
        { status: 400 }
      );
    }

    if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
      return NextResponse.json(
        { error: "A valid 6-digit verification code is required." },
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

    // Strictly Telegram OTP Verification
    if (!user.resetToken || !user.resetTokenExpiry) {
      return NextResponse.json(
        { error: "No active password reset request found. Please request a new verification code." },
        { status: 400 }
      );
    }

    if (new Date() > new Date(user.resetTokenExpiry)) {
      return NextResponse.json(
        { error: "Verification code has expired (10 minute limit). Please request a new code." },
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
    try {
      await sendTelegramPasswordChangedAlert(user.username || user.email);
    } catch (err) {
      console.warn("Telegram password changed alert failed:", err);
    }

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

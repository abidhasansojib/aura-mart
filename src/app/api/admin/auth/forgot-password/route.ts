import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendTelegramPasswordResetOtp } from "@/lib/telegram";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { emailOrUsername } = body;

    if (!emailOrUsername || typeof emailOrUsername !== "string" || !emailOrUsername.trim()) {
      return NextResponse.json(
        { error: "Please enter your admin username or email address." },
        { status: 400 }
      );
    }

    const identifier = emailOrUsername.trim().toLowerCase();

    // Look up admin user in PostgreSQL
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
        { error: `No admin account found matching "${emailOrUsername}".` },
        { status: 404 }
      );
    }

    // Generate secure 6-digit OTP
    const rawOtp = String(crypto.randomInt(100000, 1000000));
    const hashedOtp = hashPassword(rawOtp);
    const expiryMinutes = 10;
    const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Save hashed OTP & expiry to DB
    await prisma.adminUser.update({
      where: { id: user.id },
      data: {
        resetToken: hashedOtp,
        resetTokenExpiry: expiryDate,
      },
    });

    // Send OTP via Telegram Bot
    const telegramDelivered = await sendTelegramPasswordResetOtp(
      rawOtp,
      user.username || user.email,
      expiryMinutes
    );

    return NextResponse.json({
      success: true,
      message: telegramDelivered
        ? "A 6-digit verification code has been dispatched to your Telegram bot."
        : "Verification code generated. (Note: Telegram bot could not be reached, you can also use your Master Recovery Key).",
      telegramDelivered,
      username: user.username,
    });
  } catch (error) {
    console.error("POST /api/admin/auth/forgot-password error:", error);
    return NextResponse.json(
      { error: "Failed to initiate password reset. Please try again." },
      { status: 500 }
    );
  }
}

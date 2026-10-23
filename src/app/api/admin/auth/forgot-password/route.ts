import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendTelegramPasswordResetOtp } from "@/lib/telegram";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Rate limit: max 5 forgot-password requests per 15 minutes per IP
    const rateCheck = checkRateLimit(`forgot-pw:${ip}`, 5, 900);
    if (!rateCheck.success) {
      return NextResponse.json(
        {
          error: `Too many password reset requests from this network. Please wait ${Math.ceil(
            rateCheck.resetInSeconds / 60
          )} minute(s) before trying again.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { emailOrUsername } = body;

    if (!emailOrUsername || typeof emailOrUsername !== "string" || !emailOrUsername.trim()) {
      return NextResponse.json(
        { error: "Please enter your admin username or email address." },
        { status: 400 }
      );
    }

    const identifier = emailOrUsername.trim().toLowerCase();

    // Secondary rate limit per account identifier: max 5 requests per 15 minutes
    const accountCheck = checkRateLimit(`forgot-pw-acc:${identifier}`, 5, 900);
    if (!accountCheck.success) {
      return NextResponse.json(
        {
          error: `Too many password reset requests for this account. Please wait ${Math.ceil(
            accountCheck.resetInSeconds / 60
          )} minute(s) before trying again.`,
        },
        { status: 429 }
      );
    }

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

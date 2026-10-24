import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramOrderCancellationAlert } from "@/lib/telegram";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const ip = getClientIp(req);
    // Rate limit: max 5 cancellation attempts per 15 minutes per IP
    const cancelLimit = checkRateLimit(`order-cancel:${ip}`, 5, 900);
    if (!cancelLimit.success) {
      return NextResponse.json(
        {
          error: `Too many order cancellation requests. Please wait ${Math.ceil(
            cancelLimit.resetInSeconds / 60
          )} minute(s) before trying again.`,
        },
        { status: 429 }
      );
    }

    const { id } = params;
    const body = await req.json().catch(() => ({}));
    const { customerPhone, reason } = body;

    if (!customerPhone || typeof customerPhone !== "string" || customerPhone.trim().length < 11) {
      return NextResponse.json(
        { error: "Please provide your full 11-digit phone number (e.g. 017XXXXXXXX) for verification." },
        { status: 400 }
      );
    }

    const cleanInputPhone = customerPhone.replace(/[^0-9]/g, "");
    if (cleanInputPhone.length < 11) {
      return NextResponse.json(
        { error: "Please enter a valid 11-digit phone number." },
        { status: 400 }
      );
    }

    // 1. Fetch current order
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Strict Security Check: Exact 11-digit Phone Number Verification
    const cleanOrderPhone = existingOrder.customerPhone.replace(/[^0-9]/g, "");
    const isPhoneMatch =
      cleanOrderPhone === cleanInputPhone ||
      cleanOrderPhone.slice(-11) === cleanInputPhone.slice(-11);

    if (!isPhoneMatch) {
      return NextResponse.json(
        { error: "Phone number does not match the customer record for this order." },
        { status: 403 }
      );
    }

    // 3. Status Verification: Can ONLY cancel if Pending
    if (existingOrder.status === "Cancelled") {
      return NextResponse.json(
        { error: "This order is already cancelled." },
        { status: 400 }
      );
    }

    if (existingOrder.status !== "Pending") {
      return NextResponse.json(
        {
          error: `Orders can only be cancelled while in Pending status. This order is currently "${existingOrder.status}" and has already been processed by our team. Please contact our support team to request changes.`,
          status: existingOrder.status,
        },
        { status: 400 }
      );
    }

    // 4. Atomic Transaction: Cancel Order, Restore Stock, Rollback Coupon Count
    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // A. Restore Stock for all ordered items
      for (const item of existingOrder.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      // B. Rollback Coupon Usage Counter if a coupon was used
      if (existingOrder.couponCode) {
        await tx.coupon.updateMany({
          where: { code: existingOrder.couponCode },
          data: {
            usedCount: {
              decrement: 1,
            },
          },
        });
      }

      // C. Update Order Status to Cancelled & record cancellation note
      const cancellationTag = `[Customer Cancelled: ${reason ? String(reason).trim() : "Not specified"}]`;
      const updatedNote = existingOrder.orderNote
        ? `${existingOrder.orderNote}\n${cancellationTag}`
        : cancellationTag;

      return await tx.order.update({
        where: { id },
        data: {
          status: "Cancelled",
          orderNote: updatedNote,
        },
        include: { items: true },
      });
    });

    // 5. Fire Telegram Cancellation Notification before container freeze
    try {
      await sendTelegramOrderCancellationAlert(
        {
          orderNumber: cancelledOrder.orderNumber,
          customerName: cancelledOrder.customerName,
          customerPhone: cancelledOrder.customerPhone,
          totalAmount: cancelledOrder.totalAmount,
          items: cancelledOrder.items.map((i) => ({
            productName: i.productName,
            quantity: i.quantity,
          })),
        },
        reason
      );
    } catch (tErr) {
      console.warn("Non-fatal Telegram cancel alert dispatch warning:", tErr);
    }

    return NextResponse.json({
      success: true,
      message: "Your order has been cancelled successfully. All items have been returned to inventory.",
      order: cancelledOrder,
    });
  } catch (error) {
    console.error(`POST /api/orders/${params.id}/cancel error:`, error);
    return NextResponse.json(
      { error: "Failed to cancel order. Please try again or contact support." },
      { status: 500 }
    );
  }
}

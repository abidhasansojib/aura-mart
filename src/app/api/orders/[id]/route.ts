import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    const isAdmin = verifyAdminAuth();

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Security check: Requester must be admin OR supply matching customer phone number
    if (!isAdmin) {
      if (!phone || phone.trim() === "") {
        return NextResponse.json(
          { error: "Unauthorized. Customer phone number is required to access order details." },
          { status: 401 }
        );
      }

      const inputDigits = phone.replace(/[^0-9]/g, "");
      const orderDigits = order.customerPhone.replace(/[^0-9]/g, "");

      const isMatch =
        orderDigits === inputDigits ||
        orderDigits.endsWith(inputDigits.slice(-11)) ||
        inputDigits.endsWith(orderDigits.slice(-11));

      if (!isMatch) {
        return NextResponse.json(
          { error: "Unauthorized. Phone number does not match this order." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error(`GET /api/orders/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  if (!verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await req.json();
    const { status, courierName, courierTrackingCode } = body;

    const validStatuses = ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Atomic transaction for Status Update and Smart Stock Restoration
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      if (!existingOrder) {
        throw new Error("Order not found");
      }

      const previousStatus = existingOrder.status;

      // Smart Stock Restoration:
      // If moving from a non-Cancelled status TO Cancelled, return items back to inventory.
      if (status === "Cancelled" && previousStatus !== "Cancelled") {
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
      }

      // If moving from Cancelled back to an active state, re-decrement stock if items exist
      if (previousStatus === "Cancelled" && status && status !== "Cancelled") {
        for (const item of existingOrder.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });
          }
        }
      }

      const orderUpdated = await tx.order.update({
        where: { id },
        data: {
          ...(status !== undefined && { status }),
          ...(courierName !== undefined && { courierName: courierName ? String(courierName).trim() : null }),
          ...(courierTrackingCode !== undefined && {
            courierTrackingCode: courierTrackingCode ? String(courierTrackingCode).trim() : null,
          }),
        },
        include: {
          items: true,
        },
      });

      return orderUpdated;
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error(`PATCH /api/orders/${params.id} error:`, error);
    const message = error instanceof Error ? error.message : "Failed to update order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  if (!verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = params;
    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error(`DELETE /api/orders/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}

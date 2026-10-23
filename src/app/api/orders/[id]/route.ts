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
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
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
    const { status } = body;

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

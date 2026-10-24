import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Helper to escape CSV values
function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

interface ExportOrderItem {
  productName: string;
  quantity: number;
}

interface ExportOrder {
  orderNumber: string;
  createdAt: Date | string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  deliveryZone: string;
  subtotal: number;
  discountAmount?: number | null;
  couponCode?: string | null;
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: string;
  trxId?: string | null;
  status: string;
  items?: ExportOrderItem[];
  orderNote?: string | null;
}

// GET /api/admin/orders/export - Download CSV of orders
export async function GET(req: NextRequest) {
  if (!verifyAdminAuth()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: { status?: string } = {};
    if (status && status.toUpperCase() !== "ALL" && status.trim() !== "") {
      where.status = status.trim();
    }

    let orders: ExportOrder[] = [];
    try {
      orders = (await prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: "desc" },
      })) as unknown as ExportOrder[];
    } catch (dbErr) {
      console.warn("DB export failed, using empty list:", dbErr);
    }

    // CSV Header row compatible with standard courier portals (Steadfast, Pathao)
    const headers = [
      "Order Number",
      "Order Date",
      "Customer Name",
      "Customer Phone",
      "Shipping Address",
      "Delivery Zone",
      "Subtotal",
      "Discount",
      "Coupon Code",
      "Delivery Charge",
      "Total Payable Amount",
      "Payment Method",
      "Transaction ID",
      "Order Status",
      "Item Details",
      "Order Note",
    ];

    const rows = orders.map((order) => {
      const itemsSummary = order.items
        ? order.items.map((i: ExportOrderItem) => `${i.productName} (x${i.quantity})`).join("; ")
        : "";

      return [
        escapeCsv(order.orderNumber),
        escapeCsv(new Date(order.createdAt).toISOString().split("T")[0]),
        escapeCsv(order.customerName),
        escapeCsv(order.customerPhone),
        escapeCsv(order.shippingAddress),
        escapeCsv(order.deliveryZone),
        escapeCsv(order.subtotal),
        escapeCsv(order.discountAmount || 0),
        escapeCsv(order.couponCode || ""),
        escapeCsv(order.deliveryCharge),
        escapeCsv(order.totalAmount),
        escapeCsv(order.paymentMethod),
        escapeCsv(order.trxId || ""),
        escapeCsv(order.status),
        escapeCsv(itemsSummary),
        escapeCsv(order.orderNote || ""),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const dateStr = new Date().toISOString().split("T")[0];

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="aura-mart-orders-${dateStr}.csv"`,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/orders/export error:", error);
    return NextResponse.json({ error: "Failed to export orders CSV" }, { status: 500 });
  }
}

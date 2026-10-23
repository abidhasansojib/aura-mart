import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { sendTelegramOrderAlert, sendTelegramLowStockAlert } from "@/lib/telegram";
import { verifyAdminAuth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

interface CheckoutItemPayload {
  productId: string;
  quantity: number;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const isAdmin = verifyAdminAuth();

    // 1. Customer order tracking via phone number (strict exact/normalized lookup)
    if (phone && phone.trim() !== "") {
      const rawDigits = phone.replace(/[^0-9]/g, "");
      if (rawDigits.length < 11) {
        return NextResponse.json(
          { error: "Please enter your full 11-digit phone number (e.g. 017XXXXXXXX) to view your orders." },
          { status: 400 }
        );
      }

      // Bangladesh standard mobile number is 11 digits (01XXXXXXXXX)
      const standard11 = rawDigits.slice(-11);
      const possibleVariants = [
        standard11,
        `+88${standard11}`,
        `88${standard11}`,
        phone.trim(),
      ];

      const orders = await prisma.order.findMany({
        where: {
          customerPhone: {
            in: possibleVariants,
          },
        },
        include: {
          items: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json(orders);
    }

    // 2. Admin viewing orders
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized. Please login or provide a phone number to track orders." },
        { status: 401 }
      );
    }

    const where: Prisma.OrderWhereInput = {};

    if (status && status !== "All" && status.trim() !== "") {
      where.status = status.trim();
    }

    if (search && search.trim() !== "") {
      const query = search.trim();
      where.OR = [
        { orderNumber: { contains: query, mode: "insensitive" } },
        { customerName: { contains: query, mode: "insensitive" } },
        { customerPhone: { contains: query, mode: "insensitive" } },
        { trxId: { contains: query, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      customerPhone,
      shippingAddress,
      deliveryZone,
      paymentMethod,
      paymentSenderNo,
      trxId,
      orderNote,
      items,
      couponCode,
      discountAmount: requestedDiscount,
    } = body;

    // Validation
    if (!customerName || String(customerName).trim() === "") {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }
    if (!customerPhone || String(customerPhone).trim() === "") {
      return NextResponse.json({ error: "Customer phone is required" }, { status: 400 });
    }
    if (!shippingAddress || String(shippingAddress).trim() === "") {
      return NextResponse.json({ error: "Shipping address is required" }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Your shopping cart is empty" }, { status: 400 });
    }

    const cleanPaymentMethod =
      paymentMethod === "bKash" || paymentMethod === "Nagad" || paymentMethod === "Rocket"
        ? paymentMethod
        : "COD";

    if (cleanPaymentMethod !== "COD") {
      if (!trxId || String(trxId).trim() === "") {
        return NextResponse.json(
          { error: `Transaction ID (TrxID) is required for ${cleanPaymentMethod} payments.` },
          { status: 400 }
        );
      }
    }

    // Interactive Prisma Transaction for Atomic Stock Management
    const transactionResult = await prisma.$transaction(async (tx) => {
      // a. Fetch current StoreSettings
      const settings = await tx.storeSettings.upsert({
        where: { id: "default" },
        update: {},
        create: { id: "default" },
      });

      // Check if store is open
      if (settings.isStoreOpen === false) {
        throw new Error(
          settings.storeClosedNotice || "The store is temporarily paused. Please check back later."
        );
      }

      let subtotal = 0;
      const verifiedItems: {
        productId: string;
        productName: string;
        productImage: string;
        quantity: number;
        priceAtPurchase: number;
      }[] = [];
      const lowStockAlerts: { name: string; stock: number; category?: string }[] = [];

      // b. Verify each product and atomically decrement stock with conditional check
      for (const item of items as CheckoutItemPayload[]) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
          throw new Error("Invalid item in shopping cart.");
        }

        // Strict Atomic conditional decrement: Only succeeds if current stock >= requested quantity
        const updateResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            isActive: true,
            stock: { gte: item.quantity },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (updateResult.count === 0) {
          const currentProduct = await tx.product.findUnique({
            where: { id: item.productId },
          });
          if (!currentProduct || !currentProduct.isActive) {
            throw new Error(`Product "${currentProduct?.name || item.productId}" is currently unavailable.`);
          }
          throw new Error(
            `Sorry, "${currentProduct.name}" only has ${currentProduct.stock} left in stock (you requested ${item.quantity}).`
          );
        }

        // Fetch freshly decremented product
        const updatedProduct = await tx.product.findUniqueOrThrow({
          where: { id: item.productId },
        });

        const linePrice = updatedProduct.price * item.quantity;
        subtotal += linePrice;

        verifiedItems.push({
          productId: updatedProduct.id,
          productName: updatedProduct.name,
          productImage: updatedProduct.imageUrl,
          quantity: item.quantity,
          priceAtPurchase: updatedProduct.price,
        });

        if (updatedProduct.stock <= (settings.lowStockThreshold || 5)) {
          lowStockAlerts.push({
            name: updatedProduct.name,
            stock: updatedProduct.stock,
            category: updatedProduct.category,
          });
        }
      }

      // d. Delivery charge calculation with Free Shipping threshold support
      const isInside =
        deliveryZone === "Inside City" ||
        deliveryZone === "inside" ||
        (typeof deliveryZone === "string" && deliveryZone.toLowerCase().includes("inside"));
      let deliveryCharge = isInside ? settings.insideCityDelivery : settings.outsideCityDelivery;

      if (settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold) {
        deliveryCharge = 0;
      }

      // e. Coupon validation & deduction
      let calculatedDiscount = 0;
      let appliedCouponCode: string | null = null;

      if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
        const cleanCode = couponCode.trim().toUpperCase();
        try {
          const coupon = await tx.coupon.findUnique({
            where: { code: cleanCode },
          });

          if (
            coupon &&
            coupon.isActive &&
            (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date()) &&
            (!coupon.maxUses || coupon.usedCount < coupon.maxUses) &&
            subtotal >= coupon.minOrderValue
          ) {
            appliedCouponCode = coupon.code;
            if (coupon.discountType === "PERCENTAGE") {
              calculatedDiscount = Math.round((subtotal * coupon.discountValue) / 100);
            } else {
              calculatedDiscount = Math.min(coupon.discountValue, subtotal);
            }

            // Increment coupon usage
            await tx.coupon.update({
              where: { id: coupon.id },
              data: { usedCount: { increment: 1 } },
            });
          }
        } catch (couponErr) {
          console.warn("Coupon transaction check skipped fallback:", couponErr);
          // If fallback coupon was passed from validated client
          if (requestedDiscount && Number(requestedDiscount) > 0) {
            calculatedDiscount = Math.min(Number(requestedDiscount), subtotal);
            appliedCouponCode = cleanCode;
          }
        }
      }

      const totalAmount = Math.max(0, subtotal - calculatedDiscount + deliveryCharge);
      const orderNumber = generateOrderNumber();

      // f. Create Order and nested OrderItems
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName: String(customerName).trim(),
          customerPhone: String(customerPhone).trim(),
          shippingAddress: String(shippingAddress).trim(),
          deliveryZone: isInside ? "Inside City" : "Outside City",
          deliveryCharge,
          subtotal,
          discountAmount: calculatedDiscount,
          couponCode: appliedCouponCode,
          totalAmount,
          paymentMethod: cleanPaymentMethod,
          paymentSenderNo: paymentSenderNo ? String(paymentSenderNo).trim() : null,
          trxId: trxId ? String(trxId).trim() : null,
          orderNote: orderNote ? String(orderNote).trim() : null,
          status: "Pending",
          items: {
            create: verifiedItems.map((vi) => ({
              productId: vi.productId,
              productName: vi.productName,
              productImage: vi.productImage,
              quantity: vi.quantity,
              priceAtPurchase: vi.priceAtPurchase,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      return {
        order: createdOrder,
        currencySymbol: settings.currencySymbol,
        lowStockThreshold: settings.lowStockThreshold || 5,
        lowStockAlerts,
      };
    });

    // Asynchronously dispatch Telegram order alert (non-blocking)
    sendTelegramOrderAlert(transactionResult.order, transactionResult.currencySymbol).catch(
      (err) => console.error("Async Telegram alert error:", err)
    );

    // Asynchronously dispatch Telegram low stock alerts if threshold breached
    if (transactionResult.lowStockAlerts && transactionResult.lowStockAlerts.length > 0) {
      transactionResult.lowStockAlerts.forEach((item) => {
        sendTelegramLowStockAlert(item, transactionResult.lowStockThreshold).catch((err) =>
          console.error("Async Telegram low-stock alert error:", err)
        );
      });
    }

    return NextResponse.json(transactionResult.order, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    const message = error instanceof Error ? error.message : "Failed to place order";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

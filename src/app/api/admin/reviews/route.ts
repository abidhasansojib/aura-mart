import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/reviews
// Fetches all reviews with filtering for Admin Moderation
export async function GET(req: Request) {
  try {
    const isAuthenticated = verifyAdminAuth();
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // PENDING, APPROVED, REJECTED, or ALL

    const whereClause: { status?: string } = {};
    if (status && status !== "ALL") {
      whereClause.status = status.toUpperCase();
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            price: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const counts = {
      all: await prisma.review.count(),
      pending: await prisma.review.count({ where: { status: "PENDING" } }),
      approved: await prisma.review.count({ where: { status: "APPROVED" } }),
      rejected: await prisma.review.count({ where: { status: "REJECTED" } }),
    };

    return NextResponse.json({
      reviews,
      counts,
    });
  } catch (error) {
    console.error("GET /api/admin/reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch admin reviews" }, { status: 500 });
  }
}

// PATCH /api/admin/reviews
// Accept / Approve / Reject a review
export async function PATCH(req: Request) {
  try {
    const isAuthenticated = verifyAdminAuth();
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Review ID and status are required." }, { status: 400 });
    }

    const validStatuses = ["PENDING", "APPROVED", "REJECTED"];
    const normalizedStatus = status.toUpperCase();

    if (!validStatuses.includes(normalizedStatus)) {
      return NextResponse.json({ error: "Invalid status provided." }, { status: 400 });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        status: normalizedStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Review marked as ${normalizedStatus}.`,
      review: updatedReview,
    });
  } catch (error) {
    console.error("PATCH /api/admin/reviews error:", error);
    return NextResponse.json({ error: "Failed to update review status" }, { status: 500 });
  }
}

// POST /api/admin/reviews
// Merchant direct review addition (e.g. authentic feedback from WhatsApp / FB)
export async function POST(req: Request) {
  try {
    const isAuthenticated = verifyAdminAuth();
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, customerName, customerPhone, rating, comment, orderNumber } = body;

    if (!productId || !customerName || !comment) {
      return NextResponse.json(
        { error: "Product, customer name, and comment are required." },
        { status: 400 }
      );
    }

    const numRating = Number(rating) || 5;

    const newReview = await prisma.review.create({
      data: {
        productId,
        orderNumber: orderNumber ? String(orderNumber).trim() : null,
        customerName: String(customerName).trim(),
        customerPhone: customerPhone ? String(customerPhone).trim() : "Direct Customer",
        rating: Math.min(5, Math.max(1, Math.round(numRating))),
        comment: String(comment).trim(),
        status: "APPROVED", // Directly approved when added by admin
        isVerified: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Customer review published successfully.",
        review: newReview,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/admin/reviews error:", error);
    return NextResponse.json({ error: "Failed to create direct review" }, { status: 500 });
  }
}

// DELETE /api/admin/reviews
// Permanent removal of spam or inappropriate review
export async function DELETE(req: Request) {
  try {
    const isAuthenticated = verifyAdminAuth();
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Review ID is required." }, { status: 400 });
    }

    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/reviews error:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}

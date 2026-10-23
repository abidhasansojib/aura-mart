import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/reviews?productId={id}
// Fetches only APPROVED reviews for public display
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "productId parameter is required" }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: {
        productId,
        status: "APPROVED",
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        customerName: true,
        rating: true,
        comment: true,
        isVerified: true,
        createdAt: true,
      },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
        : 0;

    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    return NextResponse.json({
      reviews,
      totalReviews,
      averageRating,
      ratingDistribution,
    });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST /api/reviews
// Abuse-proof review submission for genuine buyers
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      productId,
      orderNumber,
      customerPhone,
      customerName,
      rating,
      comment,
      honeypot, // Invisible anti-bot field
    } = body;

    // 1. Invisible Honeypot check (silently drop bot requests)
    if (honeypot && String(honeypot).trim() !== "") {
      return NextResponse.json({
        success: true,
        message: "Thank you! Your verified review has been submitted for moderation.",
      });
    }

    // 2. Validate mandatory fields
    if (!productId || !orderNumber || !customerPhone || !comment) {
      return NextResponse.json(
        { error: "Please provide order number, phone number, rating, and your review." },
        { status: 400 }
      );
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5 stars." }, { status: 400 });
    }

    const trimmedComment = String(comment).trim();
    if (trimmedComment.length < 5 || trimmedComment.length > 600) {
      return NextResponse.json(
        { error: "Review comment must be between 5 and 600 characters." },
        { status: 400 }
      );
    }

    // 3. Normalize digits and order number
    const cleanPhone = String(customerPhone).replace(/[^0-9]/g, "");
    const cleanOrderNo = String(orderNumber).trim();

    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 11-digit phone number." },
        { status: 400 }
      );
    }

    // 4. Verify Order exists in database
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: {
          equals: cleanOrderNo,
          mode: "insensitive",
        },
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          error:
            "Order not found. Please verify your Order Number (e.g., ORD-2026-...) from your SMS or invoice.",
        },
        { status: 400 }
      );
    }

    // 5. Verify Phone Number matches the order
    const orderPhoneClean = order.customerPhone.replace(/[^0-9]/g, "");
    const match =
      orderPhoneClean === cleanPhone ||
      orderPhoneClean.endsWith(cleanPhone.slice(-10)) ||
      cleanPhone.endsWith(orderPhoneClean.slice(-10));

    if (!match) {
      return NextResponse.json(
        {
          error: "The phone number does not match the customer record for this order.",
        },
        { status: 400 }
      );
    }

    // 6. Verify Product was purchased in this specific order
    const hasProduct = order.items.some(
      (item) => item.productId === productId || item.productName.toLowerCase().includes(productId.toLowerCase())
    );

    if (!hasProduct) {
      return NextResponse.json(
        {
          error: "This product was not part of your order. You can only review items you purchased.",
        },
        { status: 400 }
      );
    }

    // 7. Verify 1 review per product per order (Prevents database spamming)
    const existingReview = await prisma.review.findFirst({
      where: {
        orderId: order.id,
        productId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        {
          error: "You have already submitted a review for this product from this order.",
        },
        { status: 409 }
      );
    }

    // 8. Create the Review in PENDING status for manual Admin approval
    const newReview = await prisma.review.create({
      data: {
        productId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: (customerName && String(customerName).trim()) || order.customerName,
        customerPhone: order.customerPhone,
        rating: Math.round(numRating),
        comment: trimmedComment,
        status: "PENDING", // User requirement: All reviews must be manually accepted by Admin
        isVerified: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Thank you! Your verified review has been submitted for moderation and will appear once approved by our team.",
        reviewId: newReview.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while submitting your review." },
      { status: 500 }
    );
  }
}

import { prisma } from "@/lib/prisma";

export function escapeTelegramHtml(text: string | number | null | undefined): string {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface TelegramOrderItem {
  productName: string;
  quantity: number;
  priceAtPurchase: number;
}

export interface OrderWithItems {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  deliveryZone: string;
  deliveryCharge: number;
  subtotal: number;
  discountAmount?: number;
  couponCode?: string | null;
  totalAmount: number;
  paymentMethod: string;
  paymentSenderNo?: string | null;
  trxId?: string | null;
  orderNote?: string | null;
  items: TelegramOrderItem[];
}

export async function sendTelegramOrderAlert(
  order: OrderWithItems,
  currencySymbol: string = "৳"
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId || botToken === "your-telegram-bot-token") {
    console.warn("Telegram alert skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured.");
    return false;
  }

  try {
    const itemsText = order.items
      .map(
        (item) =>
          `• <b>${escapeTelegramHtml(item.productName)}</b> × ${item.quantity} = ${currencySymbol}${item.priceAtPurchase * item.quantity}`
      )
      .join("\n");

    let paymentDetails = "";
    if (order.paymentMethod !== "COD") {
      paymentDetails = `\n<b>Sender No:</b> ${escapeTelegramHtml(order.paymentSenderNo) || "N/A"}\n<b>TrxID:</b> <code>${escapeTelegramHtml(order.trxId) || "N/A"}</code>`;
    }

    const messageHtml = [
      `🎉 <b>NEW ORDER: ${escapeTelegramHtml(order.orderNumber)}</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Customer:</b> ${escapeTelegramHtml(order.customerName)}`,
      `📞 <b>Phone:</b> <a href="tel:${order.customerPhone}">${escapeTelegramHtml(order.customerPhone)}</a>`,
      `📍 <b>Address:</b> ${escapeTelegramHtml(order.shippingAddress)} (${escapeTelegramHtml(order.deliveryZone)})`,
      `━━━━━━━━━━━━━━━━━━`,
      `📦 <b>Ordered Items:</b>`,
      itemsText,
      `━━━━━━━━━━━━━━━━━━`,
      `💵 <b>Subtotal:</b> ${currencySymbol}${order.subtotal}`,
      order.discountAmount && order.discountAmount > 0
        ? `🎟️ <b>Discount (${escapeTelegramHtml(order.couponCode || "Coupon")}):</b> -${currencySymbol}${order.discountAmount}`
        : "",
      `🚚 <b>Delivery:</b> ${currencySymbol}${order.deliveryCharge}`,
      `💰 <b>Total Amount:</b> <b>${currencySymbol}${order.totalAmount}</b>`,
      `💳 <b>Payment Method:</b> ${escapeTelegramHtml(order.paymentMethod)}${paymentDetails}`,
      order.orderNote ? `📝 <b>Note:</b> <i>${escapeTelegramHtml(order.orderNote)}</i>` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageHtml,
        parse_mode: "HTML",
      }),
      signal: AbortSignal.timeout(3500),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn("Telegram API response was not OK:", errText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send Telegram order alert:", error);
    return false;
  }
}

export async function sendTelegramOrderCancellationAlert(
  order: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    items?: Array<{ productName: string; quantity: number }>;
  },
  reason?: string,
  currencySymbol: string = "৳"
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId || botToken === "your-telegram-bot-token") {
    return false;
  }

  try {
    const itemsSummary = order.items && order.items.length > 0
      ? order.items.map((it) => `• ${escapeTelegramHtml(it.productName)} × ${it.quantity}`).join("\n")
      : "";

    const messageHtml = [
      `⚠️ <b>ORDER CANCELLED BY CUSTOMER</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `🆔 <b>Order:</b> <code>${escapeTelegramHtml(order.orderNumber)}</code>`,
      `👤 <b>Customer:</b> ${escapeTelegramHtml(order.customerName)}`,
      `📞 <b>Phone:</b> <a href="tel:${order.customerPhone}">${escapeTelegramHtml(order.customerPhone)}</a>`,
      `💰 <b>Total Amount:</b> ${currencySymbol}${order.totalAmount}`,
      `💬 <b>Reason:</b> ${reason ? `<i>${escapeTelegramHtml(reason)}</i>` : "No reason specified"}`,
      itemsSummary ? `━━━━━━━━━━━━━━━━━━\n📦 <b>Restored Items:</b>\n${itemsSummary}` : "",
      `━━━━━━━━━━━━━━━━━━`,
      `✅ <b>Status:</b> Cancelled. Items returned to active inventory.`,
    ]
      .filter(Boolean)
      .join("\n");

    const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageHtml,
        parse_mode: "HTML",
      }),
      signal: AbortSignal.timeout(3500),
    });

    return res.ok;
  } catch (error) {
    console.error("Failed to send Telegram order cancellation alert:", error);
    return false;
  }
}

export async function sendTelegramLowStockAlert(
  product: {
    name: string;
    stock: number;
    category?: string;
  },
  threshold: number = 5
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId || botToken === "your-telegram-bot-token") {
    return false;
  }

  try {
    const messageHtml = [
      `⚠️ <b>INVENTORY ALERT: Low Stock Warning</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `📦 <b>Product:</b> <b>${escapeTelegramHtml(product.name)}</b>`,
      `📊 <b>Remaining Units:</b> <code>${product.stock}</code> (Threshold: ${threshold})`,
      product.category ? `🏷️ <b>Category:</b> ${escapeTelegramHtml(product.category)}` : "",
      `━━━━━━━━━━━━━━━━━━`,
      product.stock === 0
        ? `🚨 <i>This item is now OUT OF STOCK on your storefront! Please restock.</i>`
        : `⚡ <i>Inventory is running critically low. Reorder or update stock in Admin.</i>`,
    ]
      .filter(Boolean)
      .join("\n");

    const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageHtml,
        parse_mode: "HTML",
      }),
      signal: AbortSignal.timeout(3500),
    });

    return res.ok;
  } catch (error) {
    console.error("Failed to send Telegram low stock alert:", error);
    return false;
  }
}

async function getStoreName(): Promise<string> {
  try {
    const s = await prisma.storeSettings.findUnique({
      where: { id: "default" },
      select: { storeName: true },
    });
    if (s?.storeName?.trim()) return s.storeName.trim().toUpperCase();
  } catch {
    // fallback
  }
  return "STORE";
}

export async function sendTelegramPasswordResetOtp(
  otp: string,
  usernameOrEmail: string,
  expiryMinutes: number = 10
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId || botToken === "your-telegram-bot-token") {
    console.warn("Telegram OTP alert skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured.");
    return false;
  }

  try {
    const storeHeader = await getStoreName();
    const timeString = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const messageHtml = [
      `🔐 <b>${escapeTelegramHtml(storeHeader)} SECURITY: Password Reset Code</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Account:</b> <code>${escapeTelegramHtml(usernameOrEmail)}</code>`,
      `🔑 <b>Verification OTP:</b> <code>${escapeTelegramHtml(otp)}</code>`,
      `⏳ <b>Valid For:</b> ${expiryMinutes} minutes`,
      `🕒 <b>Time:</b> ${timeString} (BST)`,
      `━━━━━━━━━━━━━━━━━━`,
      `⚠️ <i>If you did not request a password reset, your store account is safe. Do not share this OTP with anyone.</i>`,
    ].join("\n");

    const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageHtml,
        parse_mode: "HTML",
      }),
      signal: AbortSignal.timeout(3500),
    });

    return res.ok;
  } catch (error) {
    console.error("Failed to send Telegram password reset OTP:", error);
    return false;
  }
}

export async function sendTelegramPasswordChangedAlert(
  username: string
): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId || botToken === "your-telegram-bot-token") {
    return false;
  }

  try {
    const storeHeader = await getStoreName();
    const timeString = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const messageHtml = [
      `🛡️ <b>${escapeTelegramHtml(storeHeader)} SECURITY NOTICE: Password Changed</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Admin Username:</b> <code>${escapeTelegramHtml(username)}</code>`,
      `🕒 <b>Timestamp:</b> ${timeString} (BST)`,
      `━━━━━━━━━━━━━━━━━━`,
      `✅ <i>Your store admin password was successfully updated. If this was not you, reset your password via Telegram OTP immediately.</i>`,
    ].join("\n");

    const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageHtml,
        parse_mode: "HTML",
      }),
      signal: AbortSignal.timeout(3500),
    });

    return res.ok;
  } catch (error) {
    console.error("Failed to send Telegram password changed alert:", error);
    return false;
  }
}

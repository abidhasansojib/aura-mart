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
          `• <b>${item.productName}</b> × ${item.quantity} = ${currencySymbol}${item.priceAtPurchase * item.quantity}`
      )
      .join("\n");

    let paymentDetails = "";
    if (order.paymentMethod !== "COD") {
      paymentDetails = `\n<b>Sender No:</b> ${order.paymentSenderNo || "N/A"}\n<b>TrxID:</b> <code>${order.trxId || "N/A"}</code>`;
    }

    const messageHtml = [
      `🎉 <b>NEW ORDER: ${order.orderNumber}</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Customer:</b> ${order.customerName}`,
      `📞 <b>Phone:</b> <a href="tel:${order.customerPhone}">${order.customerPhone}</a>`,
      `📍 <b>Address:</b> ${order.shippingAddress} (${order.deliveryZone})`,
      `━━━━━━━━━━━━━━━━━━`,
      `📦 <b>Ordered Items:</b>`,
      itemsText,
      `━━━━━━━━━━━━━━━━━━`,
      `💵 <b>Subtotal:</b> ${currencySymbol}${order.subtotal}`,
      order.discountAmount && order.discountAmount > 0
        ? `🎟️ <b>Discount (${order.couponCode || "Coupon"}):</b> -${currencySymbol}${order.discountAmount}`
        : "",
      `🚚 <b>Delivery:</b> ${currencySymbol}${order.deliveryCharge}`,
      `💰 <b>Total Amount:</b> <b>${currencySymbol}${order.totalAmount}</b>`,
      `💳 <b>Payment Method:</b> ${order.paymentMethod}${paymentDetails}`,
      order.orderNote ? `📝 <b>Note:</b> ${order.orderNote}` : "",
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
      ? order.items.map((it) => `• ${it.productName} × ${it.quantity}`).join("\n")
      : "";

    const messageHtml = [
      `⚠️ <b>ORDER CANCELLED BY CUSTOMER</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `🆔 <b>Order:</b> <code>${order.orderNumber}</code>`,
      `👤 <b>Customer:</b> ${order.customerName}`,
      `📞 <b>Phone:</b> <a href="tel:${order.customerPhone}">${order.customerPhone}</a>`,
      `💰 <b>Total Amount:</b> ${currencySymbol}${order.totalAmount}`,
      `💬 <b>Reason:</b> ${reason ? `<i>${reason}</i>` : "No reason specified"}`,
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
    });

    return res.ok;
  } catch (error) {
    console.error("Failed to send Telegram order cancellation alert:", error);
    return false;
  }
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
    const timeString = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const messageHtml = [
      `🔐 <b>AURA MART SECURITY: Password Reset Code</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Account:</b> <code>${usernameOrEmail}</code>`,
      `🔑 <b>Verification OTP:</b> <code>${otp}</code>`,
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
    const timeString = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const messageHtml = [
      `🛡️ <b>AURA MART SECURITY NOTICE: Password Changed</b>`,
      `━━━━━━━━━━━━━━━━━━`,
      `👤 <b>Admin Username:</b> <code>${username}</code>`,
      `🕒 <b>Timestamp:</b> ${timeString} (BST)`,
      `━━━━━━━━━━━━━━━━━━`,
      `✅ <i>Your store admin password was successfully updated. If this was not you, reset your password or use your Master Key immediately.</i>`,
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
    });

    return res.ok;
  } catch (error) {
    console.error("Failed to send Telegram password changed alert:", error);
    return false;
  }
}

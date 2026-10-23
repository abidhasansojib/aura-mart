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

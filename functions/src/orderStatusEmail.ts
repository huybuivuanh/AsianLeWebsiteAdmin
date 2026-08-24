import { Resend } from "resend";

interface SendOrderStatusEmailArgs {
  to: string;
  subject: string;
  html: string;
  apiKey: string;
  from: string;
}

/** Sends a single order-status email to the customer. Throws on failure. */
export async function sendOrderStatusEmail({
  to,
  subject,
  html,
  apiKey,
  from,
}: SendOrderStatusEmailArgs): Promise<void> {
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from, to, subject, html });
  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}

// OrderItem/OrderTaxBreakDown/OrderFulfillment are declared globally in
// types/global.d.ts, shared with the admin app — no import needed.
export interface OrderDetails {
  orderNumber: string;
  customerName: string;
  orderItems: OrderItem[];
  taxBreakDown: OrderTaxBreakDown;
  fulfillment: OrderFulfillment;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}

function formatScheduledPickup(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

/**
 * A preorder always shows its scheduled pickup time. An immediate order's
 * ready-time estimate only makes sense on the "confirmed" email — by the
 * "ready for pickup" email it's moot, since the order already is ready.
 * Returns "" when there's nothing to show (e.g. an immediate order whose
 * ready time hasn't been set yet by the POS app).
 */
function fulfillmentLineHtml(
  fulfillment: OrderFulfillment,
  timeZone: string,
  showReadyEstimate: boolean,
): string {
  if ("scheduledAt" in fulfillment) {
    return `<p>Preorder pickup time: <strong>${formatScheduledPickup(fulfillment.scheduledAt, timeZone)}</strong></p>`;
  }
  if (showReadyEstimate && fulfillment.readyTimeMinutes != null) {
    return `<p>Estimated ready time: <strong>${fulfillment.readyTimeMinutes} minutes</strong></p>`;
  }
  return "";
}

function orderItemsRowsHtml(orderItems: OrderDetails["orderItems"]): string {
  return orderItems
    .map((item) => {
      const optionsHtml = item.options?.length
        ? `<div style="color:#666;font-size:13px;margin-top:2px;">${item.options
            .map((o) => {
              const qtyPrefix = o.quantity > 1 ? `${o.quantity}&times; ` : "";
              const pricePart =
                o.price !== 0 ? ` (+${formatCurrency(o.price)})` : "";
              return `${qtyPrefix}${escapeHtml(o.name)}${pricePart}`;
            })
            .join(", ")}</div>`
        : "";
      const instructionsHtml = item.instructions
        ? `<div style="color:#666;font-size:13px;font-style:italic;margin-top:2px;">Note: ${escapeHtml(item.instructions)}</div>`
        : "";
      const lineTotal = item.price * item.quantity;
      return `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;">
            <div>${item.quantity}&times; ${escapeHtml(item.name)}</div>
            ${optionsHtml}
            ${instructionsHtml}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;white-space:nowrap;">${formatCurrency(lineTotal)}</td>
        </tr>`;
    })
    .join("");
}

function orderDetailsHtml({ orderItems, taxBreakDown }: OrderDetails): string {
  return `
    <table style="width:100%;border-collapse:collapse;font-family:sans-serif;font-size:14px;color:#222;margin-top:16px;">
      <tbody>
        ${orderItemsRowsHtml(orderItems)}
      </tbody>
      <tfoot>
        <tr>
          <td style="padding:8px 0 0;">Subtotal</td>
          <td style="padding:8px 0 0;text-align:right;">${formatCurrency(taxBreakDown.subTotal)}</td>
        </tr>
        <tr>
          <td style="padding:2px 0;">GST</td>
          <td style="padding:2px 0;text-align:right;">${formatCurrency(taxBreakDown.gst)}</td>
        </tr>
        <tr>
          <td style="padding:2px 0;">PST</td>
          <td style="padding:2px 0;text-align:right;">${formatCurrency(taxBreakDown.pst)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0 0;font-weight:bold;border-top:1px solid #ccc;">Total</td>
          <td style="padding:8px 0 0;text-align:right;font-weight:bold;border-top:1px solid #ccc;">${formatCurrency(taxBreakDown.total)}</td>
        </tr>
      </tfoot>
    </table>`;
}

export function confirmedEmail(
  order: OrderDetails,
  timeZone: string,
): {
  subject: string;
  html: string;
} {
  const { orderNumber, customerName, fulfillment } = order;
  return {
    subject: `Order #${orderNumber} confirmed`,
    html: `
      <div style="font-family:sans-serif;font-size:14px;color:#222;">
        <p>Hi ${escapeHtml(customerName)},</p>
        <p>Your order <strong>#${escapeHtml(orderNumber)}</strong> has been confirmed and is being prepared. Please pay at the store. Thank you!</p>
        ${fulfillmentLineHtml(fulfillment, timeZone, true)}
        ${orderDetailsHtml(order)}
      </div>`,
  };
}

export function readyForPickupEmail(
  order: OrderDetails,
  timeZone: string,
): {
  subject: string;
  html: string;
} {
  const { orderNumber, customerName, fulfillment } = order;
  return {
    subject: `Order #${orderNumber} is ready for pickup`,
    html: `
      <div style="font-family:sans-serif;font-size:14px;color:#222;">
        <p>Hi ${escapeHtml(customerName)},</p>
        <p>Your order <strong>#${escapeHtml(orderNumber)}</strong> is ready for pickup! Please pay at the store. Thank you!</p>
        ${fulfillmentLineHtml(fulfillment, timeZone, false)}
        ${orderDetailsHtml(order)}
      </div>`,
  };
}

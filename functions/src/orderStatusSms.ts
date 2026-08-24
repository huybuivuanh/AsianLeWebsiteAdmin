import twilio from "twilio";
import { OrderDetails } from "./orderStatusEmail";

const RESTAURANT_NAME = "Asian Le Restaurant";

interface SendOrderStatusSmsArgs {
  to: string;
  body: string;
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

/** Sends a single order-status text to the customer. Throws on failure. */
export async function sendOrderStatusSms({
  to,
  body,
  accountSid,
  authToken,
  fromNumber,
}: SendOrderStatusSmsArgs): Promise<void> {
  const client = twilio(accountSid, authToken);
  await client.messages.create({ to, from: fromNumber, body });
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
 * See the matching helper in orderStatusEmail.ts — a preorder always shows
 * its scheduled pickup time. An immediate order's ready-time estimate only
 * makes sense on the "confirmed" text — by the "ready for pickup" text it's
 * moot, since the order already is ready. "" when there's nothing to show.
 */
function fulfillmentLineText(
  fulfillment: OrderFulfillment,
  timeZone: string,
  showReadyEstimate: boolean,
): string {
  if ("scheduledAt" in fulfillment) {
    return ` Preorder pickup time: ${formatScheduledPickup(fulfillment.scheduledAt, timeZone)}.`;
  }
  if (showReadyEstimate && fulfillment.readyTimeMinutes != null) {
    return ` Estimated ready time: ${fulfillment.readyTimeMinutes} minutes.`;
  }
  return "";
}

export function confirmedSmsBody(
  orderNumber: string,
  orderDetails: OrderDetails,
  timeZone: string,
): string {
  return `Thank you for ordering from ${RESTAURANT_NAME}! Your order #${orderNumber} has been confirmed and is being prepared. Order total is $${orderDetails.taxBreakDown.total}.${fulfillmentLineText(orderDetails.fulfillment, timeZone, true)} Please pay at the store when you pick up your order. Thank you!`;
}

export function readyForPickupSmsBody(
  orderNumber: string,
  orderDetails: OrderDetails,
  timeZone: string,
): string {
  return `Thank you for ordering from ${RESTAURANT_NAME}! Your order #${orderNumber} is ready for pickup! Order total is $${orderDetails.taxBreakDown.total}.${fulfillmentLineText(orderDetails.fulfillment, timeZone, false)} Please pay at the store when you pick up your order. Thank you!`;
}

export function cancelledSmsBody(orderNumber: string): string {
  return `Thank you for choosing ${RESTAURANT_NAME}. Unfortunately, your order #${orderNumber} has been cancelled. If you weren't expecting this or have any questions, please contact us. Thank you for your understanding!`;
}

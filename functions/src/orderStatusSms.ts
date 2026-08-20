import twilio from "twilio";

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

export function confirmedSmsBody(orderNumber: string): string {
  return `Your order #${orderNumber} has been confirmed and is being prepared.`;
}

export function readyForPickupSmsBody(orderNumber: string): string {
  return `Your order #${orderNumber} is ready for pickup!`;
}

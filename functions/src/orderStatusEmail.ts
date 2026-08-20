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

export function confirmedEmail(orderNumber: string): { subject: string; html: string } {
  return {
    subject: `Order #${orderNumber} confirmed`,
    html: `<p>Your order #${orderNumber} has been confirmed and is being prepared.</p>`,
  };
}

export function readyForPickupEmail(orderNumber: string): { subject: string; html: string } {
  return {
    subject: `Order #${orderNumber} is ready for pickup`,
    html: `<p>Your order #${orderNumber} is ready for pickup!</p>`,
  };
}

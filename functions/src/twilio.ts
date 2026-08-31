import twilio from "twilio";

interface PlaceConfirmationCallArgs {
  to: string;
  /** How many orders are still unconfirmed — spoken in the alert. */
  orderCount: number;
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

/** Escape text dropped into a TwiML <Say> element. */
function escapeForTwiml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildTwiml(orderCount: number): string {
  const noun = orderCount === 1 ? "order" : "orders";
  const sentence = `You have ${orderCount} unconfirmed ${noun}. Please check your order screen.`;
  const message = escapeForTwiml(`${sentence} ${sentence} ${sentence}`);
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">${message}</Say></Response>`;
}

/** Places a single Twilio voice call reading the unconfirmed-orders alert.
 * Rings for 25s before giving up so a missed call clears well inside the
 * one-minute nag cadence. Throws on failure. */
export async function placeConfirmationCall({
  to,
  orderCount,
  accountSid,
  authToken,
  fromNumber,
}: PlaceConfirmationCallArgs): Promise<void> {
  const client = twilio(accountSid, authToken);
  await client.calls.create({
    to,
    from: fromNumber,
    twiml: buildTwiml(orderCount),
    timeout: 25,
  });
}

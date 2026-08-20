import twilio from "twilio";

interface PlaceConfirmationCallArgs {
  to: string;
  orderNumber: string;
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

function buildTwiml(orderNumber: string): string {
  const message = escapeForTwiml(
    `You have a new order, number ${orderNumber}, that has not been confirmed. Please check your order screen. You have a new order, number ${orderNumber}, that has not been confirmed. Please check your order screen. You have a new order, number ${orderNumber}, that has not been confirmed. Please check your order screen.`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="Polly.Joanna">${message}</Say></Response>`;
}

/** Places a single Twilio voice call reading the confirmation-alert script. Throws on failure. */
export async function placeConfirmationCall({
  to,
  orderNumber,
  accountSid,
  authToken,
  fromNumber,
}: PlaceConfirmationCallArgs): Promise<void> {
  const client = twilio(accountSid, authToken);
  await client.calls.create({
    to,
    from: fromNumber,
    twiml: buildTwiml(orderNumber),
  });
}

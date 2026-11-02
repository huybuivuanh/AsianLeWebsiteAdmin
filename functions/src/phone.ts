/**
 * Turns a stored phone number into the E.164 form Twilio expects ("+13065551234").
 *
 * The website stores 10 digits ("3065551234"); older orders have "1" in front
 * ("13065551234"), and settings use "+13065551234". All three come out the same.
 * Anything else is passed through unchanged and left for Twilio to reject.
 */
export function toE164(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (trimmed.startsWith("+")) return `+${digits}`;
  return trimmed;
}

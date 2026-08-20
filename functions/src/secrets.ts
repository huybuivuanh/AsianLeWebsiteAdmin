import { defineSecret, defineString } from "firebase-functions/params";

export const twilioAccountSid = defineSecret("TWILIO_ACCOUNT_SID");
export const twilioAuthToken = defineSecret("TWILIO_AUTH_TOKEN");
export const twilioFromNumber = defineSecret("TWILIO_FROM_NUMBER");

export const resendApiKey = defineSecret("RESEND_API_KEY");

/**
 * Not a secret — the "from" address for order-status emails. Must be on a
 * domain verified in Resend, or emails will only deliver in Resend's sandbox
 * mode (to the Resend account owner only). Configured in functions/.env.
 */
export const resendFromEmail = defineString("RESEND_FROM_EMAIL");

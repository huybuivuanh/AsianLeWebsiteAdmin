import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import {
  twilioAccountSid,
  twilioAuthToken,
  twilioFromNumber,
  resendApiKey,
  resendFromEmail,
} from "./secrets";
import { sendOrderStatusSms, confirmedSmsBody, readyForPickupSmsBody } from "./orderStatusSms";
import { sendOrderStatusEmail, confirmedEmail, readyForPickupEmail } from "./orderStatusEmail";

/**
 * Fires on every order update. Only acts on an actual transition into
 * "InProgress" (order confirmed) or "ReadyForPickup" — a customer gets one
 * SMS + one email for each of those two milestones, not on every write.
 */
export const onOrderStatusChanged = onDocumentUpdated(
  {
    document: "orders/{orderId}",
    secrets: [twilioAccountSid, twilioAuthToken, twilioFromNumber, resendApiKey],
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    if (before.status === after.status) return;

    const orderId = event.params.orderId;
    const orderNumber = (after.orderNumber as string | undefined) ?? orderId;
    const customerEmail = after.customerEmail as string | undefined;
    const phoneNumber = after.phoneNumber as string | undefined;

    let sms: string | undefined;
    let email: { subject: string; html: string } | undefined;

    if (after.status === "InProgress") {
      sms = confirmedSmsBody(orderNumber);
      email = confirmedEmail(orderNumber);
    } else if (after.status === "ReadyForPickup") {
      sms = readyForPickupSmsBody(orderNumber);
      email = readyForPickupEmail(orderNumber);
    } else {
      return;
    }

    if (phoneNumber) {
      try {
        await sendOrderStatusSms({
          to: phoneNumber,
          body: sms,
          accountSid: twilioAccountSid.value(),
          authToken: twilioAuthToken.value(),
          fromNumber: twilioFromNumber.value(),
        });
        logger.info(`Order ${orderId}: status SMS sent for "${after.status}".`);
      } catch (err) {
        logger.error(`Order ${orderId}: status SMS failed for "${after.status}"`, err);
      }
    } else {
      logger.warn(`Order ${orderId}: no phoneNumber on order, skipped status SMS.`);
    }

    if (customerEmail) {
      try {
        await sendOrderStatusEmail({
          to: customerEmail,
          subject: email.subject,
          html: email.html,
          apiKey: resendApiKey.value(),
          from: resendFromEmail.value(),
        });
        logger.info(`Order ${orderId}: status email sent for "${after.status}".`);
      } catch (err) {
        logger.error(`Order ${orderId}: status email failed for "${after.status}"`, err);
      }
    } else {
      logger.warn(`Order ${orderId}: no customerEmail on order, skipped status email.`);
    }
  },
);

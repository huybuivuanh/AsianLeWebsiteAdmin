import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { Timestamp } from "firebase-admin/firestore";
import {
  twilioAccountSid,
  twilioAuthToken,
  twilioFromNumber,
  resendApiKey,
  resendFromEmail,
} from "./secrets";
import {
  sendOrderStatusSms,
  confirmedSmsBody,
  readyForPickupSmsBody,
} from "./orderStatusSms";
import {
  sendOrderStatusEmail,
  confirmedEmail,
  readyForPickupEmail,
  OrderDetails,
} from "./orderStatusEmail";

// Mirrors stores/storeSettingsStore.ts's default in the admin app.
const TIME_ZONE = "America/Edmonton";

/** Converts an order doc's raw `fulfillment` field into OrderFulfillment,
 * turning the Firestore Timestamp on a preorder's `scheduledAt` into a Date
 * (mirrors lib/orders-firestore.ts's normalizeFulfillment in the admin app). */
function normalizeFulfillment(raw: unknown): OrderFulfillment {
  const r = raw as
    | { kind?: string; scheduledAt?: Timestamp; readyTimeMinutes?: number }
    | undefined;
  if (r?.kind === "scheduled" && r.scheduledAt) {
    return { kind: "scheduled", scheduledAt: r.scheduledAt.toDate() } as OrderFulfillment;
  }
  return { kind: "immediate", readyTimeMinutes: r?.readyTimeMinutes } as OrderFulfillment;
}

/**
 * Fires on every order update. Only acts on an actual transition into
 * "InProgress" (order confirmed) or "ReadyForPickup" — a customer gets one
 * SMS + one email for each of those two milestones, not on every write.
 */
export const onOrderStatusChanged = onDocumentUpdated(
  {
    document: "orders/{orderId}",
    secrets: [
      twilioAccountSid,
      twilioAuthToken,
      twilioFromNumber,
      resendApiKey,
    ],
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

    const orderDetails: OrderDetails = {
      orderNumber,
      customerName: (after.customerName as string | undefined) ?? "there",
      orderItems: after.orderItems as OrderDetails["orderItems"],
      taxBreakDown: after.taxBreakDown as OrderDetails["taxBreakDown"],
      fulfillment: normalizeFulfillment(after.fulfillment),
    };

    let sms: string | undefined;
    let email: { subject: string; html: string } | undefined;

    if (after.status === "InProgress") {
      sms = confirmedSmsBody(orderNumber, orderDetails, TIME_ZONE);
      email = confirmedEmail(orderDetails, TIME_ZONE);
    } else if (after.status === "ReadyForPickup") {
      sms = readyForPickupSmsBody(orderNumber, orderDetails, TIME_ZONE);
      email = readyForPickupEmail(orderDetails, TIME_ZONE);
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
        logger.error(
          `Order ${orderId}: status SMS failed for "${after.status}"`,
          err,
        );
      }
    } else {
      logger.warn(
        `Order ${orderId}: no phoneNumber on order, skipped status SMS.`,
      );
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
        logger.info(
          `Order ${orderId}: status email sent for "${after.status}".`,
        );
      } catch (err) {
        logger.error(
          `Order ${orderId}: status email failed for "${after.status}"`,
          err,
        );
      }
    } else {
      logger.warn(
        `Order ${orderId}: no customerEmail on order, skipped status email.`,
      );
    }
  },
);

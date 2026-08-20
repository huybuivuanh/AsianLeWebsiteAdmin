import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { logger } from "firebase-functions/v2";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { placeConfirmationCall } from "./twilio";
import { isCallRateLimited, recordCallForRateLimit } from "./rateLimit";

const twilioAccountSid = defineSecret("TWILIO_ACCOUNT_SID");
const twilioAuthToken = defineSecret("TWILIO_AUTH_TOKEN");
const twilioFromNumber = defineSecret("TWILIO_FROM_NUMBER");

interface CheckOrderConfirmedPayload {
  orderId: string;
}

/**
 * Dispatched by `onOrderCreated` ~30s after an order is created. Places a
 * confirmation-alert call only if the order is still "New" at that point.
 *
 * Idempotency: a transaction claims the order (sets confirmationCallStatus
 * to "placed") before any Twilio call is attempted, so a Cloud Tasks retry
 * of this same dispatch can never result in two calls for one order.
 */
export const checkOrderConfirmed = onTaskDispatched<CheckOrderConfirmedPayload>(
  {
    secrets: [twilioAccountSid, twilioAuthToken, twilioFromNumber],
    retryConfig: {
      maxAttempts: 3,
      minBackoffSeconds: 10,
    },
    rateLimits: {
      maxConcurrentDispatches: 6,
    },
  },
  async (req) => {
    const { orderId } = req.data;
    const db = getFirestore();
    const orderRef = db.collection("orders").doc(orderId);

    const claimed = await db.runTransaction(async (tx) => {
      const snap = await tx.get(orderRef);
      if (!snap.exists) return false;
      const order = snap.data()!;
      if (order.status !== "New") return false;
      if (order.confirmationCallStatus) return false; // already handled by an earlier dispatch

      tx.update(orderRef, {
        confirmationCallStatus: "placed",
        confirmationCallPlacedAt: FieldValue.serverTimestamp(),
      });
      return true;
    });

    if (!claimed) {
      logger.info(`Order ${orderId} confirmed (or already handled) before the 30s check — no call placed.`);
      return;
    }

    if (await isCallRateLimited(db)) {
      logger.warn(`Confirmation call for order ${orderId} skipped: hourly call cap reached.`);
      await orderRef.update({ confirmationCallStatus: "failed" });
      return;
    }

    const settingsSnap = await db.doc("settings/store").get();
    const restaurantPhoneNumber = settingsSnap.data()?.restaurantPhoneNumber as string | undefined;
    if (!restaurantPhoneNumber) {
      logger.warn(`Confirmation call for order ${orderId} skipped: no restaurantPhoneNumber configured in settings/store.`);
      await orderRef.update({ confirmationCallStatus: "failed" });
      return;
    }

    const orderSnap = await orderRef.get();
    const orderNumber = (orderSnap.data()?.orderNumber as string | undefined) ?? orderId;

    try {
      await placeConfirmationCall({
        to: restaurantPhoneNumber,
        orderNumber,
        accountSid: twilioAccountSid.value(),
        authToken: twilioAuthToken.value(),
        fromNumber: twilioFromNumber.value(),
      });
      await recordCallForRateLimit(db);
      logger.info(`Confirmation call placed for order ${orderId}.`);
    } catch (err) {
      logger.error(`Confirmation call for order ${orderId} failed`, err);
      await orderRef.update({ confirmationCallStatus: "failed" });
    }
  },
);

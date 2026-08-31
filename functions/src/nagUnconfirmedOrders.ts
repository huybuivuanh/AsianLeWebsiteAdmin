import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { placeConfirmationCall } from "./twilio";
import {
  isCallRateLimited,
  recordCallForRateLimit,
  secondsSinceLastCall,
  MIN_SECONDS_BETWEEN_CALLS,
} from "./rateLimit";
import { twilioAccountSid, twilioAuthToken, twilioFromNumber } from "./secrets";

/** An order younger than this hasn't had a fair chance to be confirmed yet. */
const FIRST_CALL_MIN_AGE_SECONDS = 30;
/** Stop nagging about an order this long after it was created — if nobody has
 * touched it by now, more calls won't help. It gets marked "exhausted". */
const MAX_ORDER_AGE_SECONDS = 5 * 60;

/**
 * Runs every minute. Places one alert call while any order has sat with
 * `status: "New"` for more than {@link FIRST_CALL_MIN_AGE_SECONDS} — one call
 * covering all such orders, not one per order — and keeps doing so each tick
 * until none remain (confirmed, cancelled, or aged past
 * {@link MAX_ORDER_AGE_SECONDS}).
 *
 * Pacing: the every-minute schedule is the cadence; {@link MIN_SECONDS_BETWEEN_CALLS}
 * is the floor guard; `isCallRateLimited` is the last-resort hourly backstop.
 * A call failure is not recorded and does not change any order — the next
 * tick simply tries again.
 */
export const nagUnconfirmedOrders = onSchedule(
  {
    schedule: "every 1 minutes",
    secrets: [twilioAccountSid, twilioAuthToken, twilioFromNumber],
  },
  async () => {
    const db = getFirestore();
    const now = Date.now();

    const newOrders = await db
      .collection("orders")
      .where("status", "==", "New")
      .get();

    if (newOrders.empty) return;

    const eligible: { id: string; orderNumber: string }[] = [];
    const toExhaust: string[] = [];

    for (const doc of newOrders.docs) {
      const data = doc.data();
      const createdAt = data.createdAt as Timestamp | undefined;
      if (!createdAt) continue;
      const ageSeconds = (now - createdAt.toMillis()) / 1000;

      if (ageSeconds < FIRST_CALL_MIN_AGE_SECONDS) continue;

      if (ageSeconds > MAX_ORDER_AGE_SECONDS) {
        if (data.confirmationCallStatus !== "exhausted") toExhaust.push(doc.id);
        continue;
      }

      eligible.push({
        id: doc.id,
        orderNumber: (data.orderNumber as string | undefined) ?? doc.id,
      });
    }

    if (toExhaust.length > 0) {
      const batch = db.batch();
      for (const id of toExhaust) {
        batch.update(db.collection("orders").doc(id), {
          confirmationCallStatus: "exhausted",
        });
      }
      await batch.commit();
      logger.warn(
        `Gave up nagging on ${toExhaust.length} order(s) still "New" after ` +
          `${MAX_ORDER_AGE_SECONDS / 60} min: ${toExhaust.join(", ")}.`,
      );
    }

    if (eligible.length === 0) return;

    const sinceLast = await secondsSinceLastCall(db);
    if (sinceLast !== null && sinceLast < MIN_SECONDS_BETWEEN_CALLS) {
      logger.info(
        `Nag call skipped: only ${Math.round(sinceLast)}s since the last one ` +
          `(min ${MIN_SECONDS_BETWEEN_CALLS}s). ${eligible.length} order(s) waiting.`,
      );
      return;
    }

    if (await isCallRateLimited(db)) {
      logger.warn(
        `Nag call skipped: hourly backstop reached. ${eligible.length} order(s) waiting.`,
      );
      return;
    }

    const settingsSnap = await db.doc("settings/store").get();
    const restaurantPhoneNumber = settingsSnap.data()?.restaurantPhoneNumber as
      | string
      | undefined;
    if (!restaurantPhoneNumber) {
      logger.warn(
        "Nag call skipped: no restaurantPhoneNumber configured in settings/store.",
      );
      return;
    }

    try {
      await placeConfirmationCall({
        to: restaurantPhoneNumber,
        orderCount: eligible.length,
        accountSid: twilioAccountSid.value(),
        authToken: twilioAuthToken.value(),
        fromNumber: twilioFromNumber.value(),
      });
    } catch (err) {
      logger.error("Nag call failed; will retry next tick.", err);
      return;
    }

    await recordCallForRateLimit(db);

    const batch = db.batch();
    for (const { id } of eligible) {
      batch.update(db.collection("orders").doc(id), {
        confirmationCallCount: FieldValue.increment(1),
        lastConfirmationCallAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();

    logger.info(
      `Nag call placed for ${eligible.length} unconfirmed order(s): ` +
        `${eligible.map((o) => o.orderNumber).join(", ")}.`,
    );
  },
);

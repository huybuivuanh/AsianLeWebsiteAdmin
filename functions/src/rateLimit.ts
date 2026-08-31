import type { Firestore } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const CALL_LOG_COLLECTION = "confirmationCallLog";

/**
 * Backstop only. The real cadence controls are the every-minute schedule,
 * {@link MIN_SECONDS_BETWEEN_CALLS}, and the 5-minute per-order age cap in
 * `nagUnconfirmedOrders`. This cap just stops a bug in that logic (or abuse
 * spamming order creation) from dialing Twilio without bound. It should
 * never trip in ordinary use — one nag call/minute is 60/hour at most.
 */
const MAX_CALLS_PER_ROLLING_HOUR = 60;

/** Minimum spacing between nag calls, regardless of how many orders are
 * unconfirmed. Keeps the phone from being re-dialled while it is still
 * ringing from the previous attempt (Twilio ring timeout is 25s, see
 * `twilio.ts`). */
export const MIN_SECONDS_BETWEEN_CALLS = 60;

/** True if the hourly nag-call backstop has already been reached. */
export async function isCallRateLimited(db: Firestore): Promise<boolean> {
  const oneHourAgo = Timestamp.fromMillis(Date.now() - 60 * 60 * 1000);
  const snapshot = await db
    .collection(CALL_LOG_COLLECTION)
    .where("at", ">", oneHourAgo)
    .count()
    .get();
  return snapshot.data().count >= MAX_CALLS_PER_ROLLING_HOUR;
}

/**
 * Seconds elapsed since the most recent nag call, or `null` if none has ever
 * been recorded. Used to enforce {@link MIN_SECONDS_BETWEEN_CALLS}.
 */
export async function secondsSinceLastCall(
  db: Firestore,
): Promise<number | null> {
  const snapshot = await db
    .collection(CALL_LOG_COLLECTION)
    .orderBy("at", "desc")
    .limit(1)
    .get();
  const doc = snapshot.docs[0];
  if (!doc) return null;
  const at = doc.get("at") as Timestamp | undefined;
  if (!at) return null;
  return (Date.now() - at.toMillis()) / 1000;
}

/** Records that a nag call was placed, for the two checks above. */
export async function recordCallForRateLimit(db: Firestore): Promise<void> {
  await db.collection(CALL_LOG_COLLECTION).add({ at: FieldValue.serverTimestamp() });
}

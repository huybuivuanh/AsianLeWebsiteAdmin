import type { Firestore } from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

const CALL_LOG_COLLECTION = "confirmationCallLog";

/**
 * Defensive cap only — guards against a bug or abuse spamming order creation
 * (and therefore spamming calls), not a normal operating limit. Order volume
 * is low enough that this should never trip in ordinary use.
 */
const MAX_CALLS_PER_ROLLING_HOUR = 20;

/** True if the hourly confirmation-call cap has already been reached. */
export async function isCallRateLimited(db: Firestore): Promise<boolean> {
  const oneHourAgo = Timestamp.fromMillis(Date.now() - 60 * 60 * 1000);
  const snapshot = await db
    .collection(CALL_LOG_COLLECTION)
    .where("at", ">", oneHourAgo)
    .count()
    .get();
  return snapshot.data().count >= MAX_CALLS_PER_ROLLING_HOUR;
}

/** Records that a confirmation call was placed, for the rolling-hour count above. */
export async function recordCallForRateLimit(db: Firestore): Promise<void> {
  await db.collection(CALL_LOG_COLLECTION).add({ at: FieldValue.serverTimestamp() });
}

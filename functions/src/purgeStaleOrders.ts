import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import {
  getFirestore,
  Timestamp,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";

/** ~30 days, same as the POS cleanup (AsianLePOS/functions purgeStaleOrders). */
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 500;

/** True for a preorder/reservation whose pickup or booking time hasn't happened yet.
 * Those can be made up to 30 days ahead, so their `createdAt` alone isn't enough. */
function isStillUpcoming(doc: QueryDocumentSnapshot, now: number): boolean {
  const scheduledAt = doc.get("fulfillment.scheduledAt");
  return scheduledAt instanceof Timestamp && scheduledAt.toMillis() > now;
}

/**
 * Deletes orders (and reservations, which live in `orders` too) created more than
 * ~30 days ago. Runs daily at 04:00 UTC. Each delete also removes the POS copy
 * through `mirrorOnlineOrder`.
 */
export const purgeStaleOrders = onSchedule(
  {
    schedule: "0 4 * * *",
    timeZone: "UTC",
    memory: "256MiB",
    timeoutSeconds: 540,
  },
  async () => {
    const db = getFirestore();
    const now = Date.now();
    const cutoff = Timestamp.fromMillis(now - RETENTION_MS);
    const base = db
      .collection("orders")
      .where("createdAt", "<", cutoff)
      .orderBy("createdAt");

    let deleted = 0;
    let kept = 0;
    let last: QueryDocumentSnapshot | undefined;

    // Page with a cursor (not "re-run the query until empty"), because kept
    // upcoming orders would otherwise come back on every pass.
    while (true) {
      const page = await (last ? base.startAfter(last) : base).limit(BATCH_SIZE).get();
      if (page.empty) break;

      const batch = db.batch();
      let inBatch = 0;
      for (const doc of page.docs) {
        if (isStillUpcoming(doc, now)) {
          kept++;
          continue;
        }
        batch.delete(doc.ref);
        inBatch++;
      }
      if (inBatch > 0) await batch.commit();
      deleted += inBatch;
      last = page.docs[page.docs.length - 1];
    }

    logger.info(
      `purgeStaleOrders: deleted ${deleted} orders older than 30 days, kept ${kept} still upcoming.`,
    );
  },
);

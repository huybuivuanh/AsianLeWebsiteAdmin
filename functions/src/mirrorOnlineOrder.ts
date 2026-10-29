import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions/v2";
import { Timestamp } from "firebase-admin/firestore";
import { mirrorOnlineOrder as mirror } from "./onlineOrderMirror";

/**
 * Fires on every create/update/delete of an online order and copies it into
 * the POS project's `onlineOrders` collection (read-only there).
 * Retries on failure; the write is safe to repeat.
 */
export const mirrorOnlineOrder = onDocumentWritten(
  { document: "orders/{orderId}", retry: true },
  async (event) => {
    const orderId = event.params.orderId;
    const after = event.data?.after;
    const data = after?.exists ? (after.data() ?? null) : null;
    const sourceUpdatedAt =
      after?.exists && after.updateTime
        ? after.updateTime
        : Timestamp.fromDate(new Date(event.time));

    try {
      const result = await mirror(orderId, data, sourceUpdatedAt);
      logger.info(`Order ${orderId}: POS mirror ${result}.`);
    } catch (err) {
      logger.error(`Order ${orderId}: POS mirror failed`, err);
      throw err; // let the retry kick in
    }
  },
);

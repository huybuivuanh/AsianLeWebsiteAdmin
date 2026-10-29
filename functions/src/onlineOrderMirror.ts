// Copies online orders into the POS Firebase project (asianlepos) so the POS
// can show them read-only in its take-out list without signing in here.
// One-way only: the POS never writes to `onlineOrders`.
import { getApps, initializeApp } from "firebase-admin/app";
import {
  FieldValue,
  type DocumentData,
  type Firestore,
  getFirestore,
  Timestamp,
} from "firebase-admin/firestore";

const POS_PROJECT_ID = "asianlepos";
const POS_APP_NAME = "pos";
export const POS_ONLINE_ORDERS_COLLECTION = "onlineOrders";

let posDbInstance: Firestore | null = null;

/** Firestore of the POS project. Uses this project's runtime credentials,
 * which need the "Cloud Datastore User" role on asianlepos. */
export function posDb(): Firestore {
  if (posDbInstance) return posDbInstance;
  const app =
    getApps().find((a) => a.name === POS_APP_NAME) ??
    initializeApp({ projectId: POS_PROJECT_ID }, POS_APP_NAME);
  posDbInstance = getFirestore(app);
  posDbInstance.settings({ ignoreUndefinedProperties: true });
  return posDbInstance;
}

/** Only the fields the POS shows. Customer email is left out on purpose. */
function toPosOrder(data: DocumentData, fallbackCreatedAt: Timestamp) {
  const items = Array.isArray(data.orderItems) ? data.orderItems : [];
  return {
    source: "online",
    orderNumber: data.orderNumber,
    status: data.status,
    fulfillment: data.fulfillment,
    customerName: data.customerName ?? "",
    phoneNumber: data.phoneNumber ?? "",
    orderItems: items.map((item: DocumentData) => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      kitchenType: item.kitchenType,
      instructions: item.instructions,
      options: Array.isArray(item.options)
        ? item.options.map((o: DocumentData) => ({
            name: o.name,
            price: o.price,
            quantity: o.quantity,
          }))
        : undefined,
    })),
    taxBreakDown: data.taxBreakDown,
    paid: Boolean(data.paid),
    printed: Boolean(data.printed),
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : fallbackCreatedAt,
  };
}

export type MirrorResult =
  | "written"
  | "deleted"
  | "skipped-new"
  | "skipped-rejected"
  | "skipped-stale";

/**
 * Brings the POS copy of one online order up to date.
 * `data` is null when the online order was deleted. `sourceUpdatedAt` is when
 * the online order last changed; an older change never overwrites a newer one
 * (trigger events can arrive out of order).
 */
export async function mirrorOnlineOrder(
  orderId: string,
  data: DocumentData | null,
  sourceUpdatedAt: Timestamp,
  options: { copyCancelledWithoutCopy?: boolean } = {},
): Promise<MirrorResult> {
  const db = posDb();
  const ref = db.collection(POS_ONLINE_ORDERS_COLLECTION).doc(orderId);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const existingVersion = snap.get("sourceUpdatedAt") as Timestamp | undefined;
    if (existingVersion && existingVersion.toMillis() > sourceUpdatedAt.toMillis()) {
      return "skipped-stale";
    }

    if (!data) {
      if (snap.exists) tx.delete(ref);
      return "deleted";
    }

    // Not accepted yet: shows up in the POS once it's accepted.
    if (data.status === "New") return "skipped-new";

    // Cancelled with no POS copy means it was rejected before being accepted
    // (accepting would have created the copy), so it never reached the kitchen.
    if (
      data.status === "Cancelled" &&
      !snap.exists &&
      !options.copyCancelledWithoutCopy
    ) {
      return "skipped-rejected";
    }

    tx.set(ref, {
      ...toPosOrder(data, sourceUpdatedAt),
      sourceUpdatedAt,
      mirroredAt: FieldValue.serverTimestamp(),
    });
    return "written";
  });
}

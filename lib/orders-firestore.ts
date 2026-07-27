import {
  Timestamp,
  collection,
  getDocs,
  orderBy,
  query,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TakeOutFulfillmentKind } from "@/types/enum";

export const ORDERS_COLLECTION = "orders";

export function dateToLocalKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Local calendar day [start, end] as Firestore timestamps (browser local timezone). */
export function localDayBoundsFromDateKey(
  dateKey: string,
): { start: Timestamp; end: Timestamp } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;
  const y = Number(match[1]);
  const mo = Number(match[2]);
  const d = Number(match[3]);
  const start = new Date(y, mo - 1, d, 0, 0, 0, 0);
  const end = new Date(y, mo - 1, d, 23, 59, 59, 999);
  if (
    start.getFullYear() !== y ||
    start.getMonth() !== mo - 1 ||
    start.getDate() !== d
  ) {
    return null;
  }
  return {
    start: Timestamp.fromDate(start),
    end: Timestamp.fromDate(end),
  };
}

function normalizeFulfillment(raw: DocumentData["fulfillment"]): OrderFulfillment {
  if (raw == null || typeof raw !== "object") {
    return { kind: TakeOutFulfillmentKind.Immediate };
  }
  const k = (raw as { kind?: string }).kind;
  if (k === TakeOutFulfillmentKind.Scheduled) {
    const scheduledAt = (raw as { scheduledAt?: Timestamp }).scheduledAt;
    return {
      kind: TakeOutFulfillmentKind.Scheduled,
      scheduledAt: scheduledAt?.toDate?.() ?? new Date(0),
    };
  }
  return {
    kind: TakeOutFulfillmentKind.Immediate,
    readyTimeMinutes: (raw as { readyTimeMinutes?: number }).readyTimeMinutes,
  };
}

function normalizeOrderDoc(id: string, data: DocumentData): Order {
  return {
    id,
    orderNumber: (data.orderNumber as string) ?? id.slice(-6).toUpperCase(),
    status: data.status,
    fulfillment: normalizeFulfillment(data.fulfillment),
    customerName: (data.customerName as string) ?? "",
    phoneNumber: (data.phoneNumber as string) ?? "",
    customerEmail: (data.customerEmail as string) ?? "",
    orderItems: Array.isArray(data.orderItems) ? data.orderItems : [],
    taxBreakDown: data.taxBreakDown ?? { subTotal: 0, pst: 0, gst: 0, total: 0 },
    createdAt: data.createdAt?.toDate?.() ?? new Date(0),
  };
}

export async function fetchOrdersForDate(dateKey: string): Promise<Order[]> {
  const bounds = localDayBoundsFromDateKey(dateKey);
  if (bounds == null) return [];
  const ref = collection(db, ORDERS_COLLECTION);
  const q = query(
    ref,
    where("createdAt", ">=", bounds.start),
    where("createdAt", "<=", bounds.end),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => normalizeOrderDoc(d.id, d.data()));
}

export async function fetchAllOrders(): Promise<Order[]> {
  const snap = await getDocs(
    query(collection(db, ORDERS_COLLECTION), orderBy("createdAt", "desc")),
  );
  return snap.docs.map((d) => normalizeOrderDoc(d.id, d.data()));
}

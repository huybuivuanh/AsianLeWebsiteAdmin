"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchOrdersForDate, dateToLocalKey } from "@/lib/orders-firestore";
import { OrderStatus } from "@/types/enum";

const STATUS_LABELS: { status: OrderStatus; label: string }[] = [
  { status: OrderStatus.New, label: "New" },
  { status: OrderStatus.InProgress, label: "In progress" },
  { status: OrderStatus.ReadyForPickup, label: "Ready" },
  { status: OrderStatus.Completed, label: "Completed" },
  { status: OrderStatus.Cancelled, label: "Cancelled" },
];

export default function DashboardPage() {
  const [count, setCount] = useState<number | null>(null);
  const [byStatus, setByStatus] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const orders = await fetchOrdersForDate(dateToLocalKey(new Date()));
        if (cancelled) return;
        const counts: Record<string, number> = {};
        for (const o of orders) counts[o.status] = (counts[o.status] ?? 0) + 1;
        setCount(orders.length);
        setByStatus(counts);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load orders.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-w-0 max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
          Dashboard
        </h1>
        <p className="text-foreground/70 text-sm sm:text-base break-words">
          Asian Le Admin is the management panel for the Asian Le restaurant
          website. Use it to manage the online menu (categories, items, and
          their option groups), daily specials, the photo gallery, homepage
          updates, store hours, and ordering settings. Online orders come in
          under Orders, where you can review, confirm, and print them.
        </p>
      </div>

      <Link
        href="/orders"
        className="block rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 transition-colors hover:bg-foreground/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
          Orders today · {today}
        </p>

        {loading ? (
          <p className="mt-2 text-sm text-foreground/60">Loading…</p>
        ) : error ? (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : (
          <>
            <p className="mt-1 text-4xl font-semibold text-foreground">
              {count}
            </p>
            {count !== null && count > 0 && (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-foreground/70">
                {STATUS_LABELS.filter(({ status }) => byStatus[status]).map(
                  ({ status, label }) => (
                    <span key={status}>
                      {byStatus[status]} {label}
                    </span>
                  ),
                )}
              </div>
            )}
          </>
        )}
      </Link>
    </div>
  );
}

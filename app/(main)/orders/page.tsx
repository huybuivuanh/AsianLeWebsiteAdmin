"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  dateToLocalKey,
  fetchAllOrders,
  fetchOrdersForDate,
  fetchOrdersSince,
} from "@/lib/orders-firestore";
import { matchesQuery } from "@/lib/utils";
import { OrderCard } from "@/components/orders/OrderCard";
import { PrintableReceipt } from "@/components/orders/PrintableReceipt";

/** "Search all orders" looks this far back first; older orders need an extra click. */
const RECENT_SEARCH_DAYS = 90;
/** Search results are reused for this long, so repeat searches don't re-read Firestore. */
const SEARCH_CACHE_MS = 5 * 60 * 1000;

type SearchScope = "recent" | "all";

function matchesOrderSearch(order: Order, q: string): boolean {
  if (!q.trim()) return true;
  return matchesQuery(q, order.customerName, order.phoneNumber, order.orderNumber);
}

/** "2026-11-02" → "Monday, November 2". */
function formatDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return dateKey;
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: y === new Date().getFullYear() ? undefined : "numeric",
  });
}

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-foreground/40"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
      />
    </svg>
  );
}

type DayResult = {
  dateKey: string;
  reloadToken: number;
  orders: Order[];
  error: string | null;
};

type SearchResult = {
  query: string;
  scope: SearchScope;
  orders: Order[];
};

export default function OrdersPage() {
  const todayKey = useMemo(() => dateToLocalKey(new Date()), []);
  const [dateKey, setDateKey] = useState(todayKey);
  const [reloadToken, setReloadToken] = useState(0);
  const [dayResult, setDayResult] = useState<DayResult | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const [globalQuery, setGlobalQuery] = useState("");
  const [globalResult, setGlobalResult] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchCache = useRef<{
    scope: SearchScope;
    fetchedAt: number;
    orders: Order[];
  } | null>(null);

  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  const searchMode = globalResult !== null;

  // Load the selected day's orders whenever the date changes (or Refresh is pressed).
  useEffect(() => {
    if (!dateKey) return;
    let cancelled = false;
    fetchOrdersForDate(dateKey)
      .then((orders) => {
        if (!cancelled) setDayResult({ dateKey, reloadToken, orders, error: null });
      })
      .catch((e) => {
        if (cancelled) return;
        setDayResult({
          dateKey,
          reloadToken,
          orders: [],
          error: e instanceof Error ? e.message : "Failed to load orders.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [dateKey, reloadToken]);

  const loading =
    Boolean(dateKey) &&
    (dayResult?.dateKey !== dateKey || dayResult?.reloadToken !== reloadToken);
  const orders = useMemo(
    () => (dayResult?.dateKey === dateKey ? dayResult.orders : []),
    [dayResult, dateKey],
  );
  const error = !loading ? (dayResult?.error ?? null) : null;
  const loaded = Boolean(dateKey) && !loading && !error;

  useEffect(() => {
    if (!printingOrder) return;
    const id = requestAnimationFrame(() => window.print());
    const clear = () => setPrintingOrder(null);
    window.addEventListener("afterprint", clear);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("afterprint", clear);
    };
  }, [printingOrder]);

  const filteredOrders = useMemo(
    () => orders.filter((order) => matchesOrderSearch(order, searchTerm)),
    [orders, searchTerm],
  );

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  function changeDate(next: string) {
    setDateKey(next);
    setExpanded({});
    setSearchTerm("");
  }

  function refresh() {
    setReloadToken((t) => t + 1);
    setExpanded({});
  }

  const runGlobalSearch = useCallback(
    async (scope: SearchScope) => {
      const q = globalQuery.trim();
      if (!q) return;
      setSearching(true);
      setSearchError(null);
      try {
        const cache = searchCache.current;
        let pool: Order[];
        if (
          cache &&
          Date.now() - cache.fetchedAt < SEARCH_CACHE_MS &&
          (cache.scope === scope || cache.scope === "all")
        ) {
          pool = cache.orders;
        } else {
          if (scope === "all") {
            pool = await fetchAllOrders();
          } else {
            const since = new Date();
            since.setDate(since.getDate() - RECENT_SEARCH_DAYS);
            since.setHours(0, 0, 0, 0);
            pool = await fetchOrdersSince(since);
          }
          searchCache.current = { scope, fetchedAt: Date.now(), orders: pool };
        }
        setGlobalResult({
          query: q,
          scope,
          orders: pool.filter((order) => matchesOrderSearch(order, q)),
        });
        setExpanded({});
      } catch (e) {
        setSearchError(e instanceof Error ? e.message : "Failed to search orders.");
        setGlobalResult(null);
      } finally {
        setSearching(false);
      }
    },
    [globalQuery],
  );

  const clearGlobalSearch = useCallback(() => {
    setGlobalQuery("");
    setGlobalResult(null);
    setSearchError(null);
    setExpanded({});
  }, []);

  const displayedOrders = searchMode ? globalResult.orders : filteredOrders;

  return (
    <>
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Orders
          </h1>
          <p className="max-w-2xl text-sm text-foreground/60">
            Order history from the online ordering site. View and print past orders.
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-2 sm:min-w-[11rem]">
            <label htmlFor="orders-date" className="text-sm font-medium text-foreground">
              Date
            </label>
            <input
              id="orders-date"
              type="date"
              value={dateKey}
              onChange={(e) => changeDate(e.target.value)}
              className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading || !dateKey}
            className="inline-flex h-9 items-center justify-center rounded-md border border-foreground/20 px-4 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
          {dateKey !== todayKey ? (
            <button
              type="button"
              onClick={() => changeDate(todayKey)}
              className="inline-flex h-9 items-center justify-center rounded-md border border-foreground/20 px-4 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              Today
            </button>
          ) : null}
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <label htmlFor="orders-global-search" className="text-sm font-medium text-foreground">
              Search all orders
            </label>
            <div className="relative">
              <SearchIcon />
              <input
                id="orders-global-search"
                type="text"
                placeholder="Search by name, phone, or order #…"
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    runGlobalSearch("recent");
                  }
                }}
                className="w-full rounded-md border border-foreground/15 bg-background py-2 pl-9 pr-3 text-sm text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => runGlobalSearch("recent")}
            disabled={searching || !globalQuery.trim()}
            className="inline-flex h-9 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
          >
            {searching ? "Searching…" : "Search"}
          </button>
          {searchMode ? (
            <button
              type="button"
              onClick={clearGlobalSearch}
              className="inline-flex h-9 items-center justify-center rounded-md border border-foreground/20 px-4 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              Clear
            </button>
          ) : null}
        </div>
        {searchMode ? (
          <p className="mt-3 text-sm text-foreground/60">
            {globalResult.orders.length}{" "}
            {globalResult.orders.length === 1 ? "order" : "orders"} matching
            &ldquo;{globalResult.query}&rdquo;
            {globalResult.scope === "recent"
              ? ` in the last ${RECENT_SEARCH_DAYS} days. `
              : " across all orders."}
            {globalResult.scope === "recent" ? (
              <button
                type="button"
                onClick={() => runGlobalSearch("all")}
                disabled={searching || globalQuery.trim() !== globalResult.query}
                className="font-medium text-foreground underline underline-offset-2 hover:opacity-80 disabled:opacity-50"
              >
                Search older orders too
              </button>
            ) : null}
          </p>
        ) : null}
      </div>

      {searchError && (
        <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {searchError}
        </p>
      )}
      {error && !searchMode && (
        <p className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {searchMode ? null : (
        <>
          {loading ? (
            <p className="text-center text-sm text-foreground/50">Loading orders…</p>
          ) : null}

          {loaded && orders.length === 0 ? (
            <p className="rounded-lg border border-dashed border-foreground/15 px-4 py-10 text-center text-sm text-foreground/50">
              No orders on {formatDateKey(dateKey)}.
            </p>
          ) : null}

          {loaded && orders.length > 0 ? (
            <div className="mb-4 relative">
              <SearchIcon />
              <input
                type="text"
                placeholder="Filter loaded orders by name, phone, or order #…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Filter loaded orders"
                className="w-full rounded-md border border-foreground/15 bg-background py-2 pl-9 pr-3 text-sm text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>
          ) : null}

          {loaded && orders.length > 0 && filteredOrders.length === 0 ? (
            <p className="rounded-lg border border-dashed border-foreground/15 px-4 py-10 text-center text-sm text-foreground/50">
              No orders match &ldquo;{searchTerm.trim()}&rdquo;.
            </p>
          ) : null}
        </>
      )}

      {displayedOrders.length > 0 ? (
        <ul className="space-y-3">
          {displayedOrders.map((order) => (
            <li key={order.id}>
              <OrderCard
                order={order}
                expanded={Boolean(expanded[order.id])}
                onToggle={() => toggle(order.id)}
                onPrint={setPrintingOrder}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>

    {printingOrder ? (
      <div id="order-print-area" className="hidden print:block">
        <PrintableReceipt order={printingOrder} />
      </div>
    ) : null}
    </>
  );
}

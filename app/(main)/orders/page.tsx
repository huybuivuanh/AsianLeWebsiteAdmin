"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  dateToLocalKey,
  fetchAllOrders,
  fetchOrdersForDate,
} from "@/lib/orders-firestore";
import { matchesQuery } from "@/lib/utils";
import { OrderCard } from "@/components/orders/OrderCard";
import { PrintableReceipt } from "@/components/orders/PrintableReceipt";

function matchesOrderSearch(order: Order, q: string): boolean {
  if (!q.trim()) return true;
  return matchesQuery(q, order.customerName, order.phoneNumber, order.orderNumber);
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

export default function OrdersPage() {
  const todayKey = useMemo(() => dateToLocalKey(new Date()), []);
  const [dateKey, setDateKey] = useState(todayKey);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedDateKey, setLoadedDateKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const [globalQuery, setGlobalQuery] = useState("");
  const [globalResults, setGlobalResults] = useState<Order[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  const searchMode = globalResults !== null;

  useEffect(() => {
    setOrders([]);
    setLoadedDateKey(null);
    setExpanded({});
    setError(null);
    setSearchTerm("");
  }, [dateKey]);

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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchOrdersForDate(dateKey);
      setOrders(rows);
      setLoadedDateKey(dateKey);
      setExpanded({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders.");
      setOrders([]);
      setLoadedDateKey(null);
    } finally {
      setLoading(false);
    }
  }, [dateKey]);

  const runGlobalSearch = useCallback(async () => {
    const q = globalQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchError(null);
    try {
      const all = await fetchAllOrders();
      setGlobalResults(all.filter((order) => matchesOrderSearch(order, q)));
      setExpanded({});
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Failed to search orders.");
      setGlobalResults(null);
    } finally {
      setSearching(false);
    }
  }, [globalQuery]);

  const clearGlobalSearch = useCallback(() => {
    setGlobalQuery("");
    setGlobalResults(null);
    setSearchError(null);
    setExpanded({});
  }, []);

  const displayedOrders = searchMode ? (globalResults ?? []) : filteredOrders;

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
              onChange={(e) => setDateKey(e.target.value)}
              className="w-full rounded-md border border-foreground/15 bg-background px-3 py-2 text-sm text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading || !dateKey}
            className="inline-flex h-9 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50 sm:mb-0"
          >
            {loading ? "Loading…" : "Load"}
          </button>
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
                    runGlobalSearch();
                  }
                }}
                className="w-full rounded-md border border-foreground/15 bg-background py-2 pl-9 pr-3 text-sm text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={runGlobalSearch}
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

      {searchMode ? (
        globalResults!.length === 0 && !searching ? (
          <p className="rounded-lg border border-dashed border-foreground/15 px-4 py-10 text-center text-sm text-foreground/50">
            No orders match &ldquo;{globalQuery}&rdquo;.
          </p>
        ) : null
      ) : (
        <>
          {!loadedDateKey && !loading ? (
            <p className="text-center text-sm text-foreground/50">
              Choose a date, then press <strong>Load</strong>.
            </p>
          ) : null}

          {loadedDateKey && !loading && orders.length === 0 ? (
            <p className="rounded-lg border border-dashed border-foreground/15 px-4 py-10 text-center text-sm text-foreground/50">
              No orders for {loadedDateKey}.
            </p>
          ) : null}

          {loadedDateKey && !loading && orders.length > 0 ? (
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

          {loadedDateKey && !loading && orders.length > 0 && filteredOrders.length === 0 ? (
            <p className="rounded-lg border border-dashed border-foreground/15 px-4 py-10 text-center text-sm text-foreground/50">
              No orders match your search.
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

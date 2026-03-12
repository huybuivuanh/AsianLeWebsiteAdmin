"use client";

import { useState } from "react";
import { useSpecialItemsStore } from "@/stores/dailySpecialItemsStore";
import { AddSpecialItemModal } from "@/components/daily-special/AddSpecialItemModal";

export default function SpecialItemPage() {
  const { items, loading, error, addSpecialItem } = useSpecialItemsStore();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Special Item
        </h1>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        >
          Add
        </button>
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-foreground/60 text-sm">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-foreground/70 text-sm sm:text-base">
          No special items yet. Add one to get started.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item: DailySpecialItem) => (
            <li
              key={item.id}
              className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-4 py-3 space-y-1"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <span className="font-medium text-foreground">{item.name}</span>
                <span className="text-foreground/70 text-sm">
                  ${item.price.toFixed(2)}
                </span>
              </div>
              {item.options && item.options.length > 0 && (
                <p className="text-foreground/60 text-sm">
                  Options: {item.options.join(", ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <AddSpecialItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addSpecialItem}
      />
    </div>
  );
}

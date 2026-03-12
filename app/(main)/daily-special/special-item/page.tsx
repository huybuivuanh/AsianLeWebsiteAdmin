"use client";

import { useState } from "react";
import { useSpecialItemsStore } from "@/stores/dailySpecialItemsStore";
import { useDailySpecialsStore } from "@/stores/dailySpecialsStore";
import { AddSpecialItemModal } from "@/components/daily-special/AddSpecialItemModal";
import { EditSpecialItemModal } from "@/components/daily-special/EditSpecialItemModal";

export default function SpecialItemPage() {
  const {
    items,
    loading,
    error,
    addSpecialItem,
    updateSpecialItem,
    deleteSpecialItem,
  } = useSpecialItemsStore();
  const { dailySpecials, updateDailySpecialItemIds } = useDailySpecialsStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DailySpecialItem | null>(null);

  async function handleDelete(item: DailySpecialItem) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Delete "${item.name}"?`)
    )
      return;
    try {
      await deleteSpecialItem(item.id);
      for (const daySpecial of dailySpecials) {
        if (daySpecial.itemIds?.includes(item.id)) {
          const next = (daySpecial.itemIds ?? []).filter((id) => id !== item.id);
          await updateDailySpecialItemIds(daySpecial.id, next);
        }
      }
    } catch {
      // Error already set in store
    }
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Special Item
        </h1>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        >
          Add Item
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
              className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-4 py-3 space-y-2"
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
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingItem(item)}
                  className="rounded-lg border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="rounded-lg border border-red-600 text-red-600 px-3 py-1.5 text-sm font-medium hover:bg-red-600 hover:text-white"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AddSpecialItemModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={addSpecialItem}
      />
      <EditSpecialItemModal
        open={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={updateSpecialItem}
      />
    </div>
  );
}

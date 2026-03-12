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
          const next = (daySpecial.itemIds ?? []).filter(
            (id) => id !== item.id,
          );
          await updateDailySpecialItemIds(daySpecial.id, next);
        }
      }
    } catch {
      // Error already set in store
    }
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="rounded-xl bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20"
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
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <p className="text-foreground text-sm font-medium">
            No special items yet.
          </p>
          <p className="mt-1 text-foreground/60 text-sm">
            Add your first special item, then attach it to a day special.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {items.map((item: DailySpecialItem) => (
            <li
              key={item.id}
              className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] px-4 py-3 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <div className="min-w-0">
                  <span className="text-medium font-semibold text-foreground truncate">
                    {item.name}
                  </span>
                </div>
                <span className="text-medium font-semibold text-foreground/80 rounded-full border border-foreground/15 bg-foreground/5 px-2 py-0.5">
                  ${item.price.toFixed(2)}
                </span>
              </div>
              {item.options && item.options.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {item.options.slice(0, 6).map((opt) => (
                    <span
                      key={opt}
                      className="text-medium leading-5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-2 text-foreground/70"
                    >
                      {opt}
                    </span>
                  ))}
                  {item.options.length > 6 && (
                    <span className="text-medium leading-5 text-foreground/50">
                      +{item.options.length - 6} more
                    </span>
                  )}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingItem(item)}
                  className="rounded-xl border border-foreground/20 px-3.5 py-2 text-base font-semibold text-foreground hover:bg-foreground/5"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="rounded-xl border border-red-600 text-red-600 px-3.5 py-2 text-base font-semibold hover:bg-red-600 hover:text-white"
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

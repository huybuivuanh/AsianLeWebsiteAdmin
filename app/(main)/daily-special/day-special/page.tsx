"use client";

import { useState } from "react";
import { useDailySpecialsStore } from "@/stores/dailySpecialsStore";
import { useSpecialItemsStore } from "@/stores/dailySpecialItemsStore";
import { AddDayModal } from "@/components/daily-special/AddDayModal";
import { EditDayModal } from "@/components/daily-special/EditDayModal";
import { DailySpecialRow } from "@/components/daily-special/DailySpecialRow";
import { AddDayItemsModal } from "@/components/daily-special/AddDayItemsModal";
import type { DayOfWeek } from "@/types/enum";

function dayLabel(value: DayOfWeek): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export default function DaySpecial() {
  const {
    dailySpecials,
    loading,
    error,
    addDailySpecial,
    updateDailySpecial,
    deleteDailySpecial,
    updateDailySpecialItemIds,
  } = useDailySpecialsStore();
  const { items: specialItems, updateSpecialItemDayOfWeekIds } =
    useSpecialItemsStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DailySpecial | null>(null);
  const [addItemsDaySpecial, setAddItemsDaySpecial] =
    useState<DailySpecial | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleDelete(daySpecial: DailySpecial) {
    if (
      !window.confirm(
        `Delete ${dayLabel(daySpecial.dayOfWeek)} (${daySpecial.timeRange.startTime} – ${daySpecial.timeRange.endTime})?`,
      )
    )
      return;
    setDeletingId(daySpecial.id);
    try {
      await deleteDailySpecial(daySpecial.id);
      for (const item of specialItems) {
        if (item.dayOfWeekIds?.includes(daySpecial.id)) {
          const next = (item.dayOfWeekIds ?? []).filter(
            (did) => did !== daySpecial.id,
          );
          await updateSpecialItemDayOfWeekIds(item.id, next);
        }
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRemoveItem(daySpecial: DailySpecial, itemId: string) {
    const next = (daySpecial.itemIds ?? []).filter((id) => id !== itemId);
    await updateDailySpecialItemIds(daySpecial.id, next);
    const item = specialItems.find((m) => m.id === itemId);
    if (item) {
      const nextDayIds = (item.dayOfWeekIds ?? []).filter(
        (did) => did !== daySpecial.id,
      );
      await updateSpecialItemDayOfWeekIds(itemId, nextDayIds);
    }
  }

  async function handleSaveDayItems(daySpecialId: string, itemIds: string[]) {
    const daySpecial =
      addItemsDaySpecial ?? dailySpecials.find((s) => s.id === daySpecialId);
    const previousItemIds = daySpecial?.itemIds ?? [];
    const added = itemIds.filter((id) => !previousItemIds.includes(id));
    const removed = previousItemIds.filter((id) => !itemIds.includes(id));

    await updateDailySpecialItemIds(daySpecialId, itemIds);

    for (const itemId of removed) {
      const item = specialItems.find((m) => m.id === itemId);
      if (item) {
        const next = (item.dayOfWeekIds ?? []).filter(
          (did) => did !== daySpecialId,
        );
        await updateSpecialItemDayOfWeekIds(itemId, next);
      }
    }
    for (const itemId of added) {
      const item = specialItems.find((m) => m.id === itemId);
      if (item) {
        const next = (item.dayOfWeekIds ?? []).includes(daySpecialId)
          ? item.dayOfWeekIds!
          : [...(item.dayOfWeekIds ?? []), daySpecialId];
        await updateSpecialItemDayOfWeekIds(itemId, next);
      }
    }

    setAddItemsDaySpecial(null);
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Day Of Week
        </h1>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        >
          Add Day
        </button>
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-foreground/60 text-sm">Loading…</p>
      ) : dailySpecials.length === 0 ? (
        <p className="text-foreground/70 text-sm sm:text-base">
          No days configured. Add a day and time range to get started.
        </p>
      ) : (
        <ul className="space-y-2">
          {dailySpecials.map((daySpecial) => (
            <DailySpecialRow
              key={daySpecial.id}
              daySpecial={daySpecial}
              expanded={expandedId === daySpecial.id}
              onToggleExpand={() =>
                setExpandedId((id) =>
                  id === daySpecial.id ? null : daySpecial.id,
                )
              }
              onEdit={setEditingItem}
              onDelete={handleDelete}
              onAddItems={setAddItemsDaySpecial}
              onRemoveItem={handleRemoveItem}
              deleting={deletingId === daySpecial.id}
            />
          ))}
        </ul>
      )}

      <AddDayModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={addDailySpecial}
      />
      <EditDayModal
        open={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={updateDailySpecial}
      />
      <AddDayItemsModal
        open={addItemsDaySpecial != null}
        daySpecial={addItemsDaySpecial}
        onClose={() => setAddItemsDaySpecial(null)}
        onSave={handleSaveDayItems}
      />
    </div>
  );
}

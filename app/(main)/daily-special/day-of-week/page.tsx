"use client";

import { useState } from "react";
import {
  useDailySpecialsStore,
  formatTimeToHHMM,
} from "@/stores/dailySpecialsStore";
import { useSpecialItemsStore } from "@/stores/dailySpecialItemsStore";
import { AddDayModal } from "@/components/daily-special/AddDayModal";
import { EditDayModal } from "@/components/daily-special/EditDayModal";
import { DailySpecialRow } from "@/components/daily-special/DailySpecialRow";
import { AddDayItemsModal } from "@/components/daily-special/AddDayItemsModal";
import type { DayOfWeek } from "@/types/enum";

function dayLabel(value: DayOfWeek): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export default function DayOfWeekPage() {
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
  const [addItemsSchedule, setAddItemsSchedule] =
    useState<DailySpecial | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleDelete(schedule: DailySpecial) {
    if (
      !window.confirm(
        `Delete ${dayLabel(schedule.dayOfWeek)} (${formatTimeToHHMM(schedule.timeRange.startTime)} – ${formatTimeToHHMM(schedule.timeRange.endTime)})?`,
      )
    )
      return;
    setDeletingId(schedule.id);
    try {
      await deleteDailySpecial(schedule.id);
      for (const item of specialItems) {
        if (item.dayOfWeekIds?.includes(schedule.id)) {
          const next = (item.dayOfWeekIds ?? []).filter(
            (did) => did !== schedule.id,
          );
          await updateSpecialItemDayOfWeekIds(item.id, next);
        }
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRemoveItem(schedule: DailySpecial, itemId: string) {
    const next = (schedule.itemIds ?? []).filter((id) => id !== itemId);
    await updateDailySpecialItemIds(schedule.id, next);
    const item = specialItems.find((m) => m.id === itemId);
    if (item) {
      const nextDayIds = (item.dayOfWeekIds ?? []).filter(
        (did) => did !== schedule.id,
      );
      await updateSpecialItemDayOfWeekIds(itemId, nextDayIds);
    }
  }

  async function handleSaveDayItems(scheduleId: string, itemIds: string[]) {
    const schedule =
      addItemsSchedule ?? dailySpecials.find((s) => s.id === scheduleId);
    const previousItemIds = schedule?.itemIds ?? [];
    const added = itemIds.filter((id) => !previousItemIds.includes(id));
    const removed = previousItemIds.filter((id) => !itemIds.includes(id));

    await updateDailySpecialItemIds(scheduleId, itemIds);

    for (const itemId of removed) {
      const item = specialItems.find((m) => m.id === itemId);
      if (item) {
        const next = (item.dayOfWeekIds ?? []).filter((did) => did !== scheduleId);
        await updateSpecialItemDayOfWeekIds(itemId, next);
      }
    }
    for (const itemId of added) {
      const item = specialItems.find((m) => m.id === itemId);
      if (item) {
        const next = (item.dayOfWeekIds ?? []).includes(scheduleId)
          ? item.dayOfWeekIds!
          : [...(item.dayOfWeekIds ?? []), scheduleId];
        await updateSpecialItemDayOfWeekIds(itemId, next);
      }
    }

    setAddItemsSchedule(null);
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
          {dailySpecials.map((s) => (
            <DailySpecialRow
              key={s.id}
              schedule={s}
              expanded={expandedId === s.id}
              onToggleExpand={() =>
                setExpandedId((id) => (id === s.id ? null : s.id))
              }
              onEdit={setEditingItem}
              onDelete={handleDelete}
              onAddItems={setAddItemsSchedule}
              onRemoveItem={handleRemoveItem}
              deleting={deletingId === s.id}
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
        open={addItemsSchedule != null}
        schedule={addItemsSchedule}
        onClose={() => setAddItemsSchedule(null)}
        onSave={handleSaveDayItems}
      />
    </div>
  );
}

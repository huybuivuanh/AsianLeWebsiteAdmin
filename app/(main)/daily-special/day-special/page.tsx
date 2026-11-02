"use client";

import { useMemo, useState } from "react";
import { useDailySpecialsStore } from "@/stores/dailySpecialsStore";
import { useSpecialItemsStore } from "@/stores/dailySpecialItemsStore";
import { AddDayModal } from "@/components/daily-special/AddDayModal";
import { EditDayModal } from "@/components/daily-special/EditDayModal";
import { DailySpecialRow } from "@/components/daily-special/DailySpecialRow";
import { AddDayItemsModal } from "@/components/daily-special/AddDayItemsModal";
import { DayOfWeek } from "@/types/enum";
import { confirmDialog } from "@/stores/modalStore";

function dayLabel(value: DayOfWeek): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

/** Monday first, Sunday last — the order staff read the week in. */
const WEEK_ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

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
  const {
    items: specialItems,
    updateSpecialItemDayOfWeekIds,
    updateSpecialItemsBatch,
  } = useSpecialItemsStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DailySpecial | null>(null);
  const [addItemsDaySpecial, setAddItemsDaySpecial] =
    useState<DailySpecial | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // "HH:mm" strings compare correctly as text.
  const sortedDays = useMemo(
    () =>
      dailySpecials.slice().sort(
        (a, b) =>
          WEEK_ORDER.indexOf(a.dayOfWeek) - WEEK_ORDER.indexOf(b.dayOfWeek) ||
          a.timeRange.startTime.localeCompare(b.timeRange.startTime),
      ),
    [dailySpecials],
  );

  async function handleDelete(daySpecial: DailySpecial) {
    if (
      !(await confirmDialog(
        `Delete ${dayLabel(daySpecial.dayOfWeek)} (${daySpecial.timeRange.startTime} – ${daySpecial.timeRange.endTime})?`,
        { danger: true, confirmLabel: "Delete" },
      ))
    )
      return;
    setDeletingId(daySpecial.id);
    try {
      await deleteDailySpecial(daySpecial.id);
      await updateSpecialItemsBatch(
        specialItems
          .filter((item) => item.dayOfWeekIds?.includes(daySpecial.id))
          .map((item) => ({
            id: item.id,
            data: {
              dayOfWeekIds: (item.dayOfWeekIds ?? []).filter((did) => did !== daySpecial.id),
            },
          })),
      );
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

    await updateSpecialItemsBatch(
      specialItems
        .filter((m) => removed.includes(m.id) || added.includes(m.id))
        .map((m) => ({
          id: m.id,
          data: {
            dayOfWeekIds: removed.includes(m.id)
              ? (m.dayOfWeekIds ?? []).filter((did) => did !== daySpecialId)
              : [...new Set([...(m.dayOfWeekIds ?? []), daySpecialId])],
          },
        })),
    );

    setAddItemsDaySpecial(null);
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="rounded-xl bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        >
          Add Day
        </button>
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading && dailySpecials.length === 0 ? (
        <p className="text-foreground/60 text-sm">Loading…</p>
      ) : dailySpecials.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <p className="text-foreground text-sm font-medium">
            No day specials yet.
          </p>
          <p className="mt-1 text-foreground/60 text-sm">
            Add a day, time range, then attach special items.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sortedDays.map((daySpecial) => (
            <DailySpecialRow
              key={daySpecial.id}
              daySpecial={daySpecial}
              expanded={expandedIds.has(daySpecial.id)}
              onToggleExpand={() =>
                setExpandedIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(daySpecial.id)) next.delete(daySpecial.id);
                  else next.add(daySpecial.id);
                  return next;
                })
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

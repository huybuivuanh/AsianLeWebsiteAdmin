"use client";

import { useMemo, useState } from "react";
import { useDailySpecialsStore } from "@/stores/dailySpecialsStore";
import {
  deleteDailySpecial,
  removeItemFromDailySpecial,
  setDailySpecialItems,
} from "@/stores/linkedWrites";
import { AddDayModal } from "@/components/daily-special/AddDayModal";
import { EditDayModal } from "@/components/daily-special/EditDayModal";
import { DailySpecialRow } from "@/components/daily-special/DailySpecialRow";
import { AddDayItemsModal } from "@/components/daily-special/AddDayItemsModal";
import { compareDailySpecials, dayLabel, formatTimeRange } from "@/lib/daily-special";
import { alertDialog, confirmDialog } from "@/stores/modalStore";
import { MenuPageHeader } from "@/components/menu/MenuPageHeader";
import { primaryButtonClass } from "@/components/ui/Button";

export default function DaySpecial() {
  const {
    dailySpecials,
    loading,
    error,
    addDailySpecial,
    updateDailySpecial,
  } = useDailySpecialsStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DailySpecial | null>(null);
  const [addItemsDaySpecial, setAddItemsDaySpecial] =
    useState<DailySpecial | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const sortedDays = useMemo(
    () => dailySpecials.slice().sort(compareDailySpecials),
    [dailySpecials],
  );

  async function handleDelete(daySpecial: DailySpecial) {
    if (
      !(await confirmDialog(
        `Delete ${dayLabel(daySpecial.dayOfWeek)} (${formatTimeRange(daySpecial.timeRange)})?`,
        { danger: true, confirmLabel: "Delete" },
      ))
    )
      return;
    setDeletingId(daySpecial.id);
    try {
      await deleteDailySpecial(daySpecial.id);
    } catch {
      await alertDialog("Couldn't delete this day. Try again.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRemoveItem(daySpecial: DailySpecial, itemId: string) {
    try {
      await removeItemFromDailySpecial(daySpecial.id, itemId);
    } catch {
      await alertDialog("Couldn't remove the item. Try again.");
    }
  }

  async function handleSaveDayItems(daySpecialId: string, itemIds: string[]) {
    await setDailySpecialItems(daySpecialId, itemIds);
    setAddItemsDaySpecial(null);
  }

  return (
    <div className="min-w-0">
      <MenuPageHeader
        title="Days"
        count={loading && dailySpecials.length === 0 ? undefined : dailySpecials.length}
      >
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className={primaryButtonClass}
        >
          + Add day
        </button>
      </MenuPageHeader>

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
        <ul className="space-y-2">
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

"use client";

import { useMemo, useState } from "react";
import { useSpecialItemsStore } from "@/stores/dailySpecialItemsStore";
import { useDailySpecialsStore } from "@/stores/dailySpecialsStore";
import { AddSpecialItemModal } from "@/components/daily-special/AddSpecialItemModal";
import { EditSpecialItemModal } from "@/components/daily-special/EditSpecialItemModal";
import { alertDialog, confirmDialog } from "@/stores/modalStore";
import { deleteSpecialItem } from "@/stores/linkedWrites";
import { MenuPageHeader, UnusedFilterButton } from "@/components/menu/MenuPageHeader";
import { primaryButtonClass } from "@/components/ui/Button";
import { RowActions, UnusedBadge, rowCardClass } from "@/components/menu/RowParts";
import { formatPriceCAD } from "@/lib/utils";
import { WEEK_ORDER, shortDayLabel } from "@/lib/daily-special";
import type { DayOfWeek } from "@/types/enum";

export default function SpecialItemPage() {
  const {
    items,
    loading,
    error,
    addSpecialItem,
    updateSpecialItem,
  } = useSpecialItemsStore();
  const { dailySpecials } = useDailySpecialsStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DailySpecialItem | null>(null);
  const [unusedOnly, setUnusedOnly] = useState(false);

  /** Item id → the weekdays it's on, e.g. ["Mon", "Wed"] (a day with two time
   * ranges is listed once). Read from the days' own item lists. */
  const daysByItemId = useMemo(() => {
    const days = new Map<string, Set<DayOfWeek>>();
    for (const daySpecial of dailySpecials) {
      for (const itemId of daySpecial.itemIds ?? []) {
        if (!days.has(itemId)) days.set(itemId, new Set());
        days.get(itemId)!.add(daySpecial.dayOfWeek);
      }
    }
    const labels = new Map<string, string[]>();
    for (const [itemId, set] of days) {
      labels.set(itemId, WEEK_ORDER.filter((d) => set.has(d)).map(shortDayLabel));
    }
    return labels;
  }, [dailySpecials]);

  const unusedCount = useMemo(
    () => items.filter((item) => !daysByItemId.has(item.id)).length,
    [items, daysByItemId],
  );
  const visibleItems = useMemo(
    () => (unusedOnly ? items.filter((item) => !daysByItemId.has(item.id)) : items),
    [items, unusedOnly, daysByItemId],
  );

  async function handleDelete(item: DailySpecialItem) {
    if (!(await confirmDialog(`Delete "${item.name}"?`, { danger: true, confirmLabel: "Delete" })))
      return;
    try {
      await deleteSpecialItem(item.id);
    } catch {
      await alertDialog(`Couldn't delete "${item.name}". Try again.`);
    }
  }

  return (
    <div className="min-w-0">
      <MenuPageHeader
        title="Special items"
        count={loading && items.length === 0 ? undefined : items.length}
      >
        <UnusedFilterButton
          active={unusedOnly}
          count={unusedCount}
          onToggle={() => setUnusedOnly((v) => !v)}
          title="Special items not on any day"
        />
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className={primaryButtonClass}
        >
          + Add item
        </button>
      </MenuPageHeader>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading && items.length === 0 ? (
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
      ) : visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <p className="text-foreground text-sm font-medium">No unused special items.</p>
          <p className="mt-1 text-foreground/60 text-sm">
            Turn off the Unused filter to see all special items.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visibleItems.map((item: DailySpecialItem) => {
            const days = daysByItemId.get(item.id);
            return (
              <li
                key={item.id}
                className={`${rowCardClass} flex items-center gap-3 px-3 py-3 sm:px-4`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground break-words">
                        {item.name}
                      </span>
                      {!days && <UnusedBadge />}
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums text-foreground">
                      {formatPriceCAD(item.price)}
                    </span>
                  </div>
                  {days && (
                    <p className="mt-0.5 text-sm text-foreground/60">{days.join(", ")}</p>
                  )}
                  {item.options && item.options.length > 0 && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-foreground/60">
                      Options: {item.options.join(", ")}
                    </p>
                  )}
                </div>
                <RowActions
                  name={item.name}
                  onEdit={() => setEditingItem(item)}
                  onDelete={() => handleDelete(item)}
                />
              </li>
            );
          })}
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

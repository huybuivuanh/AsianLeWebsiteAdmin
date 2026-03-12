"use client";

import { useMemo } from "react";
import { useSpecialItemsStore } from "@/stores/dailySpecialItemsStore";
import type { DayOfWeek } from "@/types/enum";

function dayLabel(value: DayOfWeek): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

type DailySpecialRowProps = {
  schedule: DailySpecial;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: (schedule: DailySpecial) => void;
  onDelete: (schedule: DailySpecial) => void;
  onAddItems: (schedule: DailySpecial) => void;
  onRemoveItem: (schedule: DailySpecial, itemId: string) => void;
  deleting?: boolean;
};

export function DailySpecialRow({
  schedule,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddItems,
  onRemoveItem,
  deleting = false,
}: DailySpecialRowProps) {
  const { items: specialItems } = useSpecialItemsStore();

  const itemsInSchedule = useMemo(() => {
    const ids = schedule.itemIds ?? [];
    return ids
      .map((id) => specialItems.find((m) => m.id === id))
      .filter((m): m is DailySpecialItem => m != null);
  }, [schedule.itemIds, specialItems]);

  return (
    <li className="rounded-lg border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex items-center gap-2 min-w-0 text-left group"
          aria-expanded={expanded}
        >
          <span
            className={`shrink-0 text-foreground/60 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            aria-hidden
          >
            ▼
          </span>
          <span className="font-bold text-foreground truncate">
            {dayLabel(schedule.dayOfWeek)}
          </span>
          <span className="text-foreground/60 text-sm shrink-0">
            {schedule.timeRange.startTime} – {schedule.timeRange.endTime}
          </span>
          {schedule.itemIds && schedule.itemIds.length > 0 && (
            <span className="text-xs text-foreground/50 shrink-0">
              ({schedule.itemIds.length} item
              {schedule.itemIds.length !== 1 ? "s" : ""})
            </span>
          )}
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(schedule)}
            disabled={deleting}
            className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(schedule)}
            disabled={deleting}
            className="rounded-md border border-red-500/30 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
          >
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-foreground/10 bg-foreground/[0.02] px-4 py-3">
          {itemsInSchedule.length === 0 ? (
            <p className="text-sm text-foreground/60 mb-3">
              No items in this schedule.
            </p>
          ) : (
            <ul className="space-y-2 mb-3">
              {itemsInSchedule.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 py-1.5 border-b border-foreground/5 last:border-0"
                >
                  <span className="text-sm text-foreground truncate">
                    {item.name}
                    <span className="text-foreground/60 ml-1">
                      ${item.price.toFixed(2)}
                    </span>
                    {item.options && item.options.length > 0 && (
                      <span className="text-foreground/50 text-xs ml-1">
                        ({item.options.join(", ")})
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(schedule, item.id)}
                    className="rounded-md px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/20 shrink-0"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => onAddItems(schedule)}
            className="rounded-lg border border-foreground/20 px-3 py-2 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            + Add Items
          </button>
        </div>
      )}
    </li>
  );
}

"use client";

import { useMemo } from "react";
import { useSpecialItemsStore } from "@/stores/dailySpecialItemsStore";
import type { DayOfWeek } from "@/types/enum";

function dayLabel(value: DayOfWeek): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

type DailySpecialRowProps = {
  daySpecial: DailySpecial;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: (daySpecial: DailySpecial) => void;
  onDelete: (daySpecial: DailySpecial) => void;
  onAddItems: (daySpecial: DailySpecial) => void;
  onRemoveItem: (daySpecial: DailySpecial, itemId: string) => void;
  deleting?: boolean;
};

export function DailySpecialRow({
  daySpecial,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddItems,
  onRemoveItem,
  deleting = false,
}: DailySpecialRowProps) {
  const { items: specialItems } = useSpecialItemsStore();

  const itemsInTimeRange = useMemo(() => {
    const ids = daySpecial.itemIds ?? [];
    return ids
      .map((id) => specialItems.find((m) => m.id === id))
      .filter((m): m is DailySpecialItem => m != null);
  }, [daySpecial.itemIds, specialItems]);

  return (
    <li className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex items-center gap-2 min-w-0 text-left group outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 rounded-xl -mx-1 px-1 py-1"
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
            {dayLabel(daySpecial.dayOfWeek)}
          </span>
          <span className="text-foreground/60 text-sm shrink-0">
            {daySpecial.timeRange.startTime} – {daySpecial.timeRange.endTime}
          </span>
          {daySpecial.itemIds && daySpecial.itemIds.length > 0 && (
            <span className="text-xs text-foreground/50 shrink-0 rounded-full bg-foreground/5 px-2 py-0.5">
              ({daySpecial.itemIds.length} item
              {daySpecial.itemIds.length !== 1 ? "s" : ""})
            </span>
          )}
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(daySpecial)}
            disabled={deleting}
            className="rounded-xl border border-foreground/20 px-3.5 py-2 text-base font-semibold text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(daySpecial)}
            disabled={deleting}
            className="rounded-xl border border-red-500/30 px-3.5 py-2 text-base font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
          >
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-foreground/10 bg-foreground/[0.02] px-4 py-3">
          {itemsInTimeRange.length === 0 ? (
            <p className="text-sm text-foreground/60 mb-3">
              No items in this time range.
            </p>
          ) : (
            <ul className="space-y-2 mb-3">
              {itemsInTimeRange.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-foreground/10 bg-background/40 px-3 py-2 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-medium font-semibold text-foreground truncate">
                        {item.name}
                      </span>
                      <span className="text-medium font-semibold text-foreground/80 rounded-full border border-foreground/15 bg-foreground/5 px-2 py-0.5">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                    {item.options && item.options.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {item.options.slice(0, 4).map((opt) => (
                          <span
                            key={opt}
                            className="text-medium leading-5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-2 text-foreground/70"
                          >
                            {opt}
                          </span>
                        ))}
                        {item.options.length > 4 && (
                          <span className="text-[11px] leading-5 text-foreground/50">
                            +{item.options.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(daySpecial, item.id)}
                    className="rounded-xl border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/20 shrink-0"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => onAddItems(daySpecial)}
            className="rounded-xl border border-foreground/20 px-3 py-2 text-sm font-semibold text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            + Add Items
          </button>
        </div>
      )}
    </li>
  );
}

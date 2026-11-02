"use client";

import { useMemo } from "react";
import { useSpecialItemsStore } from "@/stores/dailySpecialItemsStore";
import { dayLabel, formatTimeRange } from "@/lib/daily-special";
import { formatPriceCAD } from "@/lib/utils";
import {
  ExpandChevron,
  RemoveButton,
  RowActions,
  addButtonClass,
  rowCardClass,
  rowHeaderClass,
} from "@/components/menu/RowParts";

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

  const day = dayLabel(daySpecial.dayOfWeek);
  const itemCount = daySpecial.itemIds?.length ?? 0;

  return (
    <li className={rowCardClass}>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        aria-expanded={expanded}
        className={rowHeaderClass}
      >
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{day}</p>
          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-foreground/60">
            <span>{formatTimeRange(daySpecial.timeRange)}</span>
            <span>
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <ExpandChevron expanded={expanded} />
        <RowActions
          name={`${day} ${formatTimeRange(daySpecial.timeRange)}`}
          onEdit={() => onEdit(daySpecial)}
          onDelete={() => onDelete(daySpecial)}
          deleting={deleting}
        />
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-foreground/10 px-3 py-3 sm:px-4">
          {itemsInTimeRange.length === 0 ? (
            <p className="text-sm text-foreground/60">No items in this time range yet.</p>
          ) : (
            <ul className="divide-y divide-foreground/10 overflow-hidden rounded-lg border border-foreground/10">
              {itemsInTimeRange.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground break-words">{item.name}</p>
                    {item.options && item.options.length > 0 && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-foreground/60">
                        {item.options.join(", ")}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm tabular-nums text-foreground/60">
                    {formatPriceCAD(item.price)}
                  </span>
                  <RemoveButton
                    onClick={() => onRemoveItem(daySpecial, item.id)}
                    label={`Remove ${item.name} from ${day}`}
                  />
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => onAddItems(daySpecial)}
            className={addButtonClass}
          >
            + Add items
          </button>
        </div>
      )}
    </li>
  );
}

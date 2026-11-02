"use client";

import { useMemo } from "react";
import { useMenuItemsStore } from "@/stores/menuItemsStore";
import { formatPriceCAD } from "@/lib/utils";
import {
  ExpandChevron,
  RemoveButton,
  RowActions,
  addButtonClass,
  rowCardClass,
  rowHeaderClass,
} from "@/components/menu/RowParts";

type CategoryRowProps = {
  category: FoodCategory;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: (category: FoodCategory) => void;
  onDelete: (category: FoodCategory) => void;
  onAddItems: (category: FoodCategory) => void;
  onRemoveItem: (category: FoodCategory, itemId: string) => void;
  deleting?: boolean;
};

export function CategoryRow({
  category,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddItems,
  onRemoveItem,
  deleting = false,
}: CategoryRowProps) {
  const { items } = useMenuItemsStore();

  const itemsInCategory = useMemo(() => {
    const ids = category.itemIds ?? [];
    return ids
      .map((id) => items.find((m) => m.id === id))
      .filter((m): m is MenuItem => m != null);
  }, [category.itemIds, items]);

  const itemCount = category.itemIds?.length ?? 0;

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
          <p className="font-semibold text-foreground break-words">{category.name}</p>
          <p className="mt-0.5 text-sm text-foreground/60">
            {itemCount} item{itemCount !== 1 ? "s" : ""}
          </p>
        </div>
        <ExpandChevron expanded={expanded} />
        <RowActions
          name={category.name}
          onEdit={() => onEdit(category)}
          onDelete={() => onDelete(category)}
          deleting={deleting}
        />
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-foreground/10 px-3 py-3 sm:px-4">
          {category.description && (
            <p className="text-sm text-foreground/70">{category.description}</p>
          )}

          {itemsInCategory.length === 0 ? (
            <p className="text-sm text-foreground/60">
              No items in this category yet.
            </p>
          ) : (
            <ul className="divide-y divide-foreground/10 overflow-hidden rounded-lg border border-foreground/10">
              {itemsInCategory.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-3 py-1.5"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {item.name}
                  </span>
                  <span className="shrink-0 text-sm tabular-nums text-foreground/60">
                    {formatPriceCAD(item.price)}
                  </span>
                  <RemoveButton
                    onClick={() => onRemoveItem(category, item.id)}
                    label={`Remove ${item.name} from ${category.name}`}
                  />
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => onAddItems(category)}
            className={addButtonClass}
          >
            + Add items
          </button>
        </div>
      )}
    </li>
  );
}

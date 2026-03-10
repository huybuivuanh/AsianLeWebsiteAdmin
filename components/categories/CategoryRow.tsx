"use client";

import { useState, useMemo } from "react";
import { useMenuItemsStore } from "@/stores/menuItemsStore";

type CategoryRowProps = {
  category: FoodCategory;
  onEdit: (category: FoodCategory) => void;
  onDelete: (category: FoodCategory) => void;
  onAddItems: (category: FoodCategory) => void;
  onRemoveItem: (category: FoodCategory, itemId: string) => void;
  deleting?: boolean;
};

export function CategoryRow({
  category,
  onEdit,
  onDelete,
  onAddItems,
  onRemoveItem,
  deleting = false,
}: CategoryRowProps) {
  const [expanded, setExpanded] = useState(false);
  const { menuItems } = useMenuItemsStore();

  const itemsInCategory = useMemo(() => {
    const ids = category.itemIds ?? [];
    return ids
      .map((id) => menuItems.find((m) => m.id === id))
      .filter((m): m is MenuItem => m != null);
  }, [category.itemIds, menuItems]);

  return (
    <li className="rounded-lg border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
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
          <span className="font-bold text-foreground truncate">{category.name}</span>
          {category.itemIds && category.itemIds.length > 0 && (
            <span className="text-xs text-foreground/50 shrink-0">
              ({category.itemIds.length} item{category.itemIds.length !== 1 ? "s" : ""})
            </span>
          )}
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(category)}
            disabled={deleting}
            className="rounded-md border border-foreground/20 px-3 py-1.5 text-sm text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(category)}
            disabled={deleting}
            className="rounded-md border border-red-500/30 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
          >
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-foreground/10 bg-foreground/[0.02] px-4 py-3">
          {itemsInCategory.length === 0 ? (
            <p className="text-sm text-foreground/60 mb-3">No items in this category.</p>
          ) : (
            <ul className="space-y-2 mb-3">
              {itemsInCategory.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 py-1.5 border-b border-foreground/5 last:border-0"
                >
                  <span className="text-sm text-foreground truncate">
                    {item.name}
                    {item.price != null && (
                      <span className="text-foreground/60 ml-1">
                        ${Number(item.price).toFixed(2)}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(category, item.id)}
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
            onClick={() => onAddItems(category)}
            className="rounded-lg border border-foreground/20 px-3 py-2 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            + Add Items
          </button>
        </div>
      )}
    </li>
  );
}

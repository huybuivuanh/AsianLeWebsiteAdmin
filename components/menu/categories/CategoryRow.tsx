"use client";

import { useMemo } from "react";
import { useMenuItemsStore } from "@/stores/menuItemsStore";

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
  const { menuItems } = useMenuItemsStore();

  const itemsInCategory = useMemo(() => {
    const ids = category.itemIds ?? [];
    return ids
      .map((id) => menuItems.find((m) => m.id === id))
      .filter((m): m is MenuItem => m != null);
  }, [category.itemIds, menuItems]);

  return (
    <li className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
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
        className="px-4 py-3 flex flex-wrap items-start justify-between gap-3 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 hover:bg-foreground/[0.03]"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-foreground truncate">
              {category.name}
            </span>
            {category.itemIds && category.itemIds.length > 0 && (
              <span className="text-xs text-foreground/50 shrink-0 rounded-full bg-foreground/5 px-2 py-0.5">
                ({category.itemIds.length} item
                {category.itemIds.length !== 1 ? "s" : ""})
              </span>
            )}
          </div>
          {expanded && category.description && (
            <p className="mt-1 text-sm text-foreground/70">
              {category.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onEdit(category)}
            disabled={deleting}
            className="rounded-xl border border-foreground/20 px-3.5 py-2 text-base font-semibold text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(category)}
            disabled={deleting}
            className="rounded-xl border border-red-600 text-red-600 px-3.5 py-2 text-base font-semibold hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-50"
          >
            {deleting ? "…" : "Delete"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-foreground/10 bg-foreground/[0.02] px-4 py-4">
          {itemsInCategory.length === 0 ? (
            <div className="rounded-xl border border-foreground/10 bg-background/40 p-4 mb-3">
              <p className="text-sm font-medium text-foreground">
                No items in this category.
              </p>
              <p className="mt-1 text-sm text-foreground/60">
                Add items to start building this section.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {itemsInCategory.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-foreground/10 bg-background/40 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">
                        {item.name}
                      </span>
                      {item.price != null && (
                        <span className="text-xs font-semibold text-foreground/80 rounded-full border border-foreground/15 bg-foreground/5 px-2 py-0.5 shrink-0">
                          ${Number(item.price).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(category, item.id)}
                    className="rounded-lg border border-red-600/30 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 shrink-0"
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
            className="rounded-xl border border-foreground/20 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            + Add Items
          </button>
        </div>
      )}
    </li>
  );
}

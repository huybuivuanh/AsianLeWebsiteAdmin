"use client";

import { useState, useEffect, useMemo } from "react";
import { useMenuItemsStore } from "@/stores/menuItemsStore";

type AddCategoryItemsModalProps = {
  open: boolean;
  category: FoodCategory | null;
  onClose: () => void;
  onSave: (categoryId: string, itemIds: string[]) => Promise<void>;
};

export function AddCategoryItemsModal({
  open,
  category,
  onClose,
  onSave,
}: AddCategoryItemsModalProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { menuItems } = useMenuItemsStore();

  useEffect(() => {
    if (open && category) {
      setSelectedIds(category.itemIds ?? []);
      setSearch("");
      setFormError(null);
      setSubmitting(false);
    }
    if (!open) {
      setSearch("");
      setSelectedIds([]);
      setFormError(null);
      setSubmitting(false);
    }
  }, [open, category]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return menuItems;
    return menuItems.filter((m) => m.name.toLowerCase().includes(q));
  }, [menuItems, search]);

  function toggleItem(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!category) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await onSave(category.id, selectedIds);
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleBackdropClose() {
    if (!submitting) onClose();
  }

  if (!open || !category) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="add-category-items-title"
    >
      <div
        className="absolute inset-0"
        onClick={handleBackdropClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-3xl max-h-[85dvh] flex flex-col rounded-2xl bg-background border border-foreground/10 shadow-xl">
        <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between gap-4 shrink-0">
          <h2
            id="add-category-items-title"
            className="text-lg font-semibold text-foreground truncate"
          >
            Add Items to {category.name}
          </h2>
          <button
            type="button"
            onClick={handleBackdropClose}
            className="shrink-0 rounded p-1 text-foreground/70 hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 pt-4 pb-3 shrink-0 flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items…"
                className="w-full sm:w-80 rounded-xl border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                aria-label="Search items"
              />
              <span className="text-xs text-foreground/60">
                {selectedIds.length} selected
              </span>
            </div>
            {formError && (
              <p
                className="text-red-600 dark:text-red-400 text-sm"
                role="alert"
              >
                {formError}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-4 min-h-0">
            {filteredItems.length === 0 ? (
              <p className="text-sm text-foreground/60 py-6">
                {search.trim()
                  ? "No items match your search."
                  : "No menu items yet."}
              </p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-1">
                {filteredItems.map((item) => (
                  <li key={item.id}>
                    <label className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-foreground/10 hover:bg-foreground/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleItem(item.id)}
                        className="rounded border-foreground/30 text-foreground focus:ring-foreground/20"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
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
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="px-6 py-4 border-t border-foreground/10 flex justify-end shrink-0">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-foreground text-background px-5 py-2.5 text-sm font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save Selection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

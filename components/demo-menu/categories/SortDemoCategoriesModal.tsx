"use client";

import { useEffect, useState } from "react";

type SortDemoCategoriesModalProps = {
  open: boolean;
  categories: DemoCategory[];
  onClose: () => void;
  onSave: (orderedIds: string[]) => Promise<void>;
};

type DraggableCategory = Pick<DemoCategory, "id" | "name" | "description">;

export function SortDemoCategoriesModal({
  open,
  categories,
  onClose,
  onSave,
}: SortDemoCategoriesModalProps) {
  const [items, setItems] = useState<DraggableCategory[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const sorted = [...categories].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name),
      );
      setItems(
        sorted.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
        })),
      );
      setDragIndex(null);
      setSubmitting(false);
      setFormError(null);
    } else {
      setItems([]);
      setDragIndex(null);
      setSubmitting(false);
      setFormError(null);
    }
  }, [open, categories]);

  function handleBackdropClose() {
    if (!submitting) onClose();
  }

  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent<HTMLLIElement>, index: number) {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await onSave(items.map((c) => c.id));
      onClose();
    } catch {
      setFormError("Failed to save order. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="sort-demo-categories-title"
    >
      <div
        className="absolute inset-0"
        onClick={handleBackdropClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-4xl max-h-[85dvh] flex flex-col rounded-2xl bg-background border border-foreground/10 shadow-xl">
        <div className="px-8 py-5 border-b border-foreground/10 flex items-center justify-between gap-4 shrink-0">
          <h2
            id="sort-demo-categories-title"
            className="text-lg font-semibold text-foreground"
          >
            Sort Categories
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
          <div className="px-8 pt-5 pb-4 shrink-0">
            <p className="text-sm text-foreground/70">
              Drag categories to change their display order.
            </p>
            {formError && (
              <p
                className="mt-2 text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {formError}
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-5 min-h-0">
            {items.length === 0 ? (
              <p className="text-sm text-foreground/60 py-6">
                No categories to sort.
              </p>
            ) : (
              <ul className="space-y-2">
                {items.map((cat, index) => (
                  <li
                    key={cat.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    className="flex items-center gap-4 rounded-xl border border-foreground/15 bg-foreground/[0.02] px-4 py-3 cursor-move select-none"
                  >
                    <span className="text-foreground/40 text-xs font-mono w-6 text-center">
                      {index + 1}
                    </span>
                    <span className="text-foreground/60 text-lg">⋮⋮</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {cat.name}
                      </p>
                      {cat.description && (
                        <p className="text-xs text-foreground/60 truncate">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="px-8 py-4 border-t border-foreground/10 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={handleBackdropClose}
              disabled={submitting}
              className="rounded-xl border border-foreground/20 px-4 py-2 text-sm font-semibold text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="rounded-xl bg-foreground text-background px-5 py-2 text-sm font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

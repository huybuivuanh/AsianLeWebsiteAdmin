"use client";

import { useEffect, useState } from "react";
import { getOrderedOptionGroupRefs, reindexOptionGroupOrders } from "@/lib/menu-item-option-groups";

type SortItemOptionGroupsModalProps = {
  open: boolean;
  item: DemoMenuItem;
  optionGroups: OptionGroup[];
  onClose: () => void;
  onSave: (optionGroupIds: OptionGroupId[]) => Promise<void>;
};

type DraggableGroup = { id: string; name: string };

export function SortItemOptionGroupsModal({
  open,
  item,
  optionGroups,
  onClose,
  onSave,
}: SortItemOptionGroupsModalProps) {
  const [items, setItems] = useState<DraggableGroup[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const refs = getOrderedOptionGroupRefs(item);
      setItems(
        refs
          .map((r) => optionGroups.find((g) => g.id === r.optionGroupId))
          .filter((g): g is OptionGroup => g != null)
          .map((g) => ({ id: g.id, name: g.name })),
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
  }, [open, item, optionGroups]);

  function handleBackdropClose() {
    if (!submitting) onClose();
  }

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, submitting, onClose]);

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
      const optionGroupIds = reindexOptionGroupOrders(
        items.map((g) => ({ optionGroupId: g.id, order: 0 })),
      );
      await onSave(optionGroupIds);
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
      aria-labelledby="sort-item-option-groups-title"
    >
      <div className="absolute inset-0" onClick={handleBackdropClose} aria-hidden="true" />
      <div className="relative w-full max-w-md max-h-[85dvh] flex flex-col rounded-2xl bg-background border border-foreground/10 shadow-xl">
        <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between gap-4 shrink-0">
          <h2 id="sort-item-option-groups-title" className="text-lg font-semibold text-foreground truncate">
            Sort option groups — {item.name}
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
          <div className="px-6 pt-4 pb-2 shrink-0">
            <p className="text-sm text-foreground/70">Drag to change the order shown to customers.</p>
            {formError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">{formError}</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-4 min-h-0">
            {items.length === 0 ? (
              <p className="text-sm text-foreground/60 py-6">No option groups to sort.</p>
            ) : (
              <ul className="space-y-2 py-1">
                {items.map((g, index) => (
                  <li
                    key={g.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    className="flex items-center gap-3 rounded-xl border border-foreground/15 bg-foreground/[0.02] px-4 py-2.5 cursor-move select-none"
                  >
                    <span className="text-foreground/40 text-xs font-mono w-5 text-center">{index + 1}</span>
                    <span className="text-foreground/60">⋮⋮</span>
                    <span className="text-sm font-medium text-foreground truncate">{g.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="px-6 py-4 border-t border-foreground/10 flex justify-end gap-3 shrink-0">
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
              disabled={submitting || items.length < 2}
              className="rounded-xl bg-foreground text-background px-5 py-2 text-sm font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
            >
              Save Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

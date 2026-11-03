"use client";

import { useEffect, useState } from "react";
import { Modal, ModalBody, ModalFooter, ModalToolbar, panelFormClass } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/form";

type SortCategoriesModalProps = {
  open: boolean;
  categories: FoodCategory[];
  onClose: () => void;
  onSave: (orderedIds: string[]) => Promise<void>;
};

type DraggableCategory = Pick<FoodCategory, "id" | "name" | "description">;

export function SortCategoriesModal({
  open,
  categories,
  onClose,
  onSave,
}: SortCategoriesModalProps) {
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submitting}
      title="Sort Categories"
      size="4xl"
      layout="panel"
    >
      <form onSubmit={handleSubmit} className={panelFormClass}>
        <ModalToolbar>
          <p className="text-sm text-foreground/70">
            Drag categories to change their display order.
          </p>
          <FormError message={formError} />
        </ModalToolbar>

        <ModalBody>
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
        </ModalBody>

        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || items.length === 0}>
            {submitting ? "Saving…" : "Save Order"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

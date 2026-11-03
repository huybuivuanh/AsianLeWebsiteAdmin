"use client";

import { useEffect, useState } from "react";
import { getOrderedOptionGroupRefs, reindexOptionGroupOrders } from "@/lib/menu-item-option-groups";
import { Modal, ModalBody, ModalFooter, ModalToolbar, panelFormClass } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/form";

type SortItemOptionGroupsModalProps = {
  open: boolean;
  item: MenuItem;
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submitting}
      title={`Sort option groups — ${item.name}`}
      layout="panel"
    >
      <form onSubmit={handleSubmit} className={panelFormClass}>
        <ModalToolbar>
          <p className="text-sm text-foreground/70">Drag to change the order shown to customers.</p>
          <FormError message={formError} />
        </ModalToolbar>

        <ModalBody>
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
        </ModalBody>

        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || items.length < 2}>
            {submitting ? "Saving…" : "Save Order"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

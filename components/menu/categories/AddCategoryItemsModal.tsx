"use client";

import { useState, useEffect, useMemo } from "react";
import { useMenuItemsStore } from "@/stores/menuItemsStore";
import { Modal, ModalBody, ModalFooter, ModalToolbar, panelFormClass } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormError, checkboxClass, searchInputClass } from "@/components/ui/form";

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
  const { items } = useMenuItemsStore();

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
    if (!q) return items;
    return items.filter((m) => m.name.toLowerCase().includes(q));
  }, [items, search]);

  function toggleItem(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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

  if (!category) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submitting}
      title={`Add Items to ${category.name}`}
      size="3xl"
      layout="panel"
    >
      <form onSubmit={handleSubmit} className={panelFormClass}>
        <ModalToolbar>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items…"
              className={`${searchInputClass} sm:w-80`}
              aria-label="Search items"
            />
            <span className="text-xs text-foreground/60">
              {selectedIds.length} selected
            </span>
          </div>
          <FormError message={formError} />
        </ModalToolbar>

        <ModalBody>
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
                      className={checkboxClass}
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
        </ModalBody>

        <ModalFooter>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save Selection"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

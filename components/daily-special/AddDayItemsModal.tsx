"use client";

import { useState, useEffect, useMemo } from "react";
import { useSpecialItemsStore } from "@/stores/dailySpecialItemsStore";
import { formatDayOfWeekLabel } from "@/lib/utils";
import { Modal, ModalBody, ModalFooter, ModalToolbar, panelFormClass } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormError, checkboxClass, searchInputClass } from "@/components/ui/form";

type AddDayItemsModalProps = {
  open: boolean;
  daySpecial: DailySpecial | null;
  onClose: () => void;
  onSave: (daySpecialId: string, itemIds: string[]) => Promise<void>;
};

export function AddDayItemsModal({
  open,
  daySpecial,
  onClose,
  onSave,
}: AddDayItemsModalProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { items: specialItems } = useSpecialItemsStore();

  useEffect(() => {
    if (open && daySpecial) {
      setSelectedIds(daySpecial.itemIds ?? []);
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
  }, [open, daySpecial]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return specialItems;
    return specialItems.filter((m) => m.name.toLowerCase().includes(q));
  }, [specialItems, search]);

  function toggleItem(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!daySpecial) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await onSave(daySpecial.id, selectedIds);
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!daySpecial) return null;

  const dayTitle = `${formatDayOfWeekLabel(daySpecial.dayOfWeek)} (${daySpecial.timeRange.startTime} – ${daySpecial.timeRange.endTime})`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submitting}
      title={`Add Items to ${dayTitle}`}
      layout="panel"
    >
      <form onSubmit={handleSubmit} className={panelFormClass}>
        <ModalToolbar>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className={searchInputClass}
            aria-label="Search items"
          />
          <FormError message={formError} />
        </ModalToolbar>

        <ModalBody>
          {filteredItems.length === 0 ? (
            <p className="text-sm text-foreground/60 py-4">
              {search.trim()
                ? "No items match your search."
                : "No special items yet."}
            </p>
          ) : (
            <ul className="space-y-0 py-2">
              {filteredItems.map((item) => (
                <li key={item.id}>
                  <label className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-foreground/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className={checkboxClass}
                    />
                    <span className="text-sm text-foreground truncate flex-1 min-w-0">
                      {item.name}
                      <span className="text-foreground/60 ml-1">
                        ${item.price.toFixed(2)}
                      </span>
                      {item.options && item.options.length > 0 && (
                        <span className="text-foreground/50 text-xs ml-1">
                          ({item.options.join(", ")})
                        </span>
                      )}
                    </span>
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

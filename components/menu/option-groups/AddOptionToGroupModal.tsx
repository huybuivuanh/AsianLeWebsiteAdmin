"use client";

import { useState, useEffect, useMemo } from "react";
import { formatPriceCAD } from "@/lib/utils";
import { Modal, ModalBody, ModalFooter, ModalToolbar, panelFormClass } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormError, checkboxClass, searchInputClass } from "@/components/ui/form";

type AddOptionToGroupModalProps = {
  open: boolean;
  group: OptionGroup | null;
  options: ItemOption[];
  onClose: () => void;
  onSave: (groupId: string, optionIds: string[]) => Promise<void>;
};

export function AddOptionToGroupModal({
  open,
  group,
  options,
  onClose,
  onSave,
}: AddOptionToGroupModalProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open && group) {
      setSelectedIds(group.optionIds ?? []);
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
  }, [open, group]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, search]);

  function toggleOption(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!group) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await onSave(group.id, selectedIds);
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!group) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submitting}
      title={`Add Options to ${group.name}`}
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
              placeholder="Search options…"
              className={`${searchInputClass} sm:w-80`}
              aria-label="Search options"
            />
            <span className="text-xs text-foreground/60">
              {selectedIds.length} selected
            </span>
          </div>
          <FormError message={formError} />
        </ModalToolbar>

        <ModalBody>
          {filteredOptions.length === 0 ? (
            <p className="text-sm text-foreground/60 py-6">
              {search.trim()
                ? "No options match your search."
                : "No options created yet."}
            </p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 py-1">
              {filteredOptions.map((option) => (
                <li key={option.id}>
                  <label className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-foreground/10 hover:bg-foreground/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(option.id)}
                      onChange={() => toggleOption(option.id)}
                      className={checkboxClass}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {option.name}
                        </span>
                        <span className="text-xs font-semibold text-foreground/80 rounded-full border border-foreground/15 bg-foreground/5 px-2 py-0.5 shrink-0">
                          {formatPriceCAD(option.price)}
                        </span>
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

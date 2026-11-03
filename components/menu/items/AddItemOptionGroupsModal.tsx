"use client";

import { useState, useEffect, useMemo } from "react";
import { getOrderedOptionGroupRefs, mergeOptionGroupSelection } from "@/lib/menu-item-option-groups";
import { Modal, ModalBody, ModalFooter, ModalToolbar, panelFormClass } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormError, checkboxClass, searchInputClass } from "@/components/ui/form";

type AddItemOptionGroupsModalProps = {
  open: boolean;
  item: MenuItem;
  optionGroups: OptionGroup[];
  onClose: () => void;
  onSave: (optionGroupIds: OptionGroupId[]) => Promise<void>;
};

export function AddItemOptionGroupsModal({
  open,
  item,
  optionGroups,
  onClose,
  onSave,
}: AddItemOptionGroupsModalProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedIds(getOrderedOptionGroupRefs(item).map((r) => r.optionGroupId));
      setSearch("");
      setFormError(null);
      setSubmitting(false);
    } else {
      setSearch("");
      setSelectedIds([]);
      setFormError(null);
      setSubmitting(false);
    }
  }, [open, item]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return optionGroups;
    return optionGroups.filter((g) => g.name.toLowerCase().includes(q));
  }, [optionGroups, search]);

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await onSave(mergeOptionGroupSelection(item, selectedIds));
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submitting}
      title={`Add Option Groups to ${item.name}`}
      size="lg"
      layout="panel"
    >
      <form onSubmit={handleSubmit} className={panelFormClass}>
        <ModalToolbar>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search option groups…"
            className={searchInputClass}
            aria-label="Search option groups"
          />
          <FormError message={formError} />
        </ModalToolbar>

        <ModalBody>
          {filteredGroups.length === 0 ? (
            <p className="text-sm text-foreground/60 py-6">
              {search.trim() ? "No option groups match your search." : "No option groups created yet."}
            </p>
          ) : (
            <ul className="space-y-2 py-1">
              {filteredGroups.map((group) => (
                <li key={group.id}>
                  <label className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-foreground/10 hover:bg-foreground/5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(group.id)}
                      onChange={() => toggle(group.id)}
                      className={checkboxClass}
                    />
                    <span className="text-sm font-medium text-foreground truncate">{group.name}</span>
                    <span className="text-xs text-foreground/50 ml-auto shrink-0">
                      Min {group.minSelection} · Max {group.maxSelection}
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

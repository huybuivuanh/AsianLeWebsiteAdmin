"use client";

import { useState, useEffect, useMemo } from "react";
import { getOrderedOptionGroupRefs, mergeOptionGroupSelection } from "@/lib/menu-item-option-groups";

type AddItemOptionGroupsModalProps = {
  open: boolean;
  item: DemoMenuItem;
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

  function handleBackdropClose() {
    if (!submitting) onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="add-item-option-groups-title"
    >
      <div className="absolute inset-0" onClick={handleBackdropClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg max-h-[85dvh] flex flex-col rounded-2xl bg-background border border-foreground/10 shadow-xl">
        <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between gap-4 shrink-0">
          <h2 id="add-item-option-groups-title" className="text-lg font-semibold text-foreground truncate">
            Add Option Groups to {item.name}
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
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search option groups…"
              className="w-full rounded-xl border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              aria-label="Search option groups"
            />
            {formError && (
              <p className="text-red-600 dark:text-red-400 text-sm" role="alert">{formError}</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-4 min-h-0">
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
                        className="rounded border-foreground/30 text-foreground focus:ring-foreground/20"
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

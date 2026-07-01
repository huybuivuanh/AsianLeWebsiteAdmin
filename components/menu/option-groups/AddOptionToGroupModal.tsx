"use client";

import { useState, useEffect, useMemo } from "react";
import { formatPriceCAD } from "@/lib/utils";

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

  function handleBackdropClose() {
    if (!submitting) onClose();
  }

  if (!open || !group) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="add-option-to-group-title"
    >
      <div
        className="absolute inset-0"
        onClick={handleBackdropClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-3xl max-h-[85dvh] flex flex-col rounded-2xl bg-background border border-foreground/10 shadow-xl">
        <div className="px-6 py-4 border-b border-foreground/10 flex items-center justify-between gap-4 shrink-0">
          <h2
            id="add-option-to-group-title"
            className="text-lg font-semibold text-foreground truncate"
          >
            Add Options to {group.name}
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
                placeholder="Search options…"
                className="w-full sm:w-80 rounded-xl border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                aria-label="Search options"
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
                        className="rounded border-foreground/30 text-foreground focus:ring-foreground/20"
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

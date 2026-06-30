"use client";

import { useState, useEffect } from "react";

type EditOptionGroupModalProps = {
  open: boolean;
  group: OptionGroup | null;
  onClose: () => void;
  onSave: (id: string, data: Record<string, unknown>) => Promise<void>;
};

export function EditOptionGroupModal({
  open,
  group,
  onClose,
  onSave,
}: EditOptionGroupModalProps) {
  const [name, setName] = useState("");
  const [minSelection, setMinSelection] = useState(0);
  const [maxSelection, setMaxSelection] = useState(1);
  const [multipleOptionQuantity, setMultipleOptionQuantity] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open && group) {
      setName(group.name);
      setMinSelection(group.minSelection);
      setMaxSelection(group.maxSelection);
      setMultipleOptionQuantity(group.multipleOptionQuantity);
      setFormError(null);
      setSubmitting(false);
    }
    if (!open) {
      setName("");
      setMinSelection(0);
      setMaxSelection(1);
      setMultipleOptionQuantity(false);
      setFormError(null);
      setSubmitting(false);
    }
  }, [open, group?.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!group) return;
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (minSelection < 0 || maxSelection < 1 || minSelection > maxSelection) {
      setFormError("Min must be ≥ 0, max must be ≥ 1, and min must be ≤ max.");
      return;
    }
    setSubmitting(true);
    try {
      await onSave(group.id, { name: name.trim(), minSelection, maxSelection, multipleOptionQuantity });
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
      aria-labelledby="edit-option-group-title"
    >
      <div className="absolute inset-0" onClick={handleBackdropClose} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-xl bg-background border border-foreground/10 shadow-lg p-6">
        <h2 id="edit-option-group-title" className="text-lg font-semibold text-foreground mb-4">
          Edit Option Group
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <p className="text-red-600 dark:text-red-400 text-sm" role="alert">{formError}</p>
          )}
          <div>
            <label htmlFor="edit-og-name" className="block text-sm font-medium text-foreground mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-og-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-og-min" className="block text-sm font-medium text-foreground mb-1">
                Min Selection
              </label>
              <input
                id="edit-og-min"
                type="number"
                min={0}
                value={minSelection}
                onChange={(e) => setMinSelection(Number(e.target.value))}
                className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>
            <div>
              <label htmlFor="edit-og-max" className="block text-sm font-medium text-foreground mb-1">
                Max Selection
              </label>
              <input
                id="edit-og-max"
                type="number"
                min={1}
                value={maxSelection}
                onChange={(e) => setMaxSelection(Number(e.target.value))}
                className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={multipleOptionQuantity}
              onChange={(e) => setMultipleOptionQuantity(e.target.checked)}
              className="h-4 w-4 rounded border-foreground/30"
            />
            <span className="text-sm font-medium text-foreground">Multiple option quantity</span>
          </label>
          <p className="text-xs text-foreground/50 -mt-2 ml-7">
            Allow customers to add more than one of the same option.
          </p>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={handleBackdropClose}
              disabled={submitting}
              className="rounded-lg border border-foreground/20 px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

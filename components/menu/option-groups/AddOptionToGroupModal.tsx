"use client";

import { useState, useEffect } from "react";
import { matchesQuery, formatPriceCAD } from "@/lib/utils";

type Mode = "new" | "existing";

type AddOptionToGroupModalProps = {
  open: boolean;
  group: OptionGroup | null;
  existingOptions: ItemOption[];
  onClose: () => void;
  onCreateAndLink: (group: OptionGroup, name: string, price: number) => Promise<void>;
  onLinkExisting: (group: OptionGroup, option: ItemOption) => Promise<void>;
};

export function AddOptionToGroupModal({
  open,
  group,
  existingOptions,
  onClose,
  onCreateAndLink,
  onLinkExisting,
}: AddOptionToGroupModalProps) {
  const [mode, setMode] = useState<Mode>("new");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setMode("new");
      setName("");
      setPrice("");
      setSearchQuery("");
      setFormError(null);
      setSubmitting(false);
    }
  }, [open]);

  function handleBackdropClose() {
    if (!submitting) onClose();
  }

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!group) return;
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError("Price must be a valid number ≥ 0.");
      return;
    }
    setSubmitting(true);
    try {
      await onCreateAndLink(group, name.trim(), parsedPrice);
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLinkExisting(option: ItemOption) {
    if (!group || submitting) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await onLinkExisting(group, option);
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const alreadyInGroup = new Set(group?.optionIds ?? []);
  const availableOptions = existingOptions.filter(
    (o) => !alreadyInGroup.has(o.id) && matchesQuery(searchQuery, o.name),
  );

  if (!open || !group) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="add-option-to-group-title"
    >
      <div className="absolute inset-0" onClick={handleBackdropClose} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-xl bg-background border border-foreground/10 shadow-lg p-6">
        <h2 id="add-option-to-group-title" className="text-lg font-semibold text-foreground mb-1">
          Add Option
        </h2>
        <p className="text-sm text-foreground/60 mb-4">
          Group: <span className="font-medium text-foreground">{group.name}</span>
        </p>

        {/* Mode tabs */}
        <div className="flex gap-1 mb-4 rounded-lg border border-foreground/10 p-1">
          <button
            type="button"
            onClick={() => { setMode("new"); setFormError(null); }}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "new"
                ? "bg-foreground text-background"
                : "text-foreground/70 hover:text-foreground"
            }`}
          >
            Create new
          </button>
          <button
            type="button"
            onClick={() => { setMode("existing"); setFormError(null); }}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "existing"
                ? "bg-foreground text-background"
                : "text-foreground/70 hover:text-foreground"
            }`}
          >
            Add existing
          </button>
        </div>

        {formError && (
          <p className="text-red-600 dark:text-red-400 text-sm mb-3" role="alert">{formError}</p>
        )}

        {mode === "new" ? (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-option-name" className="block text-sm font-medium text-foreground mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="new-option-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                placeholder="e.g. Extra Spicy"
              />
            </div>
            <div>
              <label htmlFor="new-option-price" className="block text-sm font-medium text-foreground mb-1">
                Price (CAD) <span className="text-red-500">*</span>
              </label>
              <input
                id="new-option-price"
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                placeholder="0.00"
              />
            </div>
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
                {submitting ? "Saving…" : "Create & Add"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search options…"
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
            <div className="max-h-60 overflow-y-auto space-y-1">
              {availableOptions.length === 0 ? (
                <p className="text-sm text-foreground/50 py-2">
                  {existingOptions.length === 0
                    ? "No options created yet."
                    : "All options are already in this group."}
                </p>
              ) : (
                availableOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleLinkExisting(option)}
                    className="w-full flex items-center justify-between rounded-lg border border-foreground/10 px-3 py-2.5 text-sm hover:bg-foreground/5 disabled:opacity-50 text-left"
                  >
                    <span className="font-medium text-foreground">{option.name}</span>
                    <span className="text-foreground/60">{formatPriceCAD(option.price)}</span>
                  </button>
                ))
              )}
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleBackdropClose}
                disabled={submitting}
                className="rounded-lg border border-foreground/20 px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

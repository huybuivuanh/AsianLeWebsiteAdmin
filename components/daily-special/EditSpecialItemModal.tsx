"use client";

import { useState, useEffect } from "react";

type EditSpecialItemModalProps = {
  open: boolean;
  item: DailySpecialItem | null;
  onClose: () => void;
  onSave: (
    id: string,
    name: string,
    price: number,
    options?: string[],
  ) => Promise<void>;
};

export function EditSpecialItemModal({
  open,
  item,
  onClose,
  onSave,
}: EditSpecialItemModalProps) {
  const [name, setName] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open && item) {
      setName(item.name);
      setPriceInput(
        item.price != null && item.price !== 0 ? String(item.price) : "",
      );
      setOptions(item.options?.length ? [...item.options] : []);
      setFormError(null);
      setSubmitting(false);
    }
    if (!open) {
      setName("");
      setPriceInput("");
      setOptions([]);
      setFormError(null);
      setSubmitting(false);
    }
  }, [open, item?.id]);

  function addOption() {
    setOptions((prev) => [...prev, ""]);
  }

  function updateOption(index: number, value: string) {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function parsePrice(): number {
    const s = priceInput.trim();
    if (s === "") return 0;
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!item) return;
    setFormError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const optionsList = options.map((o) => o.trim()).filter(Boolean);
      await onSave(item.id, trimmedName, parsePrice(), optionsList);
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

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, submitting, onClose]);

  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="edit-special-item-title"
    >
      <div
        className="absolute inset-0"
        onClick={handleBackdropClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-xl bg-background border border-foreground/10 shadow-lg p-6 max-h-[90dvh] overflow-y-auto">
        <h2
          id="edit-special-item-title"
          className="text-lg font-semibold text-foreground mb-4"
        >
          Edit Special Item
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <p className="text-red-600 dark:text-red-400 text-sm" role="alert">
              {formError}
            </p>
          )}
          <div>
            <label
              htmlFor="edit-special-item-name"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-special-item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="Item name"
            />
          </div>
          <div>
            <label
              htmlFor="edit-special-item-price"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Price
            </label>
            <input
              id="edit-special-item-price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-medium text-foreground">
                Options
              </span>
              <button
                type="button"
                onClick={addOption}
                className="rounded-lg border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              >
                Add Option
              </button>
            </div>
            {options.length > 0 && (
              <ul className="space-y-2">
                {options.map((value, index) => (
                  <li key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder="e.g. medium, large"
                      className="flex-1 rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="shrink-0 rounded-lg border border-foreground/20 px-2 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none"
                      aria-label="Remove option"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

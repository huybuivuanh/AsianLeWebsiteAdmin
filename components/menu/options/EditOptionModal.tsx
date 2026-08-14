"use client";

import { useState, useEffect } from "react";

type EditOptionModalProps = {
  open: boolean;
  option: ItemOption | null;
  onClose: () => void;
  onSave: (id: string, data: Record<string, unknown>) => Promise<void>;
};

export function EditOptionModal({
  open,
  option,
  onClose,
  onSave,
}: EditOptionModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open && option) {
      setName(option.name);
      setPrice(option.price.toString());
      setFormError(null);
      setSubmitting(false);
    }
    if (!open) {
      setName("");
      setPrice("");
      setFormError(null);
      setSubmitting(false);
    }
  }, [open, option?.id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!option) return;
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
      await onSave(option.id, { name: name.trim(), price: parsedPrice });
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

  if (!open || !option) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="edit-option-title"
    >
      <div className="absolute inset-0" onClick={handleBackdropClose} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-xl bg-background border border-foreground/10 shadow-lg p-6">
        <h2 id="edit-option-title" className="text-lg font-semibold text-foreground mb-4">
          Edit Option
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <p className="text-red-600 dark:text-red-400 text-sm" role="alert">{formError}</p>
          )}
          <div>
            <label htmlFor="edit-option-name" className="block text-sm font-medium text-foreground mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-option-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div>
            <label htmlFor="edit-option-price" className="block text-sm font-medium text-foreground mb-1">
              Price (CAD) <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-option-price"
              type="number"
              min={0}
              step={0.01}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
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
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

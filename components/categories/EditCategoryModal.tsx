"use client";

import { useState, useEffect } from "react";

type EditCategoryModalProps = {
  open: boolean;
  category: FoodCategory | null;
  onClose: () => void;
  onSave: (id: string, name: string, description: string) => Promise<void>;
};

export function EditCategoryModal({
  open,
  category,
  onClose,
  onSave,
}: EditCategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open && category) {
      setName(category.name);
      setDescription(category.description ?? "");
      setFormError(null);
      setSubmitting(false);
    }
    if (!open) {
      setName("");
      setDescription("");
      setFormError(null);
      setSubmitting(false);
    }
  }, [open, category?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) return;
    setFormError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await onSave(category.id, trimmedName, description);
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

  if (!open || !category) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="edit-category-title"
    >
      <div
        className="absolute inset-0"
        onClick={handleBackdropClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-xl bg-background border border-foreground/10 shadow-lg p-6">
        <h2
          id="edit-category-title"
          className="text-lg font-semibold text-foreground mb-4"
        >
          Edit Category
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <p
              className="text-red-600 dark:text-red-400 text-sm"
              role="alert"
            >
              {formError}
            </p>
          )}
          <div>
            <label
              htmlFor="edit-category-name"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-category-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="Category name"
            />
          </div>
          <div>
            <label
              htmlFor="edit-category-description"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Description
            </label>
            <textarea
              id="edit-category-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
              placeholder="Optional description"
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

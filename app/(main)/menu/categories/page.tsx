"use client";

import { useEffect, useState } from "react";
import { useCategoriesStore } from "@/stores/categoriesStore";

export default function CategoriesPage() {
  const { categories, loading, error, fetchCategories, addCategory } =
    useCategoriesStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await addCategory(trimmedName, description);
      setModalOpen(false);
      setName("");
      setDescription("");
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function closeModal() {
    if (!submitting) {
      setModalOpen(false);
      setName("");
      setDescription("");
      setFormError(null);
    }
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Food Category
        </h1>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        >
          Add Category
        </button>
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-foreground/60 text-sm">Loading categories…</p>
      ) : categories.length === 0 ? (
        <p className="text-foreground/70 text-sm sm:text-base">
          No categories yet. Add data in Firestore to see them here.
        </p>
      ) : (
        <ul className="space-y-2">
          {categories
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((cat) => (
              <li
                key={cat.id}
                className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-4 py-3"
              >
                <span className="font-medium text-foreground">{cat.name}</span>
                {cat.description && (
                  <p className="mt-1 text-sm text-foreground/70">
                    {cat.description}
                  </p>
                )}
                {cat.itemIds && cat.itemIds.length > 0 && (
                  <p className="mt-1 text-xs text-foreground/50">
                    {cat.itemIds.length} item(s)
                  </p>
                )}
              </li>
            ))}
        </ul>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          aria-modal="true"
          role="dialog"
          aria-labelledby="add-category-title"
        >
          <div
            className="absolute inset-0"
            onClick={closeModal}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md rounded-xl bg-background border border-foreground/10 shadow-lg p-6">
            <h2
              id="add-category-title"
              className="text-lg font-semibold text-foreground mb-4"
            >
              Add Category
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
                  htmlFor="category-name"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="category-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  placeholder="Category name"
                />
              </div>
              <div>
                <label
                  htmlFor="category-description"
                  className="block text-sm font-medium text-foreground mb-1"
                >
                  Description
                </label>
                <textarea
                  id="category-description"
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
                  onClick={closeModal}
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
      )}
    </div>
  );
}

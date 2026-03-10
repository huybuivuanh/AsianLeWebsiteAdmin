"use client";

import { useState } from "react";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { AddCategoryModal } from "@/components/AddCategoryModal";

export default function CategoriesPage() {
  const { categories, loading, error, addCategory } =
    useCategoriesStore();
  const [modalOpen, setModalOpen] = useState(false);

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
                <span className="font-bold text-foreground">{cat.name}</span>
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

      <AddCategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addCategory}
      />
    </div>
  );
}

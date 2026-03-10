"use client";

import { useState } from "react";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { AddCategoryModal } from "@/components/categories/AddCategoryModal";
import { EditCategoryModal } from "@/components/categories/EditCategoryModal";
import { CategoryRow } from "@/components/categories/CategoryRow";

export default function CategoriesPage() {
  const {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategoriesStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FoodCategory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(category: FoodCategory) {
    if (
      !window.confirm(`Delete “${category.name}”? This cannot be undone.`)
    )
      return;
    setDeletingId(category.id);
    try {
      await deleteCategory(category.id);
    } finally {
      setDeletingId(null);
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
              <CategoryRow
                key={cat.id}
                category={cat}
                onEdit={setEditingCategory}
                onDelete={handleDelete}
                deleting={deletingId === cat.id}
              />
            ))}
        </ul>
      )}

      <AddCategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addCategory}
      />

      <EditCategoryModal
        open={editingCategory != null}
        category={editingCategory}
        onClose={() => setEditingCategory(null)}
        onSave={updateCategory}
      />
    </div>
  );
}

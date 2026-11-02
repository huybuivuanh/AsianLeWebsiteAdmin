"use client";

import { useMemo, useState } from "react";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { useMenuItemsStore } from "@/stores/menuItemsStore";
import { AddCategoryModal } from "@/components/menu/categories/AddCategoryModal";
import { EditCategoryModal } from "@/components/menu/categories/EditCategoryModal";
import { AddCategoryItemsModal } from "@/components/menu/categories/AddCategoryItemsModal";
import { CategoryRow } from "@/components/menu/categories/CategoryRow";
import { SortCategoriesModal } from "@/components/menu/categories/SortCategoriesModal";
import {
  MenuPageHeader,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/menu/MenuPageHeader";
import { confirmDialog } from "@/stores/modalStore";

export default function CategoriesPage() {
  const {
    categories,
    loading,
    error,
    addCategory,
    updateCategory,
    deleteCategory,
    updateCategoryItemIds,
    reorderCategories,
  } = useCategoriesStore();
  const { items, updateMenuItemField, updateMenuItemsBatch } = useMenuItemsStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<FoodCategory | null>(
    null,
  );
  const [addItemsCategory, setAddItemsCategory] = useState<FoodCategory | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(
    new Set(),
  );
  const [query, setQuery] = useState("");
  const [sortModalOpen, setSortModalOpen] = useState(false);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => (c.name ?? "").toLowerCase().includes(q));
  }, [categories, query]);

  async function handleDelete(category: FoodCategory) {
    if (
      !(await confirmDialog(`Delete "${category.name}"? This cannot be undone.`, {
        danger: true,
        confirmLabel: "Delete",
      }))
    )
      return;
    setDeletingId(category.id);
    try {
      await deleteCategory(category.id);
      await updateMenuItemsBatch(
        items
          .filter((item) => item.categoryIds?.includes(category.id))
          .map((item) => ({
            id: item.id,
            data: {
              categoryIds: (item.categoryIds ?? []).filter((cid) => cid !== category.id),
            },
          })),
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleRemoveItem(category: FoodCategory, itemId: string) {
    const next = (category.itemIds ?? []).filter((id) => id !== itemId);
    await updateCategoryItemIds(category.id, next);
    const item = items.find((m) => m.id === itemId);
    if (item) {
      const nextCategoryIds = (item.categoryIds ?? []).filter(
        (cid) => cid !== category.id,
      );
      await updateMenuItemField(itemId, { categoryIds: nextCategoryIds });
    }
  }

  async function handleSaveCategoryItems(
    categoryId: string,
    itemIds: string[],
  ) {
    const category =
      addItemsCategory ?? categories.find((c) => c.id === categoryId);
    const previousItemIds = category?.itemIds ?? [];
    const added = itemIds.filter((id) => !previousItemIds.includes(id));
    const removed = previousItemIds.filter((id) => !itemIds.includes(id));

    await updateCategoryItemIds(categoryId, itemIds);

    await updateMenuItemsBatch(
      items
        .filter((m) => removed.includes(m.id) || added.includes(m.id))
        .map((m) => ({
          id: m.id,
          data: {
            categoryIds: removed.includes(m.id)
              ? (m.categoryIds ?? []).filter((cid) => cid !== categoryId)
              : [...new Set([...(m.categoryIds ?? []), categoryId])],
          },
        })),
    );

    setAddItemsCategory(null);
  }

  return (
    <div className="min-w-0">
      <MenuPageHeader
        title="Categories"
        count={loading && categories.length === 0 ? undefined : categories.length}
      >
        {categories.length > 1 && (
          <button
            type="button"
            onClick={() => setSortModalOpen(true)}
            className={secondaryButtonClass}
          >
            Sort categories
          </button>
        )}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={primaryButtonClass}
        >
          + Add category
        </button>
      </MenuPageHeader>
      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories…"
          className="w-full rounded-xl border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          aria-label="Search categories"
        />
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading && categories.length === 0 ? (
        <p className="text-foreground/60 text-sm">Loading categories…</p>
      ) : categories.length === 0 ? (
        <p className="text-foreground/70 text-sm sm:text-base">
          No categories yet. Add one to get started.
        </p>
      ) : filteredCategories.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <p className="text-foreground text-sm font-medium">
            No categories match “{query.trim()}”.
          </p>
          <p className="mt-1 text-foreground/60 text-sm">
            Try a different search.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filteredCategories
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                expanded={expandedCategoryIds.has(cat.id)}
                onToggleExpand={() =>
                  setExpandedCategoryIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(cat.id)) next.delete(cat.id);
                    else next.add(cat.id);
                    return next;
                  })
                }
                onEdit={setEditingCategory}
                onDelete={handleDelete}
                onAddItems={setAddItemsCategory}
                onRemoveItem={handleRemoveItem}
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

      <AddCategoryItemsModal
        open={addItemsCategory != null}
        category={addItemsCategory}
        onClose={() => setAddItemsCategory(null)}
        onSave={handleSaveCategoryItems}
      />
      <SortCategoriesModal
        open={sortModalOpen}
        categories={categories}
        onClose={() => setSortModalOpen(false)}
        onSave={reorderCategories}
      />
    </div>
  );
}

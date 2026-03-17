"use client";

import { useState } from "react";
import { useMenuItemsStore } from "@/stores/menuItemsStore";
import { useCategoriesStore } from "@/stores/categoriesStore";
import { AddMenuItemModal } from "@/components/menu/AddMenuItemModal";
import { EditMenuItemModal } from "@/components/menu/EditMenuItemModal";
import { MenuItemRow } from "@/components/menu/MenuItemRow";

export default function MenuItemsPage() {
  const { menuItems, loading, error, addMenuItem, updateMenuItem, deleteMenuItem } =
    useMenuItemsStore();
  const { categories, updateCategoryItemIds } = useCategoriesStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(item: MenuItem) {
    if (!window.confirm(`Delete “${item.name}”? This cannot be undone.`)) return;
    setDeletingId(item.id);
    try {
      await deleteMenuItem(item.id);
      for (const category of categories) {
        if ((category.itemIds ?? []).includes(item.id)) {
          const nextItemIds = (category.itemIds ?? []).filter(
            (id) => id !== item.id,
          );
          await updateCategoryItemIds(category.id, nextItemIds);
        }
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-xl bg-foreground text-background px-4 py-2 text-sm font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        >
          Add Item
        </button>
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-foreground/60 text-sm">Loading menu items…</p>
      ) : menuItems.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <p className="text-foreground text-sm font-medium">
            No menu items yet.
          </p>
          <p className="mt-1 text-foreground/60 text-sm">
            Add your first menu item, then assign it to categories.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 lg:grid-cols-1 gap-3">
          {menuItems.map((item) => (
            <MenuItemRow
              key={item.id}
              item={item}
              onEdit={setEditingItem}
              onDelete={handleDelete}
              deleting={deletingId === item.id}
            />
          ))}
        </ul>
      )}

      <AddMenuItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addMenuItem}
      />

      <EditMenuItemModal
        open={editingItem != null}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={updateMenuItem}
      />
    </div>
  );
}

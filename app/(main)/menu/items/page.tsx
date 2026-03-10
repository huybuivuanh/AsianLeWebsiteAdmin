"use client";

import { useState } from "react";
import { useMenuItemsStore } from "@/stores/menuItemsStore";
import { AddMenuItemModal } from "@/components/menu/AddMenuItemModal";
import { MenuItemRow } from "@/components/menu/MenuItemRow";

export default function MenuItemsPage() {
  const { menuItems, loading, error, addMenuItem } = useMenuItemsStore();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20"
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
        <p className="text-foreground/70 text-sm sm:text-base">
          No menu items yet. Add data in Firestore to see them here.
        </p>
      ) : (
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <MenuItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}

      <AddMenuItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addMenuItem}
      />
    </div>
  );
}

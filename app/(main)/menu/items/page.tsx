"use client";

import { useState } from "react";
import { useMenuItemsStore } from "@/stores/menuItemsStore";
import { AddMenuItemModal } from "@/components/AddMenuItemModal";

export default function MenuItemsPage() {
  const { menuItems, loading, error, addMenuItem } =
    useMenuItemsStore();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Menu Item
        </h1>
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
            <li
              key={item.id}
              className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-4 py-3 flex flex-wrap items-start gap-3"
            >
              {item.image && (
                <img
                  src={item.image}
                  alt=""
                  className="w-16 h-16 object-cover rounded-md shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <span className="font-medium text-foreground">{item.name}</span>
                {item.description && (
                  <p className="mt-1 text-sm text-foreground/70 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <p className="mt-1 text-sm font-medium text-foreground">
                  ${Number(item.price ?? 0).toFixed(2)}
                </p>
              </div>
            </li>
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

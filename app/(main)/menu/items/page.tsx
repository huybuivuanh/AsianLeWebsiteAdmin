"use client";

import { useEffect } from "react";
import { useMenuItemsStore } from "@/stores/menuItemsStore";

export default function MenuItemsPage() {
  const { menuItems, loading, error, fetchMenuItems } = useMenuItemsStore();

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  return (
    <div className="min-w-0">
      <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
        Menu Item
      </h1>

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
                {item.price != null && (
                  <p className="mt-1 text-sm font-medium text-foreground">
                    ${Number(item.price).toFixed(2)}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

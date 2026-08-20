"use client";

import { useMemo, useState } from "react";
import { useMenuItemsStore } from "@/stores/menuItemsStore";
import { MenuItemRow } from "@/components/menu/items/MenuItemRow";
import { AddMenuItemModal } from "@/components/menu/items/AddMenuItemModal";
import { EditMenuItemModal } from "@/components/menu/items/EditMenuItemModal";
import { confirmDialog } from "@/stores/modalStore";

export default function MenuItemsPage() {
  const {
    items,
    loading,
    error,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
  } = useMenuItemsStore();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((m) => m.name.toLowerCase().includes(q));
  }, [items, query]);

  async function handleDelete(item: MenuItem) {
    if (!(await confirmDialog(`Delete "${item.name}"? This cannot be undone.`, { danger: true, confirmLabel: "Delete" })))
      return;
    setDeletingId(item.id);
    try {
      await deleteMenuItem(item.id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-foreground/10 bg-background px-4 py-3 mb-4">
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        >
          + Add Item
        </button>
      </div>

      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items…"
          className="w-full rounded-xl border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          aria-label="Search items"
        />
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">{error}</p>
      )}

      {loading ? (
        <p className="text-foreground/60 text-sm">Loading items…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <p className="text-foreground text-sm font-medium">No items yet.</p>
          <p className="mt-1 text-foreground/60 text-sm">
            Add one to get started.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <p className="text-foreground text-sm font-medium">No items match &ldquo;{query.trim()}&rdquo;.</p>
          <p className="mt-1 text-foreground/60 text-sm">Try a different search.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredItems.map((item) => (
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
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={addMenuItem}
      />
      <EditMenuItemModal
        open={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={updateMenuItem}
      />
    </div>
  );
}

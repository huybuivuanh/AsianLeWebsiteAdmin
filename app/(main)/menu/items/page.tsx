"use client";

import { useMemo, useState } from "react";
import { useMenuItemsStore } from "@/stores/menuItemsStore";
import { MenuItemRow } from "@/components/menu/items/MenuItemRow";
import { AddMenuItemModal } from "@/components/menu/items/AddMenuItemModal";
import { EditMenuItemModal } from "@/components/menu/items/EditMenuItemModal";
import { searchInputClass } from "@/components/ui/form";
import { MenuPageHeader, UnusedFilterButton } from "@/components/menu/MenuPageHeader";
import { primaryButtonClass } from "@/components/ui/Button";
import { alertDialog, confirmDialog } from "@/stores/modalStore";
import { deleteMenuItem } from "@/stores/linkedWrites";

/** Items not in any category don't show on the website menu. */
function isUnused(m: MenuItem) {
  return (m.categoryIds?.length ?? 0) === 0;
}

export default function MenuItemsPage() {
  const {
    items,
    loading,
    error,
    addMenuItem,
    updateMenuItem,
  } = useMenuItemsStore();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [unusedOnly, setUnusedOnly] = useState(false);

  const unusedCount = useMemo(() => items.filter(isUnused).length, [items]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (m) =>
        (!unusedOnly || isUnused(m)) &&
        (!q || m.name.toLowerCase().includes(q)),
    );
  }, [items, query, unusedOnly]);

  async function handleDelete(item: MenuItem) {
    if (!(await confirmDialog(`Delete "${item.name}"? This cannot be undone.`, { danger: true, confirmLabel: "Delete" })))
      return;
    setDeletingId(item.id);
    try {
      await deleteMenuItem(item.id);
    } catch {
      await alertDialog(`Couldn't delete "${item.name}". Try again.`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-w-0">
      <MenuPageHeader
        title="Items"
        count={loading && items.length === 0 ? undefined : items.length}
      >
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className={primaryButtonClass}
        >
          + Add item
        </button>
      </MenuPageHeader>

      <div className="mb-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items…"
          className={`${searchInputClass} min-w-0 flex-1`}
          aria-label="Search items"
        />
        <UnusedFilterButton
          active={unusedOnly}
          count={unusedCount}
          onToggle={() => setUnusedOnly((v) => !v)}
          title="Items not in any category"
        />
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">{error}</p>
      )}

      {loading && items.length === 0 ? (
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
          <p className="text-foreground text-sm font-medium">
            {query.trim()
              ? `No ${unusedOnly ? "unused " : ""}items match “${query.trim()}”.`
              : "No unused items."}
          </p>
          <p className="mt-1 text-foreground/60 text-sm">
            {unusedOnly ? "Turn off the Unused filter to see all items." : "Try a different search."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
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

"use client";

import { useMemo, useState } from "react";
import { useDemoMenuItemsStore } from "@/stores/demoMenuItemsStore";
import { DemoMenuItemRow } from "@/components/demo-menu/DemoMenuItemRow";
import { AddDemoMenuItemModal } from "@/components/demo-menu/AddDemoMenuItemModal";
import { EditDemoMenuItemModal } from "@/components/demo-menu/EditDemoMenuItemModal";
import { PublishMenuButton } from "@/components/menu/PublishMenuButton";

export default function DemoMenuItemsPage() {
  const {
    items,
    loading,
    error,
    addDemoMenuItem,
    updateDemoMenuItem,
    deleteDemoMenuItem,
  } = useDemoMenuItemsStore();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DemoMenuItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((m) => m.name.toLowerCase().includes(q));
  }, [items, query]);

  async function handleDelete(item: DemoMenuItem) {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setDeletingId(item.id);
    try {
      await deleteDemoMenuItem(item.id);
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
        <PublishMenuButton />
      </div>

      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search demo items…"
          className="w-full rounded-xl border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          aria-label="Search demo items"
        />
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">{error}</p>
      )}

      {loading ? (
        <p className="text-foreground/60 text-sm">Loading demo items…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <p className="text-foreground text-sm font-medium">No demo items yet.</p>
          <p className="mt-1 text-foreground/60 text-sm">
            Add items here — they write to <code className="text-xs bg-foreground/5 px-1 rounded">demoMenuItems</code> and won&apos;t affect the live menu.
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
            <DemoMenuItemRow
              key={item.id}
              item={item}
              onEdit={setEditingItem}
              onDelete={handleDelete}
              deleting={deletingId === item.id}
            />
          ))}
        </ul>
      )}

      <AddDemoMenuItemModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={addDemoMenuItem}
      />
      <EditDemoMenuItemModal
        open={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={updateDemoMenuItem}
      />
    </div>
  );
}

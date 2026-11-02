"use client";

import { useState } from "react";
import { useUpdatesStore } from "@/stores/updatesStore";
import { AddUpdatesItemModal } from "@/components/updates/AddUpdatesItemModal";
import { EditUpdatesItemModal } from "@/components/updates/EditUpdatesItemModal";
import { ImageGrid } from "@/components/ImageGrid";
import { MenuPageHeader, primaryButtonClass } from "@/components/menu/MenuPageHeader";
import { alertDialog, confirmDialog } from "@/stores/modalStore";

export default function UpdatesPage() {
  const {
    items,
    loading,
    error,
    addUpdatesItem,
    updateUpdatesItem,
    deleteUpdatesItem,
  } = useUpdatesStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ImageItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(item: ImageItem) {
    if (!item.id) return;
    if (
      !(await confirmDialog(`Delete "${item.name}"? This cannot be undone.`, {
        danger: true,
        confirmLabel: "Delete",
      }))
    )
      return;
    setDeletingId(item.id);
    try {
      await deleteUpdatesItem(item.id);
    } catch {
      await alertDialog(`Couldn't delete "${item.name}". Try again.`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-w-0">
      <MenuPageHeader
        title="Updates"
        count={loading && items.length === 0 ? undefined : items.length}
      >
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className={primaryButtonClass}
        >
          + Upload update
        </button>
      </MenuPageHeader>

      {error && (
        <p className="text-red-600 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading && items.length === 0 ? (
        <p className="text-foreground/60 text-sm">Loading updates…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <p className="text-foreground text-sm font-medium">No updates yet.</p>
          <p className="mt-1 text-foreground/60 text-sm">
            Upload an image to post an update on the website.
          </p>
        </div>
      ) : (
        <ImageGrid
          items={items}
          deletingId={deletingId}
          onEdit={setEditingItem}
          onDelete={handleDelete}
        />
      )}

      <AddUpdatesItemModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={addUpdatesItem}
      />
      <EditUpdatesItemModal
        open={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={updateUpdatesItem}
      />
    </div>
  );
}

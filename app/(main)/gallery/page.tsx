"use client";

import { useState } from "react";
import { useGalleryStore } from "@/stores/galleryStore";
import { AddGalleryItemModal } from "@/components/gallery/AddGalleryItemModal";
import { EditGalleryItemModal } from "@/components/gallery/EditGalleryItemModal";
import { MenuPageHeader, primaryButtonClass } from "@/components/menu/MenuPageHeader";
import { ImageGrid } from "@/components/ImageGrid";
import { alertDialog, confirmDialog } from "@/stores/modalStore";

export default function GalleryPage() {
  const {
    items,
    loading,
    error,
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
  } = useGalleryStore();
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
      await deleteGalleryItem(item.id);
    } catch {
      await alertDialog(`Couldn't delete "${item.name}". Try again.`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-w-0">
      <MenuPageHeader
        title="Gallery"
        count={loading && items.length === 0 ? undefined : items.length}
      >
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className={primaryButtonClass}
        >
          + Upload photo
        </button>
      </MenuPageHeader>

      {error && (
        <p className="text-red-600 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading && items.length === 0 ? (
        <p className="text-foreground/60 text-sm">Loading gallery…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <p className="text-foreground text-sm font-medium">No photos yet.</p>
          <p className="mt-1 text-foreground/60 text-sm">
            Upload a photo to show it in the website gallery.
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

      <AddGalleryItemModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={addGalleryItem}
      />
      <EditGalleryItemModal
        open={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={updateGalleryItem}
      />
    </div>
  );
}

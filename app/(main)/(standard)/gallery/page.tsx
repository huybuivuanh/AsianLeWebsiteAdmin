"use client";

import { useState } from "react";
import { useGalleryStore } from "@/stores/galleryStore";
import { AddImageItemModal } from "@/components/image-items/AddImageItemModal";
import { EditImageItemModal } from "@/components/image-items/EditImageItemModal";
import { MenuPageHeader } from "@/components/menu/MenuPageHeader";
import { primaryButtonClass } from "@/components/ui/Button";
import { ImageGrid } from "@/components/image-items/ImageGrid";
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

      <AddImageItemModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={addGalleryItem}
        namePlaceholder="e.g. Restaurant interior"
      />
      <EditImageItemModal
        open={!!editingItem}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSave={updateGalleryItem}
        namePlaceholder="e.g. Restaurant interior"
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { useGalleryStore } from "@/stores/galleryStore";
import { AddGalleryItemModal } from "@/components/gallery/AddGalleryItemModal";
import { EditGalleryItemModal } from "@/components/gallery/EditGalleryItemModal";
import { confirmDialog } from "@/stores/modalStore";

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
  const [editingItem, setEditingItem] = useState<
    (typeof items)[number] | null
  >(null);

  async function handleDelete(item: (typeof items)[number]) {
    if (await confirmDialog(`Delete "${item.name}"?`, { danger: true, confirmLabel: "Delete" })) {
      void deleteGalleryItem(item.id as string);
    }
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Gallery
        </h1>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        >
          Upload image
        </button>
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-foreground/60 text-sm">Loading gallery…</p>
      ) : items.length === 0 ? (
        <p className="text-foreground/70 text-sm sm:text-base">
          No images yet. Upload an image to get started.
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-foreground/10 bg-foreground/[0.02] overflow-hidden"
            >
              <div className="aspect-square relative">
                <Image
                  src={item.url}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="p-2 space-y-2">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.name}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(item)}
                    className="rounded-lg border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="rounded-lg border border-red-600 text-red-600 px-3 py-1.5 text-sm font-medium hover:bg-red-600 hover:text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
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

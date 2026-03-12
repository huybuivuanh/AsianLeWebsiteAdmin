"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

type EditGalleryItemModalProps = {
  open: boolean;
  item: GalleryItem | null;
  onClose: () => void;
  onSave: (id: string, name: string, imageFile: File | null) => Promise<void>;
};

export function EditGalleryItemModal({
  open,
  item,
  onClose,
  onSave,
}: EditGalleryItemModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && item) {
      setDisplayName(item.name);
      setImageFile(null);
      setFormError(null);
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    if (!open) {
      setDisplayName("");
      setImageFile(null);
      setFormError(null);
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open, item?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setFormError(null);
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setFormError("Display name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await onSave(item.id, trimmedName, imageFile);
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleBackdropClose() {
    if (!submitting) onClose();
  }

  if (!open || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="edit-gallery-item-title"
    >
      <div
        className="absolute inset-0"
        onClick={handleBackdropClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-xl bg-background border border-foreground/10 shadow-lg p-6">
        <h2
          id="edit-gallery-item-title"
          className="text-lg font-semibold text-foreground mb-4"
        >
          Edit image
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <p
              className="text-red-600 dark:text-red-400 text-sm"
              role="alert"
            >
              {formError}
            </p>
          )}
          {item.url && !imageFile && (
            <div className="flex items-center gap-3">
              <Image
                src={item.url}
                alt={item.name}
                width={64}
                height={64}
                sizes="64px"
                className="w-16 h-16 object-cover rounded-md"
              />
              <p className="text-xs text-foreground/60">
                Current image. Choose a file to replace it.
              </p>
            </div>
          )}
          {imageFile && (
            <p className="text-xs text-foreground/60 truncate">
              New image: {imageFile.name}
            </p>
          )}
          <div>
            <label
              htmlFor="edit-gallery-display-name"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-gallery-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="e.g. Restaurant interior"
            />
          </div>
          <div>
            <label
              htmlFor="edit-gallery-image"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Replace image (optional)
            </label>
            <input
              ref={fileInputRef}
              id="edit-gallery-image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setImageFile(f && f.size > 0 ? f : null);
              }}
              className="w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border file:border-foreground/20 file:bg-foreground/5 file:px-3 file:py-2 file:text-sm"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={handleBackdropClose}
              disabled={submitting}
              className="rounded-lg border border-foreground/20 px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

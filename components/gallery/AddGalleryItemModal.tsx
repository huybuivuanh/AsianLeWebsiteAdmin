"use client";

import { useState, useEffect, useRef } from "react";

type AddGalleryItemModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, imageFile: File) => Promise<void>;
};

export function AddGalleryItemModal({
  open,
  onClose,
  onAdd,
}: AddGalleryItemModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setDisplayName("");
      setImageFile(null);
      setFormError(null);
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setFormError("Display name is required.");
      return;
    }
    if (!imageFile || imageFile.size === 0) {
      setFormError("Please select an image to upload.");
      return;
    }
    setSubmitting(true);
    try {
      await onAdd(trimmedName, imageFile);
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="add-gallery-item-title"
    >
      <div
        className="absolute inset-0"
        onClick={handleBackdropClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-xl bg-background border border-foreground/10 shadow-lg p-6">
        <h2
          id="add-gallery-item-title"
          className="text-lg font-semibold text-foreground mb-4"
        >
          Upload image
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
          <div>
            <label
              htmlFor="gallery-display-name"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              id="gallery-display-name"
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
              htmlFor="gallery-image"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Image <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              id="gallery-image"
              type="file"
              accept="image/*"
              required
              onChange={(e) => {
                const f = e.target.files?.[0];
                setImageFile(f && f.size > 0 ? f : null);
              }}
              className="w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border file:border-foreground/20 file:bg-foreground/5 file:px-3 file:py-2 file:text-sm"
            />
            {imageFile && (
              <p className="mt-1 text-xs text-foreground/60 truncate">
                Selected: {imageFile.name}
              </p>
            )}
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

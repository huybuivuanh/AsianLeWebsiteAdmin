"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { KitchenType } from "@/types/enum";
import type { DemoMenuItemInput } from "@/stores/demoMenuItemsStore";

type EditDemoMenuItemModalProps = {
  open: boolean;
  item: DemoMenuItem | null;
  onClose: () => void;
  onSave: (id: string, input: DemoMenuItemInput) => Promise<void>;
};

export function EditDemoMenuItemModal({ open, item, onClose, onSave }: EditDemoMenuItemModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [kitchenType, setKitchenType] = useState<KitchenType>(KitchenType.Other);
  const [availabilityEnabled, setAvailabilityEnabled] = useState(true);
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && item) {
      setName(item.name);
      setDescription(item.description ?? "");
      setPriceInput(item.price !== 0 ? String(item.price) : "");
      setImageFile(null);
      setRemoveImage(false);
      setKitchenType(item.kitchenType);
      setAvailabilityEnabled(item.availability.enabled);
      setIsSoldOut(item.isSoldOut);
      setFormError(null);
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    if (!open) {
      setName("");
      setDescription("");
      setPriceInput("");
      setImageFile(null);
      setRemoveImage(false);
      setKitchenType(KitchenType.Other);
      setAvailabilityEnabled(true);
      setIsSoldOut(false);
      setFormError(null);
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open, item?.id]);

  function parsePrice(): number {
    const n = parseFloat(priceInput.trim());
    return Number.isFinite(n) ? n : 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!item) return;
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await onSave(item.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        price: parsePrice(),
        imageFile,
        removeImage: removeImage || undefined,
        kitchenType,
        availability: { enabled: availabilityEnabled },
        isSoldOut,
      });
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
      aria-labelledby="edit-demo-item-title"
    >
      <div className="absolute inset-0" onClick={handleBackdropClose} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-xl bg-background border border-foreground/10 shadow-lg p-6 max-h-[90dvh] overflow-y-auto">
        <h2 id="edit-demo-item-title" className="text-lg font-semibold text-foreground mb-4">
          Edit Demo Menu Item
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <p className="text-red-600 dark:text-red-400 text-sm" role="alert">{formError}</p>
          )}

          {item.image && !imageFile && !removeImage && (
            <div className="flex items-center gap-3">
              <Image
                src={item.image.url}
                alt={item.image.name || ""}
                width={64}
                height={64}
                sizes="64px"
                className="w-16 h-16 object-cover rounded-md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground/60">Current image. Choose a file to replace or remove it.</p>
                <button
                  type="button"
                  onClick={() => setRemoveImage(true)}
                  className="mt-1 text-sm text-red-600 dark:text-red-400 hover:underline focus:outline-none rounded"
                >
                  Remove image
                </button>
              </div>
            </div>
          )}
          {item.image && removeImage && (
            <p className="text-sm text-foreground/70">
              Image will be removed when you save.
              <button
                type="button"
                onClick={() => setRemoveImage(false)}
                className="ml-2 text-sm text-foreground underline hover:no-underline"
              >
                Undo
              </button>
            </p>
          )}

          <div>
            <label htmlFor="edit-di-name" className="block text-sm font-medium text-foreground mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-di-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <div>
            <label htmlFor="edit-di-description" className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              id="edit-di-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label htmlFor="edit-di-price" className="block text-sm font-medium text-foreground mb-1">
              Price (CAD)
            </label>
            <input
              id="edit-di-price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="0.00"
            />
          </div>

          <div>
            <label htmlFor="edit-di-kitchen-type" className="block text-sm font-medium text-foreground mb-1">
              Kitchen Type <span className="text-red-500">*</span>
            </label>
            <select
              id="edit-di-kitchen-type"
              value={kitchenType}
              onChange={(e) => setKitchenType(e.target.value as KitchenType)}
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              {Object.values(KitchenType).map((kt) => (
                <option key={kt} value={kt}>{kt}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={availabilityEnabled}
                onChange={(e) => setAvailabilityEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-foreground/30"
              />
              <span className="text-sm font-medium text-foreground">Available for ordering</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isSoldOut}
                onChange={(e) => setIsSoldOut(e.target.checked)}
                className="h-4 w-4 rounded border-foreground/30"
              />
              <span className="text-sm font-medium text-foreground">Sold out</span>
            </label>
          </div>

          <div>
            <label htmlFor="edit-di-image" className="block text-sm font-medium text-foreground mb-1">
              Image
            </label>
            <input
              ref={fileInputRef}
              id="edit-di-image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setImageFile(f && f.size > 0 ? f : null);
                if (f && f.size > 0) setRemoveImage(false);
              }}
              className="w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border file:border-foreground/20 file:bg-foreground/5 file:px-3 file:py-2 file:text-sm"
            />
            {imageFile && (
              <p className="mt-1 text-xs text-foreground/60 truncate">New: {imageFile.name}</p>
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

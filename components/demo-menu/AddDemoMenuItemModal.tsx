"use client";

import { useState, useEffect, useRef } from "react";
import { KitchenType } from "@/types/enum";
import type { DemoMenuItemInput } from "@/stores/demoMenuItemsStore";
import { WeeklyAvailabilityEditor } from "@/components/demo-menu/WeeklyAvailabilityEditor";

type AddDemoMenuItemModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (input: DemoMenuItemInput) => Promise<void>;
};

export function AddDemoMenuItemModal({ open, onClose, onAdd }: AddDemoMenuItemModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [kitchenType, setKitchenType] = useState<KitchenType>(KitchenType.Other);
  const [restrictAvailability, setRestrictAvailability] = useState(false);
  const [availability, setAvailability] = useState<Availability>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setPriceInput("");
      setImageFile(null);
      setKitchenType(KitchenType.Other);
      setRestrictAvailability(false);
      setAvailability({});
      setFormError(null);
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  function parsePrice(): number {
    const n = parseFloat(priceInput.trim());
    return Number.isFinite(n) ? n : 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await onAdd({
        name: name.trim(),
        description: description.trim() || undefined,
        price: parsePrice(),
        imageFile,
        kitchenType,
        availability: restrictAvailability ? availability : undefined,
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

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, submitting, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="add-demo-item-title"
    >
      <div className="absolute inset-0" onClick={handleBackdropClose} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-xl bg-background border border-foreground/10 shadow-lg p-6 max-h-[90dvh] overflow-y-auto">
        <h2 id="add-demo-item-title" className="text-lg font-semibold text-foreground mb-4">
          Add Demo Menu Item
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <p className="text-red-600 dark:text-red-400 text-sm" role="alert">{formError}</p>
          )}

          <div>
            <label htmlFor="add-di-name" className="block text-sm font-medium text-foreground mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="add-di-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="Item name"
            />
          </div>

          <div>
            <label htmlFor="add-di-description" className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              id="add-di-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label htmlFor="add-di-price" className="block text-sm font-medium text-foreground mb-1">
              Price (CAD)
            </label>
            <input
              id="add-di-price"
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
            <label htmlFor="add-di-kitchen-type" className="block text-sm font-medium text-foreground mb-1">
              Kitchen Type <span className="text-red-500">*</span>
            </label>
            <select
              id="add-di-kitchen-type"
              value={kitchenType}
              onChange={(e) => setKitchenType(e.target.value as KitchenType)}
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              {Object.values(KitchenType).map((kt) => (
                <option key={kt} value={kt}>{kt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={restrictAvailability}
                onChange={(e) => setRestrictAvailability(e.target.checked)}
                className="h-4 w-4 rounded border-foreground/30"
              />
              <span className="text-sm font-medium text-foreground">Restrict to a weekly schedule</span>
            </label>
            {restrictAvailability && (
              <div className="mt-2">
                <WeeklyAvailabilityEditor value={availability} onChange={setAvailability} />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="add-di-image" className="block text-sm font-medium text-foreground mb-1">
              Image
            </label>
            <input
              ref={fileInputRef}
              id="add-di-image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setImageFile(f && f.size > 0 ? f : null);
              }}
              className="w-full text-sm text-foreground file:mr-3 file:rounded-lg file:border file:border-foreground/20 file:bg-foreground/5 file:px-3 file:py-2 file:text-sm"
            />
            {imageFile && (
              <p className="mt-1 text-xs text-foreground/60 truncate">Selected: {imageFile.name}</p>
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

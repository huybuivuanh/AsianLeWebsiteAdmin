"use client";

import { useState, useEffect, useRef } from "react";
import { KitchenType } from "@/types/enum";
import type { DemoMenuItemInput } from "@/stores/demoMenuItemsStore";

type SoldOutOption = "in_stock" | "1h" | "2h" | "indefinite";

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
  const [availabilityStart, setAvailabilityStart] = useState("11:00");
  const [availabilityEnd, setAvailabilityEnd] = useState("14:00");
  const [soldOutOption, setSoldOutOption] = useState<SoldOutOption>("in_stock");
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
      setAvailabilityStart("11:00");
      setAvailabilityEnd("14:00");
      setSoldOutOption("in_stock");
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
        availability: restrictAvailability
          ? { start: availabilityStart, end: availabilityEnd }
          : undefined,
        soldOut:
          soldOutOption === "in_stock"
            ? undefined
            : soldOutOption === "indefinite"
              ? { since: new Date(), indefinite: true }
              : { since: new Date(), hours: soldOutOption === "1h" ? 1 : 2, indefinite: false },
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
              <span className="text-sm font-medium text-foreground">Restrict to a time window</span>
            </label>
            {restrictAvailability && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="add-di-avail-start" className="block text-xs text-foreground/60 mb-1">
                    Start
                  </label>
                  <input
                    id="add-di-avail-start"
                    type="time"
                    value={availabilityStart}
                    onChange={(e) => setAvailabilityStart(e.target.value)}
                    className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
                <div>
                  <label htmlFor="add-di-avail-end" className="block text-xs text-foreground/60 mb-1">
                    End
                  </label>
                  <input
                    id="add-di-avail-end"
                    type="time"
                    value={availabilityEnd}
                    onChange={(e) => setAvailabilityEnd(e.target.value)}
                    className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="add-di-sold-out" className="block text-sm font-medium text-foreground mb-1">
              Stock
            </label>
            <select
              id="add-di-sold-out"
              value={soldOutOption}
              onChange={(e) => setSoldOutOption(e.target.value as SoldOutOption)}
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              <option value="in_stock">In stock</option>
              <option value="1h">Sold out for 1 hour</option>
              <option value="2h">Sold out for 2 hours</option>
              <option value="indefinite">Sold out until I re-enable</option>
            </select>
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

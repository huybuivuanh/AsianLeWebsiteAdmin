"use client";

import { useState, useEffect, useRef } from "react";
import type { AddMenuItemInput } from "@/stores/menuItemsStore";

type AddMenuItemModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (input: AddMenuItemInput) => Promise<void>;
};

export function AddMenuItemModal({
  open,
  onClose,
  onAdd,
}: AddMenuItemModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setPriceInput("");
      setImageFile(null);
      setOptions([]);
      setFormError(null);
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  function addOption() {
    setOptions((prev) => [...prev, ""]);
  }

  function updateOption(index: number, value: string) {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function parsePrice(): number {
    const s = priceInput.trim();
    if (s === "") return 0;
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const optionsList = options.map((o) => o.trim()).filter(Boolean);
      await onAdd({
        name: trimmedName,
        description,
        price: parsePrice(),
        imageFile,
        options: optionsList.length ? optionsList : undefined,
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
      aria-labelledby="add-menu-item-title"
    >
      <div
        className="absolute inset-0"
        onClick={handleBackdropClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-xl bg-background border border-foreground/10 shadow-lg p-6 max-h-[90dvh] overflow-y-auto">
        <h2
          id="add-menu-item-title"
          className="text-lg font-semibold text-foreground mb-4"
        >
          Add Menu Item
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <p className="text-red-600 dark:text-red-400 text-sm" role="alert">
              {formError}
            </p>
          )}
          <div>
            <label
              htmlFor="menu-item-name"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="menu-item-name"
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
            <label
              htmlFor="menu-item-description"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Description
            </label>
            <textarea
              id="menu-item-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 resize-none"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label
              htmlFor="menu-item-price"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Price
            </label>
            <input
              id="menu-item-price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
            <p className="mt-1 text-xs text-foreground/50">
              Leave blank or enter 0 if no price.
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-medium text-foreground">
                Options
              </span>
              <button
                type="button"
                onClick={addOption}
                className="rounded-lg border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              >
                Add Option
              </button>
            </div>
            {options.length > 0 && (
              <ul className="space-y-2">
                {options.map((value, index) => (
                  <li key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder="e.g. medium, large"
                      className="flex-1 rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="shrink-0 rounded-lg border border-foreground/20 px-2 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none"
                      aria-label="Remove option"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label
              htmlFor="menu-item-image"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Image
            </label>
            <input
              ref={fileInputRef}
              id="menu-item-image"
              type="file"
              accept="image/*"
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

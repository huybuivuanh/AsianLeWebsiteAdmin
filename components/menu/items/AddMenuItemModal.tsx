"use client";

import { useState, useEffect, useRef } from "react";
import { KitchenType } from "@/types/enum";
import type { MenuItemInput } from "@/stores/menuItemsStore";
import { WeeklyAvailabilityEditor } from "@/components/menu/items/WeeklyAvailabilityEditor";
import { Modal } from "@/components/ui/Modal";
import {
  CheckboxField,
  Field,
  FormActions,
  FormError,
  Input,
  Select,
  Textarea,
  fileInputClass,
} from "@/components/ui/form";

type AddMenuItemModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (input: MenuItemInput) => Promise<void>;
};

export function AddMenuItemModal({ open, onClose, onAdd }: AddMenuItemModalProps) {
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

  return (
    <Modal open={open} onClose={onClose} busy={submitting} title="Add Menu Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={formError} />

        <Field label="Name" htmlFor="add-di-name" required>
          <Input
            id="add-di-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            placeholder="Item name"
          />
        </Field>

        <Field label="Description" htmlFor="add-di-description">
          <Textarea
            id="add-di-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional description"
          />
        </Field>

        <Field label="Price (CAD)" htmlFor="add-di-price">
          <Input
            id="add-di-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            placeholder="0.00"
          />
        </Field>

        <Field label="Kitchen Type" htmlFor="add-di-kitchen-type" required>
          <Select
            id="add-di-kitchen-type"
            value={kitchenType}
            onChange={(e) => setKitchenType(e.target.value as KitchenType)}
          >
            {Object.values(KitchenType).map((kt) => (
              <option key={kt} value={kt}>{kt}</option>
            ))}
          </Select>
        </Field>

        <div>
          <CheckboxField
            label="Restrict to a weekly schedule"
            checked={restrictAvailability}
            onChange={(e) => setRestrictAvailability(e.target.checked)}
          />
          {restrictAvailability && (
            <div className="mt-2">
              <WeeklyAvailabilityEditor value={availability} onChange={setAvailability} />
            </div>
          )}
        </div>

        <Field label="Image" htmlFor="add-di-image">
          <input
            ref={fileInputRef}
            id="add-di-image"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setImageFile(f && f.size > 0 ? f : null);
            }}
            className={fileInputClass}
          />
          {imageFile && (
            <p className="mt-1 text-xs text-foreground/60 truncate">Selected: {imageFile.name}</p>
          )}
        </Field>

        <FormActions onCancel={onClose} submitting={submitting} />
      </form>
    </Modal>
  );
}

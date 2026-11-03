"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
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

type EditMenuItemModalProps = {
  open: boolean;
  item: MenuItem | null;
  onClose: () => void;
  onSave: (id: string, input: MenuItemInput) => Promise<void>;
};

export function EditMenuItemModal({ open, item, onClose, onSave }: EditMenuItemModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [kitchenType, setKitchenType] = useState<KitchenType>(KitchenType.Other);
  const [restrictAvailability, setRestrictAvailability] = useState(false);
  const [availability, setAvailability] = useState<Availability>({});
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
      setKitchenType(item.kitchenType ?? KitchenType.Other);
      setRestrictAvailability(!!item.availability);
      setAvailability(item.availability ?? {});
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
      setRestrictAvailability(false);
      setAvailability({});
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
        availability: restrictAvailability ? availability : undefined,
      });
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!item) return null;

  return (
    <Modal open={open} onClose={onClose} busy={submitting} title="Edit Menu Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={formError} />

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

        <Field label="Name" htmlFor="edit-di-name" required>
          <Input
            id="edit-di-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </Field>

        <Field label="Description" htmlFor="edit-di-description">
          <Textarea
            id="edit-di-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional description"
          />
        </Field>

        <Field label="Price (CAD)" htmlFor="edit-di-price">
          <Input
            id="edit-di-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            placeholder="0.00"
          />
        </Field>

        <Field label="Kitchen Type" htmlFor="edit-di-kitchen-type" required>
          <Select
            id="edit-di-kitchen-type"
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

        <Field label="Image" htmlFor="edit-di-image">
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
            className={fileInputClass}
          />
          {imageFile && (
            <p className="mt-1 text-xs text-foreground/60 truncate">New: {imageFile.name}</p>
          )}
        </Field>

        <FormActions onCancel={onClose} submitting={submitting} />
      </form>
    </Modal>
  );
}

"use client";

import { useState, useEffect } from "react";
import { deleteField } from "firebase/firestore";
import { WeeklyAvailabilityEditor } from "@/components/menu/items/WeeklyAvailabilityEditor";
import { Modal } from "@/components/ui/Modal";
import { CheckboxField, Field, FormActions, FormError, Input } from "@/components/ui/form";

type EditOptionModalProps = {
  open: boolean;
  option: ItemOption | null;
  onClose: () => void;
  onSave: (id: string, data: Record<string, unknown>) => Promise<void>;
};

export function EditOptionModal({
  open,
  option,
  onClose,
  onSave,
}: EditOptionModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [restrictAvailability, setRestrictAvailability] = useState(false);
  const [availability, setAvailability] = useState<Availability>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open && option) {
      setName(option.name);
      setPrice(option.price.toString());
      setRestrictAvailability(!!option.availability);
      setAvailability(option.availability ?? {});
      setFormError(null);
      setSubmitting(false);
    }
    if (!open) {
      setName("");
      setPrice("");
      setRestrictAvailability(false);
      setAvailability({});
      setFormError(null);
      setSubmitting(false);
    }
  }, [open, option]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!option) return;
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError("Price must be a valid number ≥ 0.");
      return;
    }
    setSubmitting(true);
    try {
      await onSave(option.id, {
        name: name.trim(),
        price: parsedPrice,
        availability: restrictAvailability ? availability : deleteField(),
      });
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!option) return null;

  return (
    <Modal open={open} onClose={onClose} busy={submitting} title="Edit Option">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={formError} />
        <Field label="Name" htmlFor="edit-option-name" required>
          <Input
            id="edit-option-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </Field>
        <Field label="Price (CAD)" htmlFor="edit-option-price" required>
          <Input
            id="edit-option-price"
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
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
        <FormActions onCancel={onClose} submitting={submitting} />
      </form>
    </Modal>
  );
}

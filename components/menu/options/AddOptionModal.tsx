"use client";

import { useState, useEffect } from "react";
import { WeeklyAvailabilityEditor } from "@/components/menu/items/WeeklyAvailabilityEditor";
import { Modal } from "@/components/ui/Modal";
import { CheckboxField, Field, FormActions, FormError, Input } from "@/components/ui/form";

type AddOptionModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (data: Omit<ItemOption, "id" | "createdAt">) => Promise<string>;
};

export function AddOptionModal({ open, onClose, onAdd }: AddOptionModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [restrictAvailability, setRestrictAvailability] = useState(false);
  const [availability, setAvailability] = useState<Availability>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setPrice("");
      setRestrictAvailability(false);
      setAvailability({});
      setFormError(null);
      setSubmitting(false);
    }
  }, [open]);

  function parsePrice(): number {
    const s = price.trim();
    if (s === "") return 0;
    const n = parseFloat(s);
    return Number.isFinite(n) && n >= 0 ? n : 0;
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
      const data: Omit<ItemOption, "id" | "createdAt"> = { name: name.trim(), price: parsePrice() };
      if (restrictAvailability) data.availability = availability;
      await onAdd(data);
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} busy={submitting} title="Add Option">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={formError} />
        <Field label="Name" htmlFor="add-option-name" required>
          <Input
            id="add-option-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            placeholder="e.g. Extra Spicy"
          />
        </Field>
        <Field
          label="Price (CAD)"
          htmlFor="add-option-price"
          hint="Leave blank or enter 0 if no price."
        >
          <Input
            id="add-option-price"
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
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

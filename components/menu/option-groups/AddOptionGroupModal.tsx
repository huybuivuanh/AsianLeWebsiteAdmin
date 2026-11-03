"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { CheckboxField, Field, FormActions, FormError, Input } from "@/components/ui/form";

type AddOptionGroupModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (data: Omit<OptionGroup, "id" | "createdAt">) => Promise<string>;
};

export function AddOptionGroupModal({
  open,
  onClose,
  onAdd,
}: AddOptionGroupModalProps) {
  const [name, setName] = useState("");
  const [minSelection, setMinSelection] = useState(0);
  const [maxSelection, setMaxSelection] = useState(1);
  const [multipleOptionQuantity, setMultipleOptionQuantity] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setMinSelection(0);
      setMaxSelection(1);
      setMultipleOptionQuantity(false);
      setFormError(null);
      setSubmitting(false);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (minSelection < 0 || maxSelection < 1 || minSelection > maxSelection) {
      setFormError("Min must be ≥ 0, max must be ≥ 1, and min must be ≤ max.");
      return;
    }
    setSubmitting(true);
    try {
      await onAdd({ name: name.trim(), minSelection, maxSelection, multipleOptionQuantity });
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} busy={submitting} title="Add Option Group">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={formError} />
        <Field label="Name" htmlFor="add-og-name" required>
          <Input
            id="add-og-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            placeholder="e.g. Spice Level"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Min Selection" htmlFor="add-og-min">
            <Input
              id="add-og-min"
              type="number"
              min={0}
              value={minSelection}
              onChange={(e) => setMinSelection(Number(e.target.value))}
            />
          </Field>
          <Field label="Max Selection" htmlFor="add-og-max">
            <Input
              id="add-og-max"
              type="number"
              min={1}
              value={maxSelection}
              onChange={(e) => setMaxSelection(Number(e.target.value))}
            />
          </Field>
        </div>
        <CheckboxField
          label="Multiple option quantity"
          checked={multipleOptionQuantity}
          onChange={(e) => setMultipleOptionQuantity(e.target.checked)}
        />
        <p className="text-xs text-foreground/50 -mt-2 ml-7">
          Allow customers to add more than one of the same option.
        </p>
        <FormActions onCancel={onClose} submitting={submitting} />
      </form>
    </Modal>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, FormActions, FormError, Input, Textarea } from "@/components/ui/form";

type AddCategoryModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, description: string) => Promise<void>;
};

export function AddCategoryModal({
  open,
  onClose,
  onAdd,
}: AddCategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setFormError(null);
      setSubmitting(false);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await onAdd(trimmedName, description);
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} busy={submitting} title="Add Category">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={formError} />
        <Field label="Name" htmlFor="category-name" required>
          <Input
            id="category-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            placeholder="Category name"
          />
        </Field>
        <Field label="Description" htmlFor="category-description">
          <Textarea
            id="category-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional description"
          />
        </Field>
        <FormActions onCancel={onClose} submitting={submitting} />
      </form>
    </Modal>
  );
}

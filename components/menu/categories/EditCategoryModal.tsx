"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, FormActions, FormError, Input, Textarea } from "@/components/ui/form";

type EditCategoryModalProps = {
  open: boolean;
  category: FoodCategory | null;
  onClose: () => void;
  onSave: (id: string, name: string, description: string) => Promise<void>;
};

export function EditCategoryModal({
  open,
  category,
  onClose,
  onSave,
}: EditCategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open && category) {
      setName(category.name);
      setDescription(category.description ?? "");
      setFormError(null);
      setSubmitting(false);
    }
    if (!open) {
      setName("");
      setDescription("");
      setFormError(null);
      setSubmitting(false);
    }
  }, [open, category]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!category) return;
    setFormError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await onSave(category.id, trimmedName, description);
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!category) return null;

  return (
    <Modal open={open} onClose={onClose} busy={submitting} title="Edit Category">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={formError} />
        <Field label="Name" htmlFor="edit-category-name" required>
          <Input
            id="edit-category-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Category name"
          />
        </Field>
        <Field label="Description" htmlFor="edit-category-description">
          <Textarea
            id="edit-category-description"
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

"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, FormActions, FormError, Input } from "@/components/ui/form";
import { OptionsListEditor } from "@/components/daily-special/OptionsListEditor";

type EditSpecialItemModalProps = {
  open: boolean;
  item: DailySpecialItem | null;
  onClose: () => void;
  onSave: (
    id: string,
    name: string,
    price: number,
    options?: string[],
  ) => Promise<void>;
};

export function EditSpecialItemModal({
  open,
  item,
  onClose,
  onSave,
}: EditSpecialItemModalProps) {
  const [name, setName] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open && item) {
      setName(item.name);
      setPriceInput(
        item.price != null && item.price !== 0 ? String(item.price) : "",
      );
      setOptions(item.options?.length ? [...item.options] : []);
      setFormError(null);
      setSubmitting(false);
    }
    if (!open) {
      setName("");
      setPriceInput("");
      setOptions([]);
      setFormError(null);
      setSubmitting(false);
    }
  }, [open, item]);

  function parsePrice(): number {
    const s = priceInput.trim();
    if (s === "") return 0;
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!item) return;
    setFormError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Name is required.");
      return;
    }
    setSubmitting(true);
    try {
      const optionsList = options.map((o) => o.trim()).filter(Boolean);
      await onSave(item.id, trimmedName, parsePrice(), optionsList);
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!item) return null;

  return (
    <Modal open={open} onClose={onClose} busy={submitting} title="Edit Special Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={formError} />
        <Field label="Name" htmlFor="edit-special-item-name" required>
          <Input
            id="edit-special-item-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            placeholder="Item name"
          />
        </Field>
        <Field label="Price" htmlFor="edit-special-item-price">
          <Input
            id="edit-special-item-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
          />
        </Field>
        <OptionsListEditor value={options} onChange={setOptions} />
        <FormActions onCancel={onClose} submitting={submitting} />
      </form>
    </Modal>
  );
}

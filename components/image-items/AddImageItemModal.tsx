"use client";

import { useState, useEffect, useId, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, FormActions, FormError, Input, fileInputClass } from "@/components/ui/form";

type AddImageItemModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, imageFile: File) => Promise<void>;
  /** Example text for the display-name box, e.g. "e.g. Restaurant interior". */
  namePlaceholder?: string;
};

/** Upload form shared by the Gallery and Updates pages. */
export function AddImageItemModal({
  open,
  onClose,
  onAdd,
  namePlaceholder,
}: AddImageItemModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) {
      setDisplayName("");
      setImageFile(null);
      setFormError(null);
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open]);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setFormError("Display name is required.");
      return;
    }
    if (!imageFile || imageFile.size === 0) {
      setFormError("Please select an image to upload.");
      return;
    }
    setSubmitting(true);
    try {
      await onAdd(trimmedName, imageFile);
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} busy={submitting} title="Upload image">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={formError} />
        <Field label="Display Name" htmlFor={`${id}-name`} required>
          <Input
            id={`${id}-name`}
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            autoFocus
            placeholder={namePlaceholder}
          />
        </Field>
        <Field label="Image" htmlFor={`${id}-image`} required>
          <input
            ref={fileInputRef}
            id={`${id}-image`}
            type="file"
            accept="image/*"
            required
            onChange={(e) => {
              const f = e.target.files?.[0];
              setImageFile(f && f.size > 0 ? f : null);
            }}
            className={fileInputClass}
          />
          {imageFile && (
            <p className="mt-1 text-xs text-foreground/60 truncate">
              Selected: {imageFile.name}
            </p>
          )}
        </Field>
        <FormActions onCancel={onClose} submitting={submitting} />
      </form>
    </Modal>
  );
}

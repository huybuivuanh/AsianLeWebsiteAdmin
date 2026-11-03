"use client";

import { useState, useEffect, useId, useRef } from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Field, FormActions, FormError, Input, fileInputClass } from "@/components/ui/form";

type EditImageItemModalProps = {
  open: boolean;
  item: ImageItem | null;
  onClose: () => void;
  onSave: (id: string, name: string, imageFile: File | null) => Promise<void>;
  /** Example text for the display-name box, e.g. "e.g. Restaurant interior". */
  namePlaceholder?: string;
};

/** Edit form shared by the Gallery and Updates pages. */
export function EditImageItemModal({
  open,
  item,
  onClose,
  onSave,
  namePlaceholder,
}: EditImageItemModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    if (open && item) {
      setDisplayName(item.name);
      setImageFile(null);
      setFormError(null);
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    if (!open) {
      setDisplayName("");
      setImageFile(null);
      setFormError(null);
      setSubmitting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [open, item]);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!item) return;
    setFormError(null);
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setFormError("Display name is required.");
      return;
    }
    setSubmitting(true);
    try {
      await onSave(item.id ?? "", trimmedName, imageFile);
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!item) return null;

  return (
    <Modal open={open} onClose={onClose} busy={submitting} title="Edit image">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={formError} />
        {item.url && !imageFile && (
          <div className="flex items-center gap-3">
            <Image
              src={item.url}
              alt={item.name}
              width={64}
              height={64}
              sizes="64px"
              className="w-16 h-16 object-contain rounded-md bg-foreground/[0.04]"
            />
            <p className="text-xs text-foreground/60">
              Current image. Choose a file to replace it.
            </p>
          </div>
        )}
        {imageFile && (
          <p className="text-xs text-foreground/60 truncate">
            New image: {imageFile.name}
          </p>
        )}
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
        <Field label="Replace image (optional)" htmlFor={`${id}-image`}>
          <input
            ref={fileInputRef}
            id={`${id}-image`}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setImageFile(f && f.size > 0 ? f : null);
            }}
            className={fileInputClass}
          />
        </Field>
        <FormActions onCancel={onClose} submitting={submitting} />
      </form>
    </Modal>
  );
}

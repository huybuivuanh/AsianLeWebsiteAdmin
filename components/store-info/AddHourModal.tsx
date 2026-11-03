"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, FormActions, FormError, Input } from "@/components/ui/form";

type AddHourModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (days: string, time: string) => Promise<void>;
};

export function AddHourModal({ open, onClose, onAdd }: AddHourModalProps) {
  const [days, setDays] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDays("");
      setTime("");
      setFormError(null);
      setSubmitting(false);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!days.trim()) {
      setFormError("Days is required.");
      return;
    }
    if (!time.trim()) {
      setFormError("Time is required.");
      return;
    }
    setSubmitting(true);
    try {
      await onAdd(days, time);
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} busy={submitting} title="Add Hours">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={formError} />
        <Field label="Days" htmlFor="add-hour-days" required>
          <Input
            id="add-hour-days"
            type="text"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            required
            autoFocus
            placeholder="e.g. Monday – Saturday"
          />
        </Field>
        <Field label="Time" htmlFor="add-hour-time" required>
          <Input
            id="add-hour-time"
            type="text"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            placeholder="e.g. 11:00 AM – 8:00 PM or Closed"
          />
        </Field>
        <FormActions onCancel={onClose} submitting={submitting} />
      </form>
    </Modal>
  );
}

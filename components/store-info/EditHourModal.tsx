"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Field, FormActions, FormError, Input } from "@/components/ui/form";

type EditHourModalProps = {
  open: boolean;
  hour: StoreHour | null;
  onClose: () => void;
  onSave: (id: string, days: string, time: string) => Promise<void>;
};

export function EditHourModal({
  open,
  hour,
  onClose,
  onSave,
}: EditHourModalProps) {
  const [days, setDays] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open && hour) {
      setDays(hour.days);
      setTime(hour.time);
      setFormError(null);
      setSubmitting(false);
    }
    if (!open) {
      setDays("");
      setTime("");
      setFormError(null);
      setSubmitting(false);
    }
  }, [open, hour]);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!hour) return;
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
      await onSave(hour.id, days, time);
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hour) return null;

  return (
    <Modal open={open} onClose={onClose} busy={submitting} title="Edit Hours">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={formError} />
        <Field label="Days" htmlFor="edit-hour-days" required>
          <Input
            id="edit-hour-days"
            type="text"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            required
            autoFocus
            placeholder="e.g. Monday – Saturday"
          />
        </Field>
        <Field label="Time" htmlFor="edit-hour-time" required>
          <Input
            id="edit-hour-time"
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

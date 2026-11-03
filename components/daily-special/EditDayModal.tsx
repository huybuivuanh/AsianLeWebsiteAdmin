"use client";

import { useState, useEffect } from "react";
import { DayOfWeek } from "@/types/enum";
import { formatDayOfWeekLabel } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Field, FormActions, FormError, Input, Select } from "@/components/ui/form";

const DAY_OPTIONS = Object.values(DayOfWeek);

type EditDayModalProps = {
  open: boolean;
  item: DailySpecial | null;
  onClose: () => void;
  onSave: (
    id: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
  ) => Promise<void>;
};

export function EditDayModal({
  open,
  item,
  onClose,
  onSave,
}: EditDayModalProps) {
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(DayOfWeek.MONDAY);
  const [startTime, setStartTime] = useState("11:00");
  const [endTime, setEndTime] = useState("14:00");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open && item) {
      setDayOfWeek(item.dayOfWeek);
      setStartTime(item.timeRange.startTime);
      setEndTime(item.timeRange.endTime);
      setFormError(null);
      setSubmitting(false);
    }
    if (!open) {
      setDayOfWeek(DayOfWeek.MONDAY);
      setStartTime("11:00");
      setEndTime("14:00");
      setFormError(null);
      setSubmitting(false);
    }
  }, [open, item?.id]);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!item) return;
    setFormError(null);
    if (startTime >= endTime) {
      setFormError("End time must be after start time.");
      return;
    }
    setSubmitting(true);
    try {
      await onSave(item.id, dayOfWeek, startTime, endTime);
      onClose();
    } catch {
      setFormError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!item) return null;

  return (
    <Modal open={open} onClose={onClose} busy={submitting} title="Edit Day">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormError message={formError} />
        <Field label="Day of week" htmlFor="edit-day-of-week" required>
          <Select
            id="edit-day-of-week"
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
            required
          >
            {DAY_OPTIONS.map((day) => (
              <option key={day} value={day}>
                {formatDayOfWeekLabel(day)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Start time" htmlFor="edit-start-time" required>
          <Input
            id="edit-start-time"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </Field>
        <Field label="End time" htmlFor="edit-end-time" required>
          <Input
            id="edit-end-time"
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </Field>
        <FormActions onCancel={onClose} submitting={submitting} />
      </form>
    </Modal>
  );
}

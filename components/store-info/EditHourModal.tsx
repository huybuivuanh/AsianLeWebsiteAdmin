"use client";

import { useState, useEffect } from "react";

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

  function handleBackdropClose() {
    if (!submitting) onClose();
  }

  if (!open || !hour) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="edit-hour-title"
    >
      <div
        className="absolute inset-0"
        onClick={handleBackdropClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-xl bg-background border border-foreground/10 shadow-lg p-6">
        <h2
          id="edit-hour-title"
          className="text-lg font-semibold text-foreground mb-4"
        >
          Edit Hours
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <p className="text-red-600 dark:text-red-400 text-sm" role="alert">
              {formError}
            </p>
          )}
          <div>
            <label
              htmlFor="edit-hour-days"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Days <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-hour-days"
              type="text"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="e.g. Monday – Saturday"
            />
          </div>
          <div>
            <label
              htmlFor="edit-hour-time"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Time <span className="text-red-500">*</span>
            </label>
            <input
              id="edit-hour-time"
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="e.g. 11:00 AM – 8:00 PM or Closed"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={handleBackdropClose}
              disabled={submitting}
              className="rounded-lg border border-foreground/20 px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

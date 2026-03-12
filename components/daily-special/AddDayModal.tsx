"use client";

import { useState, useEffect } from "react";
import { DayOfWeek } from "@/types/enum";

function dayLabel(value: DayOfWeek): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

const DAY_OPTIONS = Object.values(DayOfWeek);

type AddDayModalProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
  ) => Promise<void>;
};

export function AddDayModal({ open, onClose, onAdd }: AddDayModalProps) {
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(DayOfWeek.MONDAY);
  const [startTime, setStartTime] = useState("11:00");
  const [endTime, setEndTime] = useState("14:00");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDayOfWeek(DayOfWeek.MONDAY);
      setStartTime("11:00");
      setEndTime("14:00");
      setFormError(null);
      setSubmitting(false);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (startTime >= endTime) {
      setFormError("End time must be after start time.");
      return;
    }
    setSubmitting(true);
    try {
      await onAdd(dayOfWeek, startTime, endTime);
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="add-day-title"
    >
      <div
        className="absolute inset-0"
        onClick={handleBackdropClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-xl bg-background border border-foreground/10 shadow-lg p-6">
        <h2
          id="add-day-title"
          className="text-lg font-semibold text-foreground mb-4"
        >
          Add Day
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <p className="text-red-600 dark:text-red-400 text-sm" role="alert">
              {formError}
            </p>
          )}
          <div>
            <label
              htmlFor="add-day-of-week"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Day of week <span className="text-red-500">*</span>
            </label>
            <select
              id="add-day-of-week"
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
              required
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              {DAY_OPTIONS.map((day) => (
                <option key={day} value={day as DayOfWeek}>
                  {dayLabel(day)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="add-start-time"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Start time <span className="text-red-500">*</span>
            </label>
            <input
              id="add-start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div>
            <label
              htmlFor="add-end-time"
              className="block text-sm font-medium text-foreground mb-1"
            >
              End time <span className="text-red-500">*</span>
            </label>
            <input
              id="add-end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
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

"use client";

import { useState, useEffect, useMemo } from "react";
import { useSpecialItemsStore } from "@/stores/dailySpecialItemsStore";
import { formatTimeToHHMM } from "@/stores/dailySpecialsStore";
import type { DayOfWeek } from "@/types/enum";

function dayLabel(value: DayOfWeek): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

type AddDayItemsModalProps = {
  open: boolean;
  schedule: DailySpecial | null;
  onClose: () => void;
  onSave: (scheduleId: string, itemIds: string[]) => Promise<void>;
};

export function AddDayItemsModal({
  open,
  schedule,
  onClose,
  onSave,
}: AddDayItemsModalProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { items: specialItems } = useSpecialItemsStore();

  useEffect(() => {
    if (open && schedule) {
      setSelectedIds(schedule.itemIds ?? []);
      setSearch("");
      setFormError(null);
      setSubmitting(false);
    }
    if (!open) {
      setSearch("");
      setSelectedIds([]);
      setFormError(null);
      setSubmitting(false);
    }
  }, [open, schedule]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return specialItems;
    return specialItems.filter((m) => m.name.toLowerCase().includes(q));
  }, [specialItems, search]);

  function toggleItem(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!schedule) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await onSave(schedule.id, selectedIds);
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

  if (!open || !schedule) return null;

  const title = `${dayLabel(schedule.dayOfWeek)} (${formatTimeToHHMM(schedule.timeRange.startTime)} – ${formatTimeToHHMM(schedule.timeRange.endTime)})`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="add-day-items-title"
    >
      <div
        className="absolute inset-0"
        onClick={handleBackdropClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md max-h-[85dvh] flex flex-col rounded-xl bg-background border border-foreground/10 shadow-lg">
        <div className="p-4 border-b border-foreground/10 flex items-center justify-between gap-4 shrink-0">
          <h2
            id="add-day-items-title"
            className="text-lg font-semibold text-foreground truncate"
          >
            Add Items to {title}
          </h2>
          <button
            type="button"
            onClick={handleBackdropClose}
            className="shrink-0 rounded p-1 text-foreground/70 hover:bg-foreground/10 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 pb-2 shrink-0">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full rounded-lg border border-foreground/20 bg-background px-3 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              aria-label="Search items"
            />
          </div>

          <div className="flex-1 overflow-y-auto px-4 min-h-0">
            {formError && (
              <p
                className="text-red-600 dark:text-red-400 text-sm mb-2"
                role="alert"
              >
                {formError}
              </p>
            )}
            {filteredItems.length === 0 ? (
              <p className="text-sm text-foreground/60 py-4">
                {search.trim()
                  ? "No items match your search."
                  : "No special items yet."}
              </p>
            ) : (
              <ul className="space-y-0 py-2">
                {filteredItems.map((item) => (
                  <li key={item.id}>
                    <label className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-foreground/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleItem(item.id)}
                        className="rounded border-foreground/30 text-foreground focus:ring-foreground/20"
                      />
                      <span className="text-sm text-foreground truncate flex-1 min-w-0">
                        {item.name}
                        <span className="text-foreground/60 ml-1">
                          ${item.price.toFixed(2)}
                        </span>
                        {item.options && item.options.length > 0 && (
                          <span className="text-foreground/50 text-xs ml-1">
                            ({item.options.join(", ")})
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-4 border-t border-foreground/10 flex justify-end shrink-0">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save Selection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

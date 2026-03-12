"use client";

import { useState } from "react";
import {
  useDailySpecialsStore,
  formatTimeToHHMM,
} from "@/stores/dailySpecialsStore";
import { AddDayModal } from "@/components/daily-special/AddDayModal";
import type { DayOfWeek } from "@/types/enum";

function dayLabel(value: DayOfWeek): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export default function DayOfWeekPage() {
  const { dailySpecials, loading, error, addDailySpecial } =
    useDailySpecialsStore();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Day Of Week
        </h1>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        >
          Add Day
        </button>
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-foreground/60 text-sm">Loading…</p>
      ) : dailySpecials.length === 0 ? (
        <p className="text-foreground/70 text-sm sm:text-base">
          No days configured. Add a day and time range to get started.
        </p>
      ) : (
        <ul className="space-y-2">
          {dailySpecials.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-foreground/10 bg-foreground/[0.02] px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1"
            >
              <span className="font-medium text-foreground">
                {dayLabel(s.dayOfWeek)}
              </span>
              <span className="text-foreground/70 text-sm">
                {formatTimeToHHMM(s.timeRange.startTime)} –{" "}
                {formatTimeToHHMM(s.timeRange.endTime)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <AddDayModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={addDailySpecial}
      />
    </div>
  );
}

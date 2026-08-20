"use client";

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

const DAY_LABELS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const DEFAULT_RANGE: TimeRange = { startTime: "11:00", endTime: "14:00" };

type WeeklyAvailabilityEditorProps = {
  value: Availability;
  onChange: (value: Availability) => void;
};

export function WeeklyAvailabilityEditor({ value, onChange }: WeeklyAvailabilityEditorProps) {
  function toggleDay(key: DayKey, enabled: boolean) {
    if (enabled) {
      onChange({ ...value, [key]: { ...DEFAULT_RANGE } });
    } else {
      const next = { ...value };
      delete next[key];
      onChange(next);
    }
  }

  function updateDay(key: DayKey, patch: Partial<TimeRange>) {
    const current = value[key];
    if (!current) return;
    onChange({ ...value, [key]: { ...current, ...patch } });
  }

  return (
    <div className="rounded-xl border border-foreground/10 overflow-hidden">
      {DAY_LABELS.map(({ key, label }, i) => {
        const range = value[key];
        return (
          <div
            key={key}
            className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-foreground/8" : ""} ${!range ? "bg-foreground/[0.015]" : ""}`}
          >
            <span className={`w-24 shrink-0 text-sm font-medium ${range ? "text-foreground" : "text-foreground/35"}`}>
              {label}
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={!!range}
              onClick={() => toggleDay(key, !range)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/20 ${
                range ? "bg-green-500" : "bg-foreground/20"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  range ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>

            {range ? (
              <div className="flex items-center gap-2 ml-auto">
                <input
                  type="time"
                  value={range.startTime}
                  onChange={(e) => updateDay(key, { startTime: e.target.value })}
                  className="rounded-lg border border-foreground/15 bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
                <span className="text-xs text-foreground/40">to</span>
                <input
                  type="time"
                  value={range.endTime}
                  onChange={(e) => updateDay(key, { endTime: e.target.value })}
                  className="rounded-lg border border-foreground/15 bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>
            ) : (
              <span className="ml-auto text-sm text-foreground/30">Not available</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

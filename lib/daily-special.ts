import { DayOfWeek } from "@/types/enum";
import { formatTimeHHmmTo12h } from "@/lib/utils";

/** Monday first, Sunday last — the order staff read the week in. */
export const WEEK_ORDER: DayOfWeek[] = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

/** "MONDAY" → "Monday" */
export function dayLabel(value: DayOfWeek): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

/** "MONDAY" → "Mon" */
export function shortDayLabel(value: DayOfWeek): string {
  return dayLabel(value).slice(0, 3);
}

/** { "11:00", "14:00" } → "11:00 AM – 2:00 PM" */
export function formatTimeRange(range: TimeRange): string {
  return `${formatTimeHHmmTo12h(range.startTime)} – ${formatTimeHHmmTo12h(range.endTime)}`;
}

/** Weekday order, then start time ("HH:mm" strings compare correctly as text). */
export function compareDailySpecials(a: DailySpecial, b: DailySpecial): number {
  return (
    WEEK_ORDER.indexOf(a.dayOfWeek) - WEEK_ORDER.indexOf(b.dayOfWeek) ||
    a.timeRange.startTime.localeCompare(b.timeRange.startTime)
  );
}

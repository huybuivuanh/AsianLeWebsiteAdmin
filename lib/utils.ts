export function formatPriceCAD(price: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(price);
}

/** Format "11:00" / "14:00" style string to "11:00 AM" / "2:00 PM" */
export function formatTimeHHmmTo12h(timeStr: string): string {
  if (!timeStr || typeof timeStr !== "string") return "";
  const [h, m] = timeStr.trim().split(":").map(Number);
  if (Number.isNaN(h)) return timeStr;
  const hours = h % 24;
  const mins = Number.isNaN(m) ? 0 : m % 60;
  const period = hours < 12 ? "AM" : "PM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${mins.toString().padStart(2, "0")} ${period}`;
}

const AVAILABILITY_DAY_ORDER: { key: keyof Availability; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

/** { mon: {startTime, endTime}, ... } -> "Mon 11:00 AM–2:00 PM, Tue 2:00 PM–8:00 PM" */
export function formatWeeklyAvailability(availability: Availability): string {
  return AVAILABILITY_DAY_ORDER.filter(({ key }) => availability[key])
    .map(({ key, label }) => {
      const range = availability[key]!;
      return `${label} ${formatTimeHHmmTo12h(range.startTime)}–${formatTimeHHmmTo12h(range.endTime)}`;
    })
    .join(", ");
}

/** An Availability object with no days configured means unavailable every day. */
export function hasNoAvailableDays(availability: Availability): boolean {
  return AVAILABILITY_DAY_ORDER.every(({ key }) => !availability[key]);
}

/** "MONDAY" -> "Monday" */
export function formatDayOfWeekLabel(day: string): string {
  if (!day) return "";
  return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
}

/** "3061234567" / "(306) 123-4567" -> "(306) 123-4567" */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length !== 10) return phone;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function formatOrderedAt(date: Date): string {
  return date.toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function matchesQuery(q: string, ...fields: string[]): boolean {
  if (!q.trim()) return true;
  const term = q.trim().toLowerCase();
  return fields.some((f) => f.toLowerCase().includes(term));
}

/**
 * Returns a new array sorted alphabetically by a key.
 * Defaults to case-insensitive comparison with numeric sorting.
 */
export function sortAlphabetically<T>(
  list: readonly T[],
  getKey: (item: T) => string,
  locale: string = "en",
): T[] {
  return [...list].sort((a, b) =>
    getKey(a).localeCompare(getKey(b), locale, {
      sensitivity: "base",
      numeric: true,
    }),
  );
}

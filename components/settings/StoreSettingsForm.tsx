"use client";

import { useState, useEffect, useRef } from "react";
import { DEFAULT_RESERVATION_DAY, useStoreSettingsStore } from "@/stores/storeSettingsStore";
import { dateToLocalKey } from "@/lib/orders-firestore";
import {
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/menu/MenuPageHeader";
import { RemoveButton } from "@/components/menu/RowParts";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type HolidayStatus = "upcoming" | "now" | "past";

const CANADA_TIMEZONES = [
  { value: "America/Vancouver", label: "Pacific Time — Vancouver, Victoria" },
  { value: "America/Edmonton", label: "Mountain Time — Edmonton, Calgary" },
  { value: "America/Regina", label: "Central Time (no DST) — Regina, Saskatoon" },
  { value: "America/Winnipeg", label: "Central Time — Winnipeg" },
  { value: "America/Toronto", label: "Eastern Time — Toronto, Ottawa" },
  { value: "America/Halifax", label: "Atlantic Time — Halifax, Moncton" },
  { value: "America/St_Johns", label: "Newfoundland Time — St. John's" },
] as const;

const DAY_LABELS: { key: DayKey; label: string }[] = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

function formatDateDisplay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Strips a typed phone value down to at most 10 digits. Since the input's displayed
 * value always carries a literal "+1 " prefix, that has to be dropped first — otherwise
 * its "1" gets miscounted as a digit the user typed on every keystroke. Once 10 digits
 * are present, further typing is simply ignored (capped, not shifted) — dropping a
 * "country code" digit here would be wrong whenever the real number happens to start
 * with 1. Use {@link extractTenDigitPhoneFromPaste} for pasted values instead. */
function extractTenDigitPhone(raw: string): string {
  const withoutPrefix = raw.startsWith("+1") ? raw.slice(2) : raw;
  return withoutPrefix.replace(/\D/g, "").slice(0, 10);
}

/** Strips a leading "1" country code from a pasted full number (e.g. pasting
 * "+1 234-567-8901" or "12345678901"), then caps at 10 digits. */
function extractTenDigitPhoneFromPaste(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("1")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

/** Formats up to 10 NANP digits as "+1 (306) 764-7799", growing as digits are typed. */
function formatNanpPhone(digits: string): string {
  if (digits.length === 0) return "+1 ";
  if (digits.length <= 3) return `+1 (${digits}`;
  if (digits.length <= 6) return `+1 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}


/** One row per weekday: on/off switch + from/to times. Shared by Store Hours and
 * Reservation Hours. */
function WeeklyHoursRows({
  hours,
  onChange,
  toLabel = "to",
  closedLabel = "Closed",
}: {
  hours: WeeklyHours;
  onChange: (key: DayKey, patch: Partial<DayHours>) => void;
  toLabel?: string;
  closedLabel?: string;
}) {
  return (
    <>
      {DAY_LABELS.map(({ key, label }, i) => {
        const day = hours[key];
        return (
          <div
            key={key}
            className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 ${i > 0 ? "border-t border-foreground/8" : ""} ${!day.isOpen ? "bg-foreground/[0.015]" : ""}`}
          >
            <span className={`w-24 shrink-0 text-sm font-medium ${day.isOpen ? "text-foreground" : "text-foreground/35"}`}>
              {label}
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={day.isOpen}
              aria-label={label}
              onClick={() => onChange(key, { isOpen: !day.isOpen })}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-foreground/20 ${
                day.isOpen ? "bg-green-500" : "bg-foreground/20"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  day.isOpen ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>

            {day.isOpen ? (
              <div className="flex flex-wrap items-center justify-end gap-2 ml-auto">
                <input
                  type="time"
                  value={day.open}
                  onChange={(e) => onChange(key, { open: e.target.value })}
                  className="rounded-lg border border-foreground/15 bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
                <span className="text-xs text-foreground/40">{toLabel}</span>
                <input
                  type="time"
                  value={day.close}
                  onChange={(e) => onChange(key, { close: e.target.value })}
                  className="rounded-lg border border-foreground/15 bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>
            ) : (
              <span className="ml-auto text-sm text-foreground/30">{closedLabel}</span>
            )}
          </div>
        );
      })}
    </>
  );
}

const inputClass =
  "rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20";

/** One white card per settings section. */
function SettingsCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  /** Optional button on the right of the title. */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-foreground/10 bg-background">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-foreground/60">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

/** Card footer: error on the left, "Unsaved changes" + Save on the right. */
function SaveFooter({
  error,
  dirty,
  saving,
  label,
}: {
  error: string | null;
  dirty: boolean;
  saving: boolean;
  label: string;
}) {
  return (
    <div className="-mx-4 -mb-4 mt-4 flex flex-wrap items-center justify-end gap-3 rounded-b-xl border-t border-foreground/10 bg-foreground/[0.02] px-4 py-3 sm:-mx-5 sm:px-5">
      {error && (
        <p className="mr-auto text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {dirty && !saving && (
        <span className="text-sm text-foreground/50">Unsaved changes</span>
      )}
      <button
        type="submit"
        disabled={saving || !dirty}
        className={`${primaryButtonClass} disabled:opacity-50`}
      >
        {saving ? "Saving…" : label}
      </button>
    </div>
  );
}

/** Reservation hours to edit: the saved ones or, if never saved, 1 PM to 8 PM on the days
 * the store is open. */
function initialReservationHours(settings: StoreSettings): WeeklyHours {
  if (settings.reservationHours) return structuredClone(settings.reservationHours);
  const result = {} as WeeklyHours;
  for (const { key } of DAY_LABELS) {
    result[key] = { ...DEFAULT_RESERVATION_DAY, isOpen: settings.hours[key]?.isOpen ?? false };
  }
  return result;
}

export function StoreSettingsForm() {
  // Settings are loaded once at login (AuthContext), so no fetch here.
  const { settings, loading, error, updateSettings } = useStoreSettingsStore();

  const [editedTimezone, setEditedTimezone] = useState(
    () => settings?.timezone ?? "",
  );
  const [editedHours, setEditedHours] = useState<WeeklyHours | null>(
    () => (settings ? structuredClone(settings.hours) : null),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const hasHoursChanges =
    editedTimezone !== (settings?.timezone ?? "") ||
    JSON.stringify(editedHours) !== JSON.stringify(settings?.hours ?? null);

  const [editedReservationHours, setEditedReservationHours] = useState<WeeklyHours | null>(
    () => (settings ? initialReservationHours(settings) : null),
  );
  const [savingReservationHours, setSavingReservationHours] = useState(false);
  const [reservationHoursError, setReservationHoursError] = useState<string | null>(null);

  const hasReservationHoursChanges =
    JSON.stringify(editedReservationHours) !==
    JSON.stringify(settings?.reservationHours ?? null);

  const [editedWaitTime, setEditedWaitTime] = useState(
    () => settings?.waitTime ?? 0,
  );
  const [savingWaitTime, setSavingWaitTime] = useState(false);
  const [waitTimeError, setWaitTimeError] = useState<string | null>(null);

  const hasWaitTimeChanges = editedWaitTime !== (settings?.waitTime ?? 0);

  const [editedRestaurantPhone, setEditedRestaurantPhone] = useState(
    () => extractTenDigitPhone(settings?.restaurantPhoneNumber ?? ""),
  );
  const [savingRestaurantPhone, setSavingRestaurantPhone] = useState(false);
  const [restaurantPhoneError, setRestaurantPhoneError] = useState<string | null>(null);

  const hasRestaurantPhoneChanges =
    editedRestaurantPhone !== extractTenDigitPhone(settings?.restaurantPhoneNumber ?? "");

  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [holidayFrom, setHolidayFrom] = useState("");
  const [holidayTo, setHolidayTo] = useState("");
  const [addingHoliday, setAddingHoliday] = useState(false);
  const [deletingHolidayId, setDeletingHolidayId] = useState<string | null>(null);
  const [holidayError, setHolidayError] = useState<string | null>(null);

  // Fill the form from the saved settings once, when they first arrive. Not on every
  // re-fetch: saving one section re-fetches, and that must not wipe unsaved edits in
  // the other sections (the saved section already matches what was saved).
  const filledFromSettings = useRef(settings != null);
  useEffect(() => {
    if (!settings || filledFromSettings.current) return;
    filledFromSettings.current = true;
    setEditedTimezone(settings.timezone);
    setEditedHours(structuredClone(settings.hours));
    setEditedReservationHours(initialReservationHours(settings));
    setEditedWaitTime(settings.waitTime ?? 0);
    setEditedRestaurantPhone(extractTenDigitPhone(settings.restaurantPhoneNumber ?? ""));
  }, [settings]);

  function updateDay(key: DayKey, patch: Partial<DayHours>) {
    setEditedHours((prev) => {
      const base = prev ?? (settings ? structuredClone(settings.hours) : null);
      if (!base) return prev;
      return { ...base, [key]: { ...base[key], ...patch } };
    });
  }

  async function handleSaveHours(e: React.FormEvent) {
    e.preventDefault();
    if (!editedHours) return;
    const badDay = DAY_LABELS.find(({ key }) => {
      const day = editedHours[key];
      return day.isOpen && (!day.open || !day.close || day.open >= day.close);
    });
    if (badDay) {
      setSaveError(`${badDay.label}: the opening time must be before the closing time.`);
      return;
    }
    setSaveError(null);
    setSaving(true);
    try {
      await updateSettings({ hours: editedHours, timezone: editedTimezone.trim() });
    } catch {
      setSaveError("Failed to save hours.");
    } finally {
      setSaving(false);
    }
  }

  function updateReservationDay(key: DayKey, patch: Partial<DayHours>) {
    setEditedReservationHours((prev) =>
      prev ? { ...prev, [key]: { ...prev[key], ...patch } } : prev,
    );
  }

  async function handleSaveReservationHours(e: React.FormEvent) {
    e.preventDefault();
    if (!editedReservationHours) return;
    const badDay = DAY_LABELS.find(({ key }) => {
      const day = editedReservationHours[key];
      return day.isOpen && (!day.open || !day.close || day.open > day.close);
    });
    if (badDay) {
      setReservationHoursError(
        `${badDay.label}: the first booking time must be before the last booking time.`,
      );
      return;
    }
    setReservationHoursError(null);
    setSavingReservationHours(true);
    try {
      await updateSettings({ reservationHours: editedReservationHours });
    } catch {
      setReservationHoursError("Failed to save reservation hours.");
    } finally {
      setSavingReservationHours(false);
    }
  }

  async function handleSaveWaitTime(e: React.FormEvent) {
    e.preventDefault();
    setWaitTimeError(null);
    setSavingWaitTime(true);
    try {
      await updateSettings({ waitTime: editedWaitTime });
    } catch {
      setWaitTimeError("Failed to save wait time.");
    } finally {
      setSavingWaitTime(false);
    }
  }

  async function handleSaveRestaurantPhone(e: React.FormEvent) {
    e.preventDefault();
    if (editedRestaurantPhone.length !== 10) {
      setRestaurantPhoneError("Enter a complete 10-digit phone number, e.g. +1 (306) 764-7799.");
      return;
    }
    setRestaurantPhoneError(null);
    setSavingRestaurantPhone(true);
    try {
      await updateSettings({ restaurantPhoneNumber: `+1${editedRestaurantPhone}` });
    } catch {
      setRestaurantPhoneError("Failed to save restaurant phone number.");
    } finally {
      setSavingRestaurantPhone(false);
    }
  }

  async function handleAddHoliday(e: React.FormEvent) {
    e.preventDefault();
    if (!settings || !holidayFrom) return;
    if (holidayTo && holidayTo < holidayFrom) {
      setHolidayError('"To" date cannot be before "From" date.');
      return;
    }
    setHolidayError(null);
    setAddingHoliday(true);
    try {
      const newHoliday: Holiday = {
        id: crypto.randomUUID(),
        from: holidayFrom,
        ...(holidayTo ? { to: holidayTo } : {}),
      };
      await updateSettings({ holidays: [...(settings.holidays ?? []), newHoliday] });
      setHolidayFrom("");
      setHolidayTo("");
      setShowHolidayForm(false);
    } catch {
      setHolidayError("Failed to add holiday.");
    } finally {
      setAddingHoliday(false);
    }
  }

  async function handleDeleteHoliday(id: string) {
    if (!settings) return;
    setDeletingHolidayId(id);
    setHolidayError(null);
    try {
      await updateSettings({
        holidays: (settings.holidays ?? []).filter((h) => h.id !== id),
      });
    } catch {
      setHolidayError("Couldn't remove the holiday. Try again.");
    } finally {
      setDeletingHolidayId(null);
    }
  }

  // Only before the first load: once settings exist, a re-fetch or a failed save keeps
  // the form on screen (save errors show next to each section's Save button).
  if (!settings && loading) {
    return <p className="text-foreground/50 text-sm">Loading settings…</p>;
  }

  if (!settings && error) {
    return <p className="text-red-500 text-sm" role="alert">{error}</p>;
  }

  if (!settings || !editedHours || !editedReservationHours) {
    return <p className="text-foreground/50 text-sm">No settings found.</p>;
  }

  // Upcoming (and current) holidays first, soonest first; past ones after, most
  // recent first. "YYYY-MM-DD" strings compare correctly as text.
  const todayKey = dateToLocalKey(new Date());
  const holidays = (settings.holidays ?? [])
    .map((h) => {
      const end = h.to ?? h.from;
      const status: HolidayStatus =
        end < todayKey ? "past" : h.from <= todayKey ? "now" : "upcoming";
      return { ...h, status };
    })
    .sort((a, b) => {
      if ((a.status === "past") !== (b.status === "past")) {
        return a.status === "past" ? 1 : -1;
      }
      return a.status === "past"
        ? b.from.localeCompare(a.from)
        : a.from.localeCompare(b.from);
    });

  return (
    <div className="max-w-2xl space-y-4">
      {/* Store hours */}
      <SettingsCard
        title="Store hours"
        description="When customers can place online orders."
      >
        <form onSubmit={handleSaveHours}>
          <label className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="w-24 shrink-0 text-sm text-foreground/60">Timezone</span>
            <select
              id="settings-timezone"
              value={editedTimezone}
              onChange={(e) => setEditedTimezone(e.target.value)}
              className={`${inputClass} min-w-0 flex-1`}
            >
              {CANADA_TIMEZONES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <div className="overflow-hidden rounded-lg border border-foreground/10">
            <WeeklyHoursRows hours={editedHours} onChange={updateDay} />
          </div>
          <SaveFooter
            error={saveError}
            dirty={hasHoursChanges}
            saving={saving}
            label="Save hours"
          />
        </form>
      </SettingsCard>

      {/* Reservation hours */}
      <SettingsCard
        title="Reservation hours"
        description="When customers can book a table on the website, from the first booking time to the last. Holidays and Pause Online Ordering also stop reservations."
      >
        {!settings.reservationHours && (
          <p className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Not saved yet. These are suggested hours; press Save reservation hours to use them.
          </p>
        )}
        <form onSubmit={handleSaveReservationHours}>
          <div className="overflow-hidden rounded-lg border border-foreground/10">
            <WeeklyHoursRows
              hours={editedReservationHours}
              onChange={updateReservationDay}
              toLabel="last booking"
              closedLabel="No reservations"
            />
          </div>
          <SaveFooter
            error={reservationHoursError}
            dirty={hasReservationHoursChanges}
            saving={savingReservationHours}
            label="Save reservation hours"
          />
        </form>
      </SettingsCard>

      {/* Wait time */}
      <SettingsCard
        title="Order wait time"
        description="Shown at checkout as &ldquo;Ready in about … min&rdquo; for ASAP orders."
      >
        <form onSubmit={handleSaveWaitTime}>
          <label className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm text-foreground/60">Wait time</span>
            <input
              type="number"
              min={0}
              step={1}
              value={editedWaitTime}
              onChange={(e) => setEditedWaitTime(Math.max(0, Number(e.target.value)))}
              className={`${inputClass} w-28`}
            />
            <span className="text-sm text-foreground/50">minutes</span>
          </label>
          <SaveFooter
            error={waitTimeError}
            dirty={hasWaitTimeChanges}
            saving={savingWaitTime}
            label="Save wait time"
          />
        </form>
      </SettingsCard>

      {/* Restaurant phone (confirmation-call alert) */}
      <SettingsCard
        title="Restaurant phone"
        description="Called automatically if a new order sits unconfirmed for 15 seconds."
      >
        <form onSubmit={handleSaveRestaurantPhone}>
          <label className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="w-24 shrink-0 text-sm text-foreground/60">Phone number</span>
            <input
              type="tel"
              inputMode="numeric"
              value={formatNanpPhone(editedRestaurantPhone)}
              onChange={(e) => setEditedRestaurantPhone(extractTenDigitPhone(e.target.value))}
              onPaste={(e) => {
                e.preventDefault();
                setEditedRestaurantPhone(
                  extractTenDigitPhoneFromPaste(e.clipboardData.getData("text")),
                );
              }}
              placeholder="+1 (306) 764-7799"
              className={`${inputClass} min-w-0 flex-1 placeholder:text-foreground/35`}
            />
          </label>
          <SaveFooter
            error={restaurantPhoneError}
            dirty={hasRestaurantPhoneChanges}
            saving={savingRestaurantPhone}
            label="Save phone number"
          />
        </form>
      </SettingsCard>

      {/* Holidays */}
      <SettingsCard
        title="Holidays"
        description="Days the restaurant is closed. Online orders and reservations are off on these days."
        action={
          !showHolidayForm && (
            <button
              type="button"
              onClick={() => setShowHolidayForm(true)}
              className={secondaryButtonClass}
            >
              + Add holiday
            </button>
          )
        }
      >
        {showHolidayForm && (
          <form
            onSubmit={handleAddHoliday}
            className="mb-4 space-y-4 rounded-lg border border-foreground/10 bg-foreground/[0.02] p-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
              <label className="flex-1">
                <span className="mb-1.5 block text-xs font-medium text-foreground/60">From</span>
                <input
                  type="date"
                  value={holidayFrom}
                  onChange={(e) => setHolidayFrom(e.target.value)}
                  required
                  className={`${inputClass} w-full`}
                />
              </label>
              <span className="text-sm text-foreground/40 sm:pb-2.5">to</span>
              <label className="flex-1">
                <span className="mb-1.5 block text-xs font-medium text-foreground/60">
                  To <span className="text-foreground/40">(optional)</span>
                </span>
                <input
                  type="date"
                  value={holidayTo}
                  min={holidayFrom || undefined}
                  onChange={(e) => setHolidayTo(e.target.value)}
                  className={`${inputClass} w-full`}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowHolidayForm(false);
                  setHolidayFrom("");
                  setHolidayTo("");
                  setHolidayError(null);
                }}
                disabled={addingHoliday}
                className={`${secondaryButtonClass} disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingHoliday || !holidayFrom}
                className={`${primaryButtonClass} disabled:opacity-50`}
              >
                {addingHoliday ? "Adding…" : "Add holiday"}
              </button>
            </div>
          </form>
        )}

        {holidayError && (
          <p className="mb-3 text-sm text-red-600" role="alert">{holidayError}</p>
        )}

        {holidays.length === 0 ? (
          <p className="text-sm text-foreground/50">No holidays added yet.</p>
        ) : (
          <ul className="divide-y divide-foreground/10 overflow-hidden rounded-lg border border-foreground/10">
            {holidays.map((h) => (
              <li
                key={h.id}
                className={`flex items-center justify-between gap-4 px-3 py-2 ${
                  h.status === "past" ? "bg-foreground/[0.015]" : ""
                } ${deletingHolidayId === h.id ? "opacity-50" : ""}`}
              >
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p
                    className={`text-sm font-medium ${
                      h.status === "past" ? "text-foreground/40" : "text-foreground"
                    }`}
                  >
                    {h.to
                      ? `${formatDateDisplay(h.from)} – ${formatDateDisplay(h.to)}`
                      : formatDateDisplay(h.from)}
                  </p>
                  {h.status === "now" && (
                    <span className="rounded-full border border-green-300 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      Now
                    </span>
                  )}
                  {h.status === "past" && (
                    <span className="rounded-full border border-foreground/10 bg-foreground/5 px-2 py-0.5 text-xs font-medium text-foreground/50">
                      Past
                    </span>
                  )}
                </div>
                <RemoveButton
                  onClick={() => {
                    if (deletingHolidayId !== h.id) void handleDeleteHoliday(h.id);
                  }}
                  label={`Remove holiday ${formatDateDisplay(h.from)}`}
                />
              </li>
            ))}
          </ul>
        )}
      </SettingsCard>
    </div>
  );
}

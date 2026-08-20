"use client";

import { useState, useEffect } from "react";
import { useStoreSettingsStore } from "@/stores/storeSettingsStore";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

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

export function StoreSettingsForm() {
  const { settings, loading, error, updateSettings, fetchStoreSettings } =
    useStoreSettingsStore();

  useEffect(() => {
    void fetchStoreSettings();
  }, [fetchStoreSettings]);

  const [editedTimezone, setEditedTimezone] = useState(
    () => settings?.timezone ?? "",
  );
  const [editedHours, setEditedHours] = useState<StoreSettings["hours"] | null>(
    () => (settings ? structuredClone(settings.hours) : null),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const hasHoursChanges =
    editedTimezone !== (settings?.timezone ?? "") ||
    JSON.stringify(editedHours) !== JSON.stringify(settings?.hours ?? null);

  const [editedWaitTime, setEditedWaitTime] = useState(
    () => settings?.waitTime ?? 0,
  );
  const [savingWaitTime, setSavingWaitTime] = useState(false);
  const [waitTimeError, setWaitTimeError] = useState<string | null>(null);

  const hasWaitTimeChanges = editedWaitTime !== (settings?.waitTime ?? 0);

  const [editedRestaurantPhone, setEditedRestaurantPhone] = useState(
    () => settings?.restaurantPhoneNumber ?? "",
  );
  const [savingRestaurantPhone, setSavingRestaurantPhone] = useState(false);
  const [restaurantPhoneError, setRestaurantPhoneError] = useState<string | null>(null);

  const hasRestaurantPhoneChanges =
    editedRestaurantPhone !== (settings?.restaurantPhoneNumber ?? "");

  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [holidayFrom, setHolidayFrom] = useState("");
  const [holidayTo, setHolidayTo] = useState("");
  const [addingHoliday, setAddingHoliday] = useState(false);
  const [deletingHolidayId, setDeletingHolidayId] = useState<string | null>(null);
  const [holidayError, setHolidayError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setEditedTimezone(settings.timezone);
      setEditedHours(structuredClone(settings.hours));
      setEditedWaitTime(settings.waitTime ?? 0);
      setEditedRestaurantPhone(settings.restaurantPhoneNumber ?? "");
    }
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
    const trimmed = editedRestaurantPhone.trim();
    if (!/^\+[1-9]\d{6,14}$/.test(trimmed)) {
      setRestaurantPhoneError('Enter a valid phone number in E.164 format, e.g. "+13065551234".');
      return;
    }
    setRestaurantPhoneError(null);
    setSavingRestaurantPhone(true);
    try {
      await updateSettings({ restaurantPhoneNumber: trimmed });
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
    try {
      await updateSettings({
        holidays: (settings.holidays ?? []).filter((h) => h.id !== id),
      });
    } finally {
      setDeletingHolidayId(null);
    }
  }

  if (loading) {
    return <p className="text-foreground/50 text-sm">Loading settings…</p>;
  }

  if (error) {
    return <p className="text-red-500 text-sm" role="alert">{error}</p>;
  }

  if (!settings || !editedHours) {
    return <p className="text-foreground/50 text-sm">No settings found.</p>;
  }

  const holidays = settings.holidays ?? [];

  return (
    <div className="space-y-10 max-w-2xl">

      {/* Store Hours */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-4">Store Hours</h2>
        <form onSubmit={handleSaveHours} className="space-y-4">

          {/* Timezone */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground/60 shrink-0 w-24">Timezone</span>
            <select
              id="settings-timezone"
              value={editedTimezone}
              onChange={(e) => setEditedTimezone(e.target.value)}
              className="flex-1 rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              {CANADA_TIMEZONES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Days */}
          <div className="rounded-xl border border-foreground/10 overflow-hidden">
            {DAY_LABELS.map(({ key, label }, i) => {
              const day = editedHours[key];
              return (
                <div
                  key={key}
                  className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-foreground/8" : ""} ${!day.isOpen ? "bg-foreground/[0.015]" : ""}`}
                >
                  <span className={`w-24 shrink-0 text-sm font-medium ${day.isOpen ? "text-foreground" : "text-foreground/35"}`}>
                    {label}
                  </span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={day.isOpen}
                    onClick={() => updateDay(key, { isOpen: !day.isOpen })}
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
                    <div className="flex items-center gap-2 ml-auto">
                      <input
                        type="time"
                        value={day.open}
                        onChange={(e) => updateDay(key, { open: e.target.value })}
                        className="rounded-lg border border-foreground/15 bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      />
                      <span className="text-xs text-foreground/40">to</span>
                      <input
                        type="time"
                        value={day.close}
                        onChange={(e) => updateDay(key, { close: e.target.value })}
                        className="rounded-lg border border-foreground/15 bg-background px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                      />
                    </div>
                  ) : (
                    <span className="ml-auto text-sm text-foreground/30">Closed</span>
                  )}
                </div>
              );
            })}
          </div>

          {saveError && <p className="text-red-500 text-sm" role="alert">{saveError}</p>}

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={saving || !hasHoursChanges}
              className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Hours"}
            </button>
          </div>
        </form>
      </section>

      {/* Wait Time */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-4">Order Wait Time</h2>
        <form onSubmit={handleSaveWaitTime} className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground/60 shrink-0 w-24">Wait time</span>
            <input
              type="number"
              min={0}
              step={1}
              value={editedWaitTime}
              onChange={(e) => setEditedWaitTime(Math.max(0, Number(e.target.value)))}
              className="w-28 rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
            <span className="text-sm text-foreground/40">minutes</span>
          </div>

          {waitTimeError && <p className="text-red-500 text-sm" role="alert">{waitTimeError}</p>}

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={savingWaitTime || !hasWaitTimeChanges}
              className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
            >
              {savingWaitTime ? "Saving…" : "Save Wait Time"}
            </button>
          </div>
        </form>
      </section>

      {/* Restaurant Phone (confirmation-call alert) */}
      <section>
        <h2 className="text-base font-semibold text-foreground mb-1">Restaurant Phone</h2>
        <p className="text-sm text-foreground/50 mb-4">
          Called automatically if a new order sits unconfirmed for 30 seconds.
        </p>
        <form onSubmit={handleSaveRestaurantPhone} className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground/60 shrink-0 w-24">Phone number</span>
            <input
              type="tel"
              value={editedRestaurantPhone}
              onChange={(e) => setEditedRestaurantPhone(e.target.value)}
              placeholder="+13065551234"
              className="flex-1 rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          {restaurantPhoneError && (
            <p className="text-red-500 text-sm" role="alert">{restaurantPhoneError}</p>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={savingRestaurantPhone || !hasRestaurantPhoneChanges}
              className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
            >
              {savingRestaurantPhone ? "Saving…" : "Save Phone Number"}
            </button>
          </div>
        </form>
      </section>

      {/* Holidays */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Holidays</h2>
          {!showHolidayForm && (
            <button
              type="button"
              onClick={() => setShowHolidayForm(true)}
              className="rounded-lg bg-foreground text-background px-3 py-1.5 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              + Add Holiday
            </button>
          )}
        </div>

        {showHolidayForm && (
          <form
            onSubmit={handleAddHoliday}
            className="mb-4 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 space-y-4"
          >
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-foreground/60 mb-1.5">
                  From <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={holidayFrom}
                  onChange={(e) => setHolidayFrom(e.target.value)}
                  required
                  className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>
              <span className="text-sm text-foreground/40 pb-2.5">to</span>
              <div className="flex-1">
                <label className="block text-xs font-medium text-foreground/60 mb-1.5">
                  To <span className="text-foreground/35">(optional)</span>
                </label>
                <input
                  type="date"
                  value={holidayTo}
                  min={holidayFrom || undefined}
                  onChange={(e) => setHolidayTo(e.target.value)}
                  className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
                />
              </div>
            </div>

            {holidayError && (
              <p className="text-red-500 text-sm" role="alert">{holidayError}</p>
            )}

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowHolidayForm(false);
                  setHolidayFrom("");
                  setHolidayTo("");
                  setHolidayError(null);
                }}
                disabled={addingHoliday}
                className="rounded-lg border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingHoliday || !holidayFrom}
                className="rounded-lg bg-foreground text-background px-3 py-1.5 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
              >
                {addingHoliday ? "Adding…" : "Add"}
              </button>
            </div>
          </form>
        )}

        {holidays.length === 0 ? (
          <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] px-4 py-6 text-center">
            <p className="text-sm text-foreground/40">No holidays added yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-foreground/10 overflow-hidden">
            {holidays.map((h, i) => (
              <div
                key={h.id}
                className={`flex items-center justify-between gap-4 px-4 py-3 ${i > 0 ? "border-t border-foreground/8" : ""}`}
              >
                <p className="text-sm font-medium text-foreground">
                  {h.to
                    ? `${formatDateDisplay(h.from)} – ${formatDateDisplay(h.to)}`
                    : formatDateDisplay(h.from)}
                </p>
                <button
                  type="button"
                  onClick={() => handleDeleteHoliday(h.id)}
                  disabled={deletingHolidayId === h.id}
                  className="shrink-0 rounded-lg border border-foreground/15 px-2.5 py-1 text-xs font-medium text-foreground/50 hover:border-red-300 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50 transition-colors"
                >
                  {deletingHolidayId === h.id ? "…" : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

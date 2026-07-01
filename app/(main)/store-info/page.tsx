"use client";

import { useEffect, useState } from "react";
import { useHoursStore } from "@/stores/hoursStore";
import { AddHourModal } from "@/components/store-info/AddHourModal";
import { EditHourModal } from "@/components/store-info/EditHourModal";
import { confirmDialog } from "@/stores/modalStore";

export default function StoreInfoPage() {
  const { hours, loading, error, fetchHours, addHour, updateHour, deleteHour } =
    useHoursStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingHour, setEditingHour] = useState<StoreHour | null>(null);

  useEffect(() => {
    void fetchHours();
  }, [fetchHours]);

  async function handleDelete(hour: StoreHour) {
    if (await confirmDialog(`Delete "${hour.days}" entry?`, { danger: true, confirmLabel: "Delete" })) {
      void deleteHour(hour.id);
    }
  }

  return (
    <div className="min-w-0">
      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
            Store Hours
          </h2>
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            Add Hours
          </button>
        </div>

        {error && (
          <p
            className="text-red-600 dark:text-red-400 text-sm mb-4"
            role="alert"
          >
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-foreground/60 text-sm">Loading hours…</p>
        ) : hours.length === 0 ? (
          <p className="text-foreground/70 text-sm">
            No hours added yet. Add an entry to get started.
          </p>
        ) : (
          <ul className="space-y-2">
            {hours.map((hour) => (
              <li
                key={hour.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-foreground/10 bg-foreground/[0.02] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {hour.days}
                  </p>
                  <p className="text-sm text-foreground/60">{hour.time}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingHour(hour)}
                    className="rounded-lg border border-foreground/20 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-foreground/5"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(hour)}
                    className="rounded-lg border border-red-600 text-red-600 px-3 py-1.5 text-sm font-medium hover:bg-red-600 hover:text-white"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <AddHourModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={addHour}
      />
      <EditHourModal
        open={!!editingHour}
        hour={editingHour}
        onClose={() => setEditingHour(null)}
        onSave={updateHour}
      />
    </div>
  );
}

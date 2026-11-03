"use client";

import { useState } from "react";
import Link from "next/link";
import { useHoursStore } from "@/stores/hoursStore";
import { AddHourModal } from "@/components/store-info/AddHourModal";
import { EditHourModal } from "@/components/store-info/EditHourModal";
import { MenuPageHeader } from "@/components/menu/MenuPageHeader";
import { primaryButtonClass } from "@/components/ui/Button";
import { RowActions, rowCardClass } from "@/components/menu/RowParts";
import { alertDialog, confirmDialog } from "@/stores/modalStore";

function ArrowIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg
      className={`h-4 w-4 ${direction === "down" ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  );
}

const moveButtonClass =
  "inline-flex h-7 w-7 items-center justify-center rounded-md text-foreground/50 hover:bg-foreground/5 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 disabled:pointer-events-none disabled:opacity-30";

export default function StoreInfoPage() {
  const { hours, loading, error, addHour, updateHour, deleteHour, reorderHours } =
    useHoursStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editingHour, setEditingHour] = useState<StoreHour | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);

  async function handleDelete(hour: StoreHour) {
    if (
      !(await confirmDialog(`Delete "${hour.days}"? This cannot be undone.`, {
        danger: true,
        confirmLabel: "Delete",
      }))
    )
      return;
    setDeletingId(hour.id);
    try {
      await deleteHour(hour.id);
    } catch {
      await alertDialog(`Couldn't delete "${hour.days}". Try again.`);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleMove(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= hours.length) return;
    const ids = hours.map((h) => h.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setMoving(true);
    try {
      await reorderHours(ids);
    } catch {
      await alertDialog("Couldn't change the order. Try again.");
    } finally {
      setMoving(false);
    }
  }

  return (
    <div className="min-w-0">
      <MenuPageHeader
        title="Store hours"
        count={loading && hours.length === 0 ? undefined : hours.length}
      >
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className={primaryButtonClass}
        >
          + Add hours
        </button>
      </MenuPageHeader>

      <p className="-mt-2 mb-4 text-sm text-foreground/60">
        Hours shown on the website, in this order. Online ordering and reservation
        hours are set in{" "}
        <Link
          href="/settings"
          className="font-medium text-foreground underline underline-offset-2 hover:opacity-80"
        >
          Settings
        </Link>
        .
      </p>

      {error && (
        <p className="text-red-600 text-sm mb-4" role="alert">
          {error}
        </p>
      )}

      {loading && hours.length === 0 ? (
        <p className="text-foreground/60 text-sm">Loading hours…</p>
      ) : hours.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-6">
          <p className="text-foreground text-sm font-medium">No hours yet.</p>
          <p className="mt-1 text-foreground/60 text-sm">
            Add a line like &ldquo;Mon – Fri&rdquo; / &ldquo;11 AM – 9 PM&rdquo; to show it on the website.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {hours.map((hour, index) => {
            const deleting = deletingId === hour.id;
            return (
              <li
                key={hour.id}
                className={`${rowCardClass} flex items-center gap-3 py-3 pl-2 pr-3 sm:pr-4 ${
                  deleting ? "opacity-50" : ""
                }`}
              >
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => handleMove(index, -1)}
                    disabled={moving || index === 0}
                    aria-label={`Move ${hour.days} up`}
                    className={moveButtonClass}
                  >
                    <ArrowIcon direction="up" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 1)}
                    disabled={moving || index === hours.length - 1}
                    aria-label={`Move ${hour.days} down`}
                    className={moveButtonClass}
                  >
                    <ArrowIcon direction="down" />
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground break-words">{hour.days}</p>
                  <p className="mt-0.5 text-sm text-foreground/60 break-words">{hour.time}</p>
                </div>
                <RowActions
                  name={hour.days}
                  onEdit={() => setEditingHour(hour)}
                  onDelete={() => handleDelete(hour)}
                  deleting={deleting}
                />
              </li>
            );
          })}
        </ul>
      )}

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
